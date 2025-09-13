// /api/invites/validate.js
export const config = { runtime: "nodejs18.x" };

import crypto from "crypto";
import { db } from "../_firebaseAdmin.js";

function sha256(s) {
  return crypto.createHash("sha256").update(s).digest("hex");
}

export default async function handler(req, res) {
  try {
    const token = String(req.query.token || "");
    if (!token) return res.status(400).json({ valid: false });

    const tokenHash = sha256(token);
    const snap = await db
      .collection("invites")
      .where("tokenHash", "==", tokenHash)
      .where("used", "==", false)
      .limit(1)
      .get();

    if (snap.empty) return res.json({ valid: false });

    const doc = snap.docs[0];
    const data = doc.data();
    if (data.expiresAt.toMillis() < Date.now()) {
      return res.json({ valid: false, reason: "expired" });
    }

    res.json({
      valid: true,
      inviteId: doc.id,
      email: data.email,
      role: data.role,
      workspaceIds: data.workspaceIds || [],
      collaboratorPerms: data.collaboratorPerms || { content: true, audits: false, reports: false },
    });
  } catch (e) {
    console.error("INVITE_VALIDATE", e);
    res.status(500).json({ valid: false });
  }
}
