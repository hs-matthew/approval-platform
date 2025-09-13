// pages/api/invites/validate.js
export const config = { runtime: "nodejs" };

import crypto from "crypto";
import { db } from "../_firebaseAdmin.js";

function sha256(s) {
  return crypto.createHash("sha256").update(s).digest("hex");
}

export default async function handler(req, res) {
  try {
    if (req.method !== "POST") {
      res.setHeader("Allow", ["POST"]);
      return res.status(405).end("Method Not Allowed");
    }

    // IMPORTANT: Ensure Next.js body parser is enabled (default).
    // If you previously disabled it: remove export const config.api.bodyParser = false

    const token = String(req.body?.token || "").trim();
    if (!token) {
      return res.status(400).json({ valid: false, reason: "missing_token" });
    }

    const tokenHash = sha256(token);
    const snap = await db
      .collection("invites")
      .where("tokenHash", "==", tokenHash)
      .limit(1)
      .get();

    if (snap.empty) {
      return res.status(404).json({ valid: false, reason: "not_found" });
    }

    const docRef = snap.docs[0];
    const data = docRef.data();

    if (data.used) {
      return res.status(409).json({ valid: false, reason: "used" });
    }

    if (data.expiresAt && data.expiresAt.toMillis() < Date.now()) {
      return res.status(410).json({ valid: false, reason: "expired" });
    }

    const invite = {
      inviteId: docRef.id,
      email: data.email,
      role: data.role,
      workspaceIds: data.workspaceIds || [],
      collaboratorPerms:
        data.collaboratorPerms || { content: true, audits: false, reports: false },
    };

    return res.status(200).json({ valid: true, invite });
  } catch (e) {
    console.error("INVITE_VALIDATE", e);
    return res.status(500).json({ valid: false, reason: "server_error" });
  }
}
