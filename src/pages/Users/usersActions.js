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

// Roles: "owner" | "staff" | "collaborator"
const DEFAULT_COLLAB_PERMS = { content: true, audits: false, reports: false };

/** Normalize and validate a role value */
function normalizeRole(role) {
  const r = String(role || "collaborator").toLowerCase();
  return r === "owner" || r === "staff" || r === "collaborator" ? r : "collaborator";
}

/** Find an existing user doc by email (returns {id, data} or null) */
async function findUserByEmail(email) {
  const normalizedEmail = String(email || "").trim().toLowerCase();
  if (!normalizedEmail) return null;
  const qSnap = await getDocs(
    query(collection(db, "users"), where("email", "==", normalizedEmail), limit(1))
  );
  if (qSnap.empty) return null;
  const d = qSnap.docs[0];
  return { id: d.id, data: d.data() };
}

/**
 * Create (or upsert) a user admin record + create an invite.
 * Canonical: workspaceIds[]
 * NO memberships written anywhere. Auto-generated Firestore ID.
 *
 * @param {{
 *  name?: string,
 *  email: string,
 *  role?: "owner"|"staff"|"collaborator",
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

  const baseData = {
    name: String(name).trim(),
    email: normalizedEmail,
    role: roleNorm, // "owner" | "staff" | "collaborator"
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

  // Create invite (fulfilled on first login)
  await addDoc(collection(db, "invites"), {
    email: normalizedEmail,
    role: roleNorm,
    workspaceIds: safeWorkspaceIds,
    collaboratorPerms: roleNorm === "collaborator" ? (collaboratorPerms || DEFAULT_COLLAB_PERMS) : null,
    status: "pending",
    createdAt: serverTimestamp(),
    createdBy,
    createdUserId: userId, // helpful for traceability
  });
}

/**
 * Update a user admin record.
 * - Replaces workspaceIds with exactly what you pass (including empty array) when provided.
 * - Never writes memberships; also deletes legacy memberships if present.
 *
 * @param {string} docId Firestore doc id of the user
 * @param {{
 *  name?: string,
 *  email?: string,
 *  role?: "owner"|"staff"|"collaborator",
 *  workspaceIds?: string[],
 *  collaboratorPerms?: {content?:boolean,audits?:boolean,reports?:boolean}|null
 * }} changes
 */
export async function updateUserBasic(docId, changes) {
  const patch = {
    updatedAt: serverTimestamp(),
    // Defensive cleanup of any legacy field on every update
    memberships: deleteField(),
  };

  if (changes.name != null) patch.name = String(changes.name).trim();
  if (changes.email != null) patch.email = String(changes.email).trim().toLowerCase();
  if (changes.role != null) patch.role = normalizeRole(changes.role);

  if (Array.isArray(changes.workspaceIds)) {
    patch.workspaceIds = changes.workspaceIds.map(String); // full replace
  }

  if ("collaboratorPerms" in changes) {
    const roleNext = patch.role ?? undefined; // only set if provided above
    const effectiveRole = roleNext || undefined; // undefined means unchanged
    // If role was provided and is not collaborator → perms null.
    // If role not provided, keep perms as provided (caller controls).
    patch.collaboratorPerms =
      effectiveRole && effectiveRole !== "collaborator"
        ? null
        : (changes.collaboratorPerms ?? { ...DEFAULT_COLLAB_PERMS });
  }

  await updateDoc(doc(db, "users", docId), patch);
}

/**
 * Fulfill invite after first login.
 * - Upserts user (by email) with canonical workspaceIds[].
 * - NO memberships written. Uses auto-ID (existing if found).
 *
 * @param {{
 *  uid?: string,        // optional; not used for doc id
 *  email: string,
 *  role: "owner"|"staff"|"collaborator",
 *  workspaceIds?: string[],
 *  collaboratorPerms?: {content?:boolean,audits?:boolean,reports?:boolean}|null
 * }} args
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
    // Optionally keep who fulfilled; harmless if null/undefined
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
