// /api/invites/consume.js
import "./_firebaseAdmin.js"; // <-- fixed path to your admin init
import { getFirestore, FieldValue } from "firebase-admin/firestore";

export default async function handler(req, res) {
  try {
    if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

    const { inviteId, token, softDelete = false } = req.body || {};
    if (!inviteId && !token) return res.status(400).json({ error: "inviteId or token required" });

    const db = getFirestore();

    // Resolve the invite doc
    let ref, snap;
    if (inviteId) {
      ref = db.collection("invites").doc(inviteId);
      snap = await ref.get();
    } else {
      const q = await db.collection("invites").where("token", "==", token).limit(1).get();
      if (q.empty) return res.status(404).json({ error: "Invite not found" });
      ref = q.docs[0].ref;
      snap = q.docs[0];
    }

    if (!snap.exists) return res.status(404).json({ error: "Invite not found" });

    const inv = snap.data();

    // Validate status / used / expiry (all optional/defensive)
    if (inv.used === true || (inv.status && inv.status !== "pending")) {
      return res.status(400).json({ error: "Invite already used or not pending" });
    }
    if (inv.expiresAt?.toMillis && inv.expiresAt.toMillis() < Date.now()) {
      return res.status(400).json({ error: "Invite expired" });
    }

    // TODO: upsert the user here if you haven't already (optional):
    // const userId = inv.userId || inv.email;
    // await db.collection("users").doc(userId).set(
    //   { name: inv.name || "", email: inv.email, role: inv.role || "collaborator", workspaceIds: inv.workspaceIds || [], acceptedAt: FieldValue.serverTimestamp() },
    //   { merge: true }
    // );

    // Remove the invite so it disappears from the UI
    if (softDelete) {
      // mark accepted (UI should filter these out)
      await ref.update({ status: "accepted", used: true, usedAt: FieldValue.serverTimestamp() });
    } else {
      // hard delete
      await ref.delete();
    }

    return res.status(200).json({ ok: true });
  } catch (e) {
    console.error("INVITE_CONSUME", e);
    return res.status(400).json({ error: e.message || "Failed to consume invite" });
  }
}
