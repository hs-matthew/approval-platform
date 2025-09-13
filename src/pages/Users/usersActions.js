// src/pages/Users/usersActions.js
import {
  addDoc,
  collection,
  doc,
  serverTimestamp,
  setDoc,
  updateDoc,
  deleteField,
  getDocs,
  query,
  where,
  limit,
} from "firebase/firestore";
import { db, auth } from "../../lib/firebase";

/** =========================
 * Role + perms guards
 * ========================= */
export function normalizeRole(role) {
  const r = String(role || "collaborator").toLowerCase();
  const allowed = ["owner", "admin", "staff", "client", "collaborator"];
  const clean = allowed.includes(r) ? r : "collaborator";
  // UI may not create "owner" — demote to admin
  return clean === "owner" ? "admin" : clean;
}

export const DEFAULT_COLLAB_PERMS = { content: true, audits: false, reports: false };

/** Find an existing user doc by email (returns {id, data} or null) */
export async function findUserByEmail(email) {
  const normalizedEmail = String(email || "").trim().toLowerCase();
  if (!normalizedEmail) return null;
  const qSnap = await getDocs(
    query(collection(db, "users"), where("email", "==", normalizedEmail), limit(1))
  );
  if (qSnap.empty) return null;
  const d = qSnap.docs[0];
  return { id: d.id, data: d.data() };
}

/** =========================
 * Add user + send invite
 * =========================
 * - Upserts admin-facing user record in Firestore
 * - Calls /api/invites/create to generate a secure token & email via Mailgun
 *
 * @param {{
 *  name?: string,
 *  email: string,
 *  role?: "owner"|"admin"|"staff"|"client"|"collaborator",
 *  workspaceIds?: string[],
 *  collaboratorPerms?: {content?:boolean,audits?:boolean,reports?:boolean}|null
 * }} payload
 */
export async function addUserWithInvite(payload) {
  const {
    name = "",
    email = "",
    role = "collaborator",
    workspaceIds = [],
    collaboratorPerms = null,
  } = payload;

  const normalizedEmail = String(email).trim().toLowerCase();
  const roleNorm = normalizeRole(role);
  const createdBy = auth.currentUser?.uid || "system";
  const safeWorkspaceIds = Array.isArray(workspaceIds) ? workspaceIds.map(String) : [];

  // Admin-facing user record (not Auth)
  const baseData = {
    name: String(name).trim(),
    email: normalizedEmail,
    role: roleNorm, // admin | staff | client | collaborator
    isActive: true,
    lastLogin: null,
    workspaceIds: safeWorkspaceIds, // ✅ canonical
    collaboratorPerms:
      roleNorm === "collaborator" ? (collaboratorPerms || DEFAULT_COLLAB_PERMS) : null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    createdBy,
    // Defensive cleanup if any legacy field still exists
    memberships: deleteField(),
  };

  // Upsert by email to avoid duplicates
  const existing = await findUserByEmail(normalizedEmail);
  let userId;
  if (existing) {
    await updateDoc(doc(db, "users", existing.id), baseData);
    userId = existing.id;
  } else {
    const userRef = await addDoc(collection(db, "users"), baseData);
    userId = userRef.id;
  }

  // 🔔 Create + email secure invite via serverless API
  // Server writes the invite (with tokenHash) and sends Mailgun email.
  try {
    const resp = await fetch("/api/invites/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: normalizedEmail,
        role: roleNorm,
        workspaceIds: safeWorkspaceIds,
        collaboratorPerms:
          roleNorm === "collaborator" ? (collaboratorPerms || DEFAULT_COLLAB_PERMS) : null,
        createdBy,
      }),
    });

    if (!resp.ok) {
      const txt = await resp.text().catch(() => "");
      console.error("[addUserWithInvite] /api/invites/create failed", resp.status, txt);
      // Non-fatal: user record exists; admin can use resendInvite()
    }
  } catch (e) {
    console.error("[addUserWithInvite] fetch error /api/invites/create", e);
    // Non-fatal to user creation
  }

  return { userId, email: normalizedEmail };
}

/** =========================
 * Update user admin record
 * =========================
 * - Full replace of workspaceIds when provided
 * - Cleans legacy memberships
 */
export async function updateUserBasic(docId, changes) {
  const patch = {
    updatedAt: serverTimestamp(),
    memberships: deleteField(),
  };

  if (changes.name != null) patch.name = String(changes.name).trim();
  if (changes.email != null) patch.email = String(changes.email).trim().toLowerCase();
  if (changes.role != null) patch.role = normalizeRole(changes.role);

  if (Array.isArray(changes.workspaceIds)) {
    patch.workspaceIds = changes.workspaceIds.map(String); // full replace
  }

  if ("collaboratorPerms" in changes) {
    // If role is changed and not collaborator → null perms
    const nextRole = patch.role;
    patch.collaboratorPerms =
      nextRole && nextRole !== "collaborator"
        ? null
        : (changes.collaboratorPerms ?? { ...DEFAULT_COLLAB_PERMS });
  }

  await updateDoc(doc(db, "users", docId), patch);
}

/** =========================
 * Fulfill invite on first login (fallback util)
 * =========================
 * - Keeps canonical workspaceIds[]
 * - No memberships
 */
export async function fulfillInviteOnFirstLogin({
  uid,
  email,
  role,
  workspaceIds = [],
  collaboratorPerms = null,
}) {
  const normalizedEmail = String(email || "").trim().toLowerCase();
  const roleNorm = normalizeRole(role);
  const safeWorkspaceIds = Array.isArray(workspaceIds) ? workspaceIds.map(String) : [];

  const baseData = {
    email: normalizedEmail,
    role: roleNorm,
    workspaceIds: safeWorkspaceIds,
    collaboratorPerms:
      roleNorm === "collaborator" ? (collaboratorPerms || DEFAULT_COLLAB_PERMS) : null,
    updatedAt: serverTimestamp(),
    memberships: deleteField(),
    fulfilledByUid: uid || null,
  };

  const existing = await findUserByEmail(normalizedEmail);
  if (existing) {
    await updateDoc(doc(db, "users", existing.id), baseData);
  } else {
    await addDoc(collection(db, "users"), {
      name: "", // unknown at first login
      isActive: true,
      lastLogin: null,
      createdAt: serverTimestamp(),
      createdBy: uid || "system",
      ...baseData,
    });
  }
}

/** =========================
 * Resend invite (for InvitesList)
 * =========================
 * - Reuses the same serverless endpoint
 */
export async function resendInvite({
  email,
  role,
  workspaceIds = [],
  collaboratorPerms = null,
  createdBy = "admin-resend",
}) {
  const normalizedEmail = String(email || "").trim().toLowerCase();
  const roleNorm = normalizeRole(role);
  const safeWorkspaceIds = Array.isArray(workspaceIds) ? workspaceIds.map(String) : [];

  const resp = await fetch("/api/invites/create", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: normalizedEmail,
      role: roleNorm,
      workspaceIds: safeWorkspaceIds,
      collaboratorPerms:
        roleNorm === "collaborator" ? (collaboratorPerms || DEFAULT_COLLAB_PERMS) : null,
      createdBy,
    }),
  });

  if (!resp.ok) {
    const txt = await resp.text().catch(() => "");
    throw new Error(`Resend failed (${resp.status}): ${txt}`);
  }
  return true;
}
