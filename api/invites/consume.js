// /api/invites/consume.js
export const config = { runtime: "nodejs18.x" };

import { db } from "../_firebaseAdmin.js";

export default async function handler(req, res) {
  try {
    if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
    const { inviteId } = req.body || {};
    if (!inviteId) return res.status(400).json({ error: "inviteId required" });

    const ref = db.collection("invites").doc(inviteId);
    await db.runTransaction(async (tx) => {
      const snap = await tx.get(ref);
      if (!snap.exists) throw new Error("Invite not found");
      const data = snap.data();
      if (data.used) throw new Error("Invite already used");
      if (data.expiresAt.toMillis() < Date.now()) throw new Error("Invite expired");
      tx.update(ref, { used: true, usedAt: new Date() });
    });

    res.json({ ok: true });
  } catch (e) {
    console.error("INVITE_CONSUME", e);
    res.status(400).json({ error: e.message || "Failed to consume invite" });
  }
}
