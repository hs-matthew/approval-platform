// /api/invites/validate.js
export const config = { runtime: "nodejs" };

import crypto from "crypto";
import { db } from "../_firebaseAdmin.js";

function sha256(s) {
  return crypto.createHash("sha256").update(s).digest("hex");
}

export default async function handler(req, res) {
  try {
    const token = String((req.query.token || "")).trim();
    if (!token) return res.status(400).json({ valid: false, reason: "missing_token" });

    const tokenHash = sha256(token);
    const snap = await db
      .collection("invites")
      .where("tokenHash", "==", tokenHash)
      .limit(1)
      .get();

    if (snap.empty) {
      console.log("[validate] not_found for tokenHash", tokenHash.slice(0, 8));
      return res.json({ valid: false, reason: "not_found" });
    }

    const doc = snap.docs[0];
    const data = doc.data();

    if (data.used) {
      return res.json({ valid: false, reason: "used" });
    }

    // If no expiresAt present, treat as valid (backward compatible).
    if (data.expiresAt && data.expiresAt.toMillis() < Date.now()) {
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
    res.status(500).json({ valid: false, reason: "server_error" });
  }
}
