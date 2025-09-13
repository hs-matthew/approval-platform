// /api/invites/create.js
export const config = { runtime: "nodejs18.x" };

import crypto from "crypto";
import { Timestamp } from "firebase-admin/firestore";
import { db } from "../_firebaseAdmin.js";

const { MAILGUN_DOMAIN, MAILGUN_KEY, APP_HOST } = process.env;

function sha256(s) {
  return crypto.createHash("sha256").update(s).digest("hex");
}

async function sendMailgun({ to, subject, text, html }) {
  const url = `https://api.mailgun.net/v3/${MAILGUN_DOMAIN}/messages`;
  const form = new URLSearchParams();
  form.append("from", `Headspace Media <noreply@${MAILGUN_DOMAIN}>`);
  form.append("to", to);
  form.append("subject", subject);
  form.append("text", text);
  form.append("html", html);

  const res = await fetch(url, {
    method: "POST",
    headers: { Authorization: "Basic " + Buffer.from(`api:${MAILGUN_KEY}`).toString("base64") },
    body: form,
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Mailgun error: ${res.status} ${body}`);
  }
}

export default async function handler(req, res) {
  try {
    if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

    const {
      email,
      role = "collaborator",
      workspaceIds = [],
      collaboratorPerms = { content: true, audits: false, reports: false },
      createdBy = "system",
      // optional: expiresInDays
    } = req.body || {};

    const normalizedEmail = String(email || "").trim().toLowerCase();
    if (!normalizedEmail) return res.status(400).json({ error: "Email required" });

    const token = crypto.randomBytes(32).toString("hex");
    const tokenHash = sha256(token);

    const expiresAt = Timestamp.fromDate(
      new Date(Date.now() + 1000 * 60 * 60 * 24 * 7) // 7 days
    );

    await db.collection("invites").add({
      email: normalizedEmail,
      role: String(role).toLowerCase(),
      workspaceIds: Array.isArray(workspaceIds) ? workspaceIds.map(String) : [],
      collaboratorPerms,
      tokenHash,
      used: false,
      createdBy,
      createdAt: Timestamp.now(),
      expiresAt,
    });

    const link = `${APP_HOST}/accept-invite?token=${encodeURIComponent(token)}`;

    await sendMailgun({
      to: normalizedEmail,
      subject: "Your invite to Headspace Media",
      text: `Welcome! Click to set your password: ${link}`,
      html: `<p>Welcome! Click below to set your password and finish setup:</p>
             <p><a href="${link}">Accept Invite</a></p>
             <p>If you didn’t expect this, you can ignore this email.</p>`,
    });

    res.json({ ok: true });
  } catch (e) {
    console.error("INVITE_CREATE", e);
    res.status(500).json({ error: e.message || "Internal error" });
  }
}
