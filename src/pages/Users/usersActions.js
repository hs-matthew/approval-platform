// src/pages/Users/usersActions.js
import {
  addDoc,
  collection,
  doc,
  serverTimestamp,
  setDoc,
  updateDoc,
  deleteField,
} from "firebase/firestore";
import { db, auth } from "../../lib/firebase";

/** Normalize an email into a stable doc id (only if you use email-as-id). */
export const userIdFromEmail = (email) =>
  (email || "").toLowerCase().trim().replace(/[^a-z0-9]/g, "_");

/** Build a memberships mirror from workspaceIds (back-compat; safe to remove later). */
const buildMemberships = (workspaceIds = [], role = "collaborator", collaboratorPerms = null) => {
  const m = {};
  for (const wid of workspaceIds.map(String)) {
    m[wid] =
      role === "collaborator"
        ? { assigned: true, permissions: { ...(collaboratorPerms || {}) } }
        : { assigned: true };
  }
  return m;
};

/**
 * Create (or upsert) a user admin record + create an invite.
 * Canonical: workspaceIds[]
 * Mirror (for now): memberships map derived from workspaceIds
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
  const createdBy = auth.currentUser?.uid || "system";
  const userDocId = userIdFromEmail(normalizedEmail);

  const safeWorkspaceIds = (workspaceIds || []).map(String);
  const memberships = buildMemberships(safeWorkspaceIds, role, collaboratorPerms);

  // Upsert admin record
  await setDoc(
    doc(db, "users", userDocId),
    {
      name: String(name).trim(),
      email: normalizedEmail,
      role,
      isActive: true,
      lastLogin: null,
      createdAt: serverTimestamp(),
      createdBy,
      // Canonical
      workspaceIds: safeWorkspaceIds,
      // Mirror (remove later if not needed)
      memberships,
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );

  // Create invite (fulfilled on first login)
  await addDoc(collection(db, "invites"), {
    email: normalizedEmail,
    role,
    workspaceIds: safeWorkspaceIds,
    collaboratorPerms,
    status: "pending",
    createdAt: serverTimestamp(),
    createdBy,
  });
}

/**
 * Update a user admin record.
 * - Replaces workspaceIds with exactly what you pass (including empty array).
 * - Mirrors memberships from workspaceIds (or deletes memberships if none).
 * - Leaves other provided fields as-is.
 *
 * @param {string} docId Firestore doc id of the user
 * @param {{
 *  name?: string,
 *  email?: string,
 *  role?: string,
 *  workspaceIds?: string[],
 *  collaboratorPerms?: {content?:boolean,audits?:boolean,reports?:boolean}|null
 * }} changes
 */
export async function updateUserBasic(docId, changes) {
  const next = {};
  if (changes.name != null) next.name = String(changes.name).trim();
  if (changes.email != null) next.email = String(changes.email).trim().toLowerCase();
  if (changes.role != null) next.role = String(changes.role);

  // Canonical: always write workspaceIds if provided; if not provided, leave unchanged.
  // If you want "always replace" semantics even when omitted, uncomment the else block below.
  if (Array.isArray(changes.workspaceIds)) {
    const safeWorkspaceIds = changes.workspaceIds.map(String);
    next.workspaceIds = safeWorkspaceIds;

    // Mirror memberships for back-compat; delete when empty to ensure removals persist
    const role = next.role || changes.role || "collaborator";
    if (safeWorkspaceIds.length > 0) {
      next.memberships = buildMemberships(safeWorkspaceIds, role, changes.collaboratorPerms || null);
    } else {
      next.memberships = deleteField(); // remove the field if no workspaces selected
    }
  }

  // Collaborator perms are global in your current UI; keep or null them.
  if ("collaboratorPerms" in changes) {
    next.collaboratorPerms = changes.collaboratorPerms ?? null;
  }

  next.updatedAt = serverTimestamp();

  await updateDoc(doc(db, "users", docId), next);
}

/**
 * Fulfill invite after first login by linking Auth UID to workspaces.
 * (You can keep or remove this depending on your flow.)
 */
export async function fulfillInviteOnFirstLogin({
  uid,
  email,
  role,
  workspaceIds = [],
  collaboratorPerms = null,
}) {
  const safeWorkspaceIds = (workspaceIds || []).map(String);

  // Copy membership onto each workspace doc (denormalized)
  for (const wid of safeWorkspaceIds) {
    await updateDoc(doc(db, "workspaces", wid), {
      [`members.${uid}`]:
        role === "collaborator"
          ? { role, permissions: { ...(collaboratorPerms || {}) } }
          : { role },
      updatedAt: serverTimestamp(),
    });
  }

  // Mirror onto users/{uid} (if you keep a separate auth-uid keyed doc)
  await setDoc(
    doc(db, "users", uid),
    {
      email: String(email || "").toLowerCase(),
      role,
      workspaceIds: safeWorkspaceIds, // canonical
      // mirror for legacy readers (optional)
      memberships: safeWorkspaceIds.length
        ? buildMemberships(safeWorkspaceIds, role, collaboratorPerms)
        : deleteField(),
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );
}
