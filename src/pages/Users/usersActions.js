// src/pages/Users/usersActions.js
import { addDoc, collection, doc, serverTimestamp, setDoc, updateDoc } from "firebase/firestore";
import { db, auth } from "../../lib/firebase";

// Keep email-as-id if you like; swap to addDoc if you prefer auto IDs
export const userIdFromEmail = (email) =>
  (email || "").toLowerCase().replace(/[^a-z0-9]/g, "_");

/**
 * Creates/updates a user record for admin UI and creates an invite.
 * payload: { name, email, role, workspaceIds: string[], collaboratorPerms?: {content,audits,reports} }
 */
export async function addUserWithInvite(payload) {
  const { name, email, role, workspaceIds = [], collaboratorPerms = null } = payload;
  const normalizedEmail = (email || "").trim().toLowerCase();
  const createdBy = auth.currentUser?.uid || "system";
  const userDocId = userIdFromEmail(normalizedEmail);

  // 1) Build memberships map for the admin UI copy (users/{id})
  // For collaborators, attach the same perms to each assigned workspace.
  // For other roles, perms are not needed (role implies capability).
  const memberships = {};
  workspaceIds.forEach((wid) => {
    memberships[wid] =
      role === "collaborator"
        ? { permissions: { ...(collaboratorPerms || {}) } }
        : { assigned: true };
  });

  // 2) Upsert the user document used by your admin UI
  await setDoc(
    doc(db, "users", userDocId),
    {
      name: (name || "").trim(),
      email: normalizedEmail,
      role, // global
      isActive: true,
      lastLogin: null,
      createdAt: serverTimestamp(),
      createdBy,
      memberships, // { [wid]: { assigned:true } | { permissions:{...} } }
    },
    { merge: true }
  );

  // 3) Create an invite capturing the workspace assignments + collaborator perms
  await addDoc(collection(db, "invites"), {
    email: normalizedEmail,
    role,                 // global role at time of invite
    workspaceIds,         // array
    collaboratorPerms,    // null unless collaborator
    status: "pending",
    createdAt: serverTimestamp(),
    createdBy,
  });
}

/**
 * (Later) When the invited person signs in:
 *  - Link auth.uid to each workspace's members map.
 *  - We store role globally, but include it in members for quick checks.
 *  - For collaborators, also copy permissions to each workspace member entry.
 *
 * Example shape under workspaces/{wid}:
 *   members: {
 *     "<uid>": { role: "collaborator", permissions: { content:true, audits:false, reports:true } }
 *   }
 */
export async function fulfillInviteOnFirstLogin({ uid, email, role, workspaceIds = [], collaboratorPerms = null }) {
  // Link each workspace
  for (const wid of workspaceIds) {
    await updateDoc(doc(db, "workspaces", wid), {
      [`members.${uid}`]:
        role === "collaborator"
          ? { role, permissions: { ...(collaboratorPerms || {}) } }
          : { role },
    });
  }

  // Mirror memberships onto the canonical users/{uid} doc (real UID)
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
