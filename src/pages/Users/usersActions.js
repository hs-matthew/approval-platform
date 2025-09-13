import { addDoc, collection, doc, serverTimestamp, setDoc, updateDoc } from "firebase/firestore";
import { db, auth } from "../../lib/firebase";

// If you key users by email-as-id, keep this. If you use auto IDs, ignore it.
export const userIdFromEmail = (email) =>
  (email || "").toLowerCase().replace(/[^a-z0-9]/g, "_");

/**
 * Create/update a user admin-record and create an invite capturing workspace assignments.
 * payload: { name, email, role, workspaceIds: string[], collaboratorPerms?: {content,audits,reports} }
 */
export async function addUserWithInvite(payload) {
  const { name, email, role, workspaceIds = [], collaboratorPerms = null } = payload;
  const normalizedEmail = (email || "").trim().toLowerCase();
  const createdBy = auth.currentUser?.uid || "system";
  const userDocId = userIdFromEmail(normalizedEmail);

  // Build memberships map for admin UI record
  const memberships = {};
  workspaceIds.forEach((wid) => {
    memberships[wid] =
      role === "collaborator"
        ? { permissions: { ...(collaboratorPerms || {}) } }
        : { assigned: true };
  });

  // Upsert users admin-record
  await setDoc(
    doc(db, "users", userDocId),
    {
      name: (name || "").trim(),
      email: normalizedEmail,
      role, // global role
      isActive: true,
      lastLogin: null,
      createdAt: serverTimestamp(),
      createdBy,
      memberships,
    },
    { merge: true }
  );

  // Create invite (fulfilled on first login)
  await addDoc(collection(db, "invites"), {
    email: normalizedEmail,
    role,                 // global role at invite time
    workspaceIds,         // array of workspace IDs
    collaboratorPerms,    // null unless collaborator
    status: "pending",
    createdAt: serverTimestamp(),
    createdBy,
  });
}

/**
 * Update basic user fields for the admin-record.
 * docId: Firestore document id for users collection (e.g., email-as-id or auto-id you’re using in the list).
 * changes: { name?, email?, role?, workspaceIds?, collaboratorPerms? }
 *
 * NOTE: This updates the admin-record only. If you also want to sync workspace membership
 * objects under workspaces/{wid}.members.{uid}, do that in a separate flow (e.g., on first login
 * using fulfillInviteOnFirstLogin, or an explicit "sync memberships" admin action).
 */
export async function updateUserBasic(docId, changes) {
  const next = {};
  if (changes.name != null) next.name = String(changes.name).trim();
  if (changes.email != null) next.email = String(changes.email).trim().toLowerCase();
  if (changes.role != null) next.role = String(changes.role);

  // Optionally update memberships if provided (same shape as add)
  if (Array.isArray(changes.workspaceIds)) {
    const role = next.role || changes.role || "collaborator";
    const memberships = {};
    changes.workspaceIds.forEach((wid) => {
      memberships[wid] =
        role === "collaborator"
          ? { permissions: { ...(changes.collaboratorPerms || {}) } }
          : { assigned: true };
    });
    next.memberships = memberships;
  }
  if (changes.collaboratorPerms && !Array.isArray(changes.workspaceIds)) {
    // If only perms changed and we already have memberships in the doc,
    // the UI should read/merge per workspace. For simplicity we overwrite nothing here.
    // (Add a more complex merge if you store perms per wid and allow editing them here.)
  }

  next.updatedAt = serverTimestamp();

  await setDoc(doc(db, "users", docId), next, { merge: true });
}

/**
 * Call this after first login (or via a backend) to link Auth UID to workspaces.
 * Copies role + (if collaborator) permissions into each workspace’s members map,
 * and mirrors memberships onto users/{uid} (canonical, keyed by real UID).
 */
export async function fulfillInviteOnFirstLogin({ uid, email, role, workspaceIds = [], collaboratorPerms = null }) {
  for (const wid of workspaceIds) {
    await updateDoc(doc(db, "workspaces", wid), {
      [`members.${uid}`]:
        role === "collaborator"
          ? { role, permissions: { ...(collaboratorPerms || {}) } }
          : { role },
    });
  }

  await setDoc(
    doc(db, "users", uid),
    {
      email: (email || "").toLowerCase(),
      role,
      memberships: workspaceIds.reduce((acc, wid) => {
        acc[wid] =
          role === "collaborator"
            ? { permissions: { ...(collaboratorPerms || {}) } }
            : { assigned: true };
        return acc;
      }, {}),
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );
}
