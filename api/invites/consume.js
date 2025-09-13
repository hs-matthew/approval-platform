// /api/invites/consume.js
export const config = { runtime: "nodejs" };

import "./_firebaseAdmin.js"; // initializes Admin SDK
import crypto from "crypto";
import { getFirestore } from "firebase-admin/firestore";

function sha256(s) {
  return crypto.createHash("sha256").update(s).digest("hex");
}

export default async function handler(req, res) {
  const started = Date.now();
  try {
    if (req.method !== "POST") {
      res.setHeader("Allow", ["POST"]);
      return res.status(405).json({ ok: false, reason: "method_not_allowed" });
    }

    const body = typeof req.body === "object" ? req.body : {};
    const inviteId = body?.inviteId ? String(body.inviteId) : null;
    const token = body?.token ? String(body.token) : null;
    const softDelete = body?.softDelete !== undefined ? !!body.softDelete : true;

    if (!inviteId && !token) {
      return res.status(400).json({ ok: false, reason: "missing_params" });
    }

    const db = getFirestore();

    // Locate invite by ID first, then by tokenHash
    let ref = null;
    let data = null;

    if (inviteId) {
      const snap = await db.collection("invites").doc(inviteId).get();
      if (snap.exists) {
        ref = snap.ref;
        data = snap.data();
      }
    }

    if (!ref && token) {
      const tokenHash = sha256(token);
      const q = await db.collection("invites").where("tokenHash", "==", tokenHash).limit(1).get();
      if (!q.empty) {
        ref = q.docs[0].ref;
        data = q.docs[0].data();
      }
    }

    if (!ref) {
      return res.status(404).json({ ok: false, reason: "not_found" });
    }

    // Guards (idempotent)
    const isExpired =
      data?.expiresAt?.toMillis && data.expiresAt.toMillis() < Date.now();

    if (data?.used === true || (data?.status && data.status !== "pending")) {
      // Already consumed—treat as success so the client can proceed
      return res.status(200).json({ ok: true, alreadyUsed: true });
    }

    if (isExpired) {
      return res.status(410).json({ ok: false, reason: "expired" });
    }

    // Consume: soft delete (default) or hard delete
    if (softDelete) {
      await ref.set(
        { used: true, status: "accepted", usedAt: new Date() },
        { merge: true }
      );
    } else {
      await ref.delete();
    }

    return res.status(200).json({ ok: true, ms: Date.now() - started });
  } catch (e) {
    console.error("INVITE_CONSUME_ERR", e);
    return res.status(500).json({
      ok: false,
      reason: "server_error",
      message: e?.message || "Failed to consume invite",
    });
  }
}
