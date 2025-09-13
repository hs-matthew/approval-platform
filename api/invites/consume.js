// /api/invites/consume.js
export const config = { runtime: "nodejs" };

import "./_firebaseAdmin.js"; // initializes Firebase Admin once
import crypto from "crypto";
import { getFirestore, FieldValue } from "firebase-admin/firestore";

function sha256(s) {
  return crypto.createHash("sha256").update(s).digest("hex");
}

export default async function handler(req, res) {
  const t0 = Date.now();
  try {
    if (req.method !== "POST") {
      res.setHeader("Allow", ["POST"]);
      return res.status(405).json({ ok: false, reason: "method_not_allowed" });
    }

    // Body parse guard (Pages API normally parses JSON; this protects empty/invalid)
    const body = typeof req.body === "object" ? req.body : {};
    const inviteId = body?.inviteId ? String(body.inviteId) : null;
    const token    = body?.token ? String(body.token) : null;
    const softDelete = body?.softDelete !== undefined ? !!body.softDelete : true;

    if (!inviteId && !token) {
      console.error("[consume] missing_params", { body });
      return res.status(400).json({ ok: false, reason: "missing_params" });
    }

    const db = getFirestore();

    // Locate invite by id first, then by tokenHash (mirrors validate.js)
    let ref = null;
    let data = null;

    if (inviteId) {
      const snap = await db.collection("invites").doc(inviteId).get();
      if (snap.exists) {
        ref = snap.ref;
        data = snap.data();
      } else {
        console.warn("[consume] inviteId_not_found", inviteId);
      }
    }

    if (!ref && token) {
      const tokenHash = sha256(token);
      const q = await db.collection("invites").where("tokenHash", "==", tokenHash).limit(1).get();
      if (!q.empty) {
        ref = q.docs[0].ref;
        data = q.docs[0].data();
      } else {
        console.warn("[consume] tokenHash_not_found", tokenHash.slice(0, 12));
      }
    }

    if (!ref) {
      return res.status(404).json({ ok: false, reason: "not_found" });
    }

    // Guards (idempotent)
    const now = Date.now();
    const isExpired = data?.expiresAt?.toMillis && data.expiresAt.toMillis() < now;

    if (data?.used === true || (data?.status && data.status !== "pending")) {
      console.info("[consume] already_used_or_not_pending", { id: ref.id, status: data?.status });
      return res.status(200).json({ ok: true, alreadyUsed: true });
    }

    if (isExpired) {
      console.info("[consume] expired", { id: ref.id });
      return res.status(410).json({ ok: false, reason: "expired" });
    }

    // Consume invite
    if (softDelete) {
      await ref.set(
        { used: true, status: "accepted", usedAt: FieldValue.serverTimestamp() },
        { merge: true }
      );
    } else {
      await ref.delete();
    }

    console.info("[consume] ok", { id: ref.id, ms: Date.now() - t0 });
    return res.status(200).json({ ok: true });
  } catch (e) {
    console.error("INVITE_CONSUME_ERR", { msg: e?.message, stack: e?.stack });
    return res.status(500).json({ ok: false, reason: "server_error", message: e?.message || "Failed to consume invite" });
  }
}
