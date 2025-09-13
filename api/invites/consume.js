// /api/invites/consume.js
export const config = { runtime: "nodejs" };

import "./_firebaseAdmin.js"; // initializes admin SDK
import crypto from "crypto";
import { getFirestore, FieldValue } from "firebase-admin/firestore";

function sha256(s) {
  return crypto.createHash("sha256").update(s).digest("hex");
}

export default async function handler(req, res) {
  try {
    if (req.method !== "POST") {
      res.setHeader("Allow", ["POST"]);
      return res.status(405).json({ ok: false, reason: "method_not_allowed" });
    }

    const { inviteId, token, softDelete = true } = req.body || {};
    if (!inviteId && !token) {
      return res.status(400).json({ ok: false, reason: "missing_params" });
    }

    const db = getFirestore();

    // ---- Locate invite by id or tokenHash
    let ref = null;
    let data = null;

    if (inviteId) {
      const snap = await db.collection("invites").doc(String(inviteId)).get();
      if (snap.exists) {
        ref = snap.ref;
        data = snap.data();
      }
    }

    if (!ref && token) {
      const tokenHash = sha256(String(token));
      const q = await db
        .collection("invites")
        .where("tokenHash", "==", tokenHash)
        .limit(1)
        .get();
      if (!q.empty) {
        ref = q.docs[0].ref;
        data = q.docs[0].data();
      }
    }

    if (!ref) {
      return res.status(404).json({ ok: false, reason: "not_found" });
    }

    const now = Date.now();
    const isExpired = data?.expiresAt?.toMillis && data.expiresAt.toMillis() < now;

    // ---- Idempotency & guards
    if (data?.used === true || (data?.status && data.status !== "pending")) {
      // Treat already-used as success so the client can proceed
      return res.status(200).json({ ok: true, alreadyUsed: true });
    }
    if (isExpired) {
      return res.status(410).json({ ok: false, reason: "expired" });
    }

    // ---- Soft-delete (default) vs hard delete
    if (softDelete) {
      await ref.set(
        { used: true, status: "accepted", usedAt: FieldValue.serverTimestamp() },
        { merge: true }
      );
    } else {
      await ref.delete();
    }

    return res.status(200).json({ ok: true });
  } catch (e) {
    console.error("INVITE_CONSUME", e);
    return res.status(500).json({ ok: false, reason: "server_error", message: e?.message });
  }
}
