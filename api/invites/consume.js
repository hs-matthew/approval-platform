// /api/invites/consume.js
export const config = { runtime: "nodejs" };

import crypto from "crypto";
import { db } from "../_firebaseAdmin.js"; // ✅ correct relative path

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

    // ---- Locate invite by ID first, then by tokenHash (matches validate.js)
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

    if (!ref) return res.status(404).json({ ok: false, reason: "not_found" });

    // ---- Guards (idempotent)
    const isExpired = data?.expiresAt?.toMillis && data.expiresAt.toMillis() < Date.now();
    if (data?.used === true || (data?.status && data.status !== "pending")) {
      return res.status(200).json({ ok: true, alreadyUsed: true });
    }
    if (isExpired) return res.status(410).json({ ok: false, reason: "expired" });

    // ---- Consume: soft delete by default; hard delete if requested
    if (softDelete) {
      await ref.set(
        { used: true, status: "accepted", usedAt: new Date() },
        { merge: true }
      );
    } else {
      await ref.delete();
    }

    return res.status(200).json({ ok: true });
  } catch (e) {
    console.error("INVITE_CONSUME_ERR", e);
    return res.status(500).json({
      ok: false,
      reason: "server_error",
      message: e?.message || "Failed to consume invite",
    });
  }
}
