// src/data/workspaces.js
import {
  addDoc,
  collection,
  doc,
  serverTimestamp,
  setDoc,
  updateDoc,
  getDoc,
} from "firebase/firestore";
import { db } from "../lib/firebase";

/** Simple role gate helpers (avoid importing hooks to prevent circular deps) */
function isOwnerOrAdmin(user) {
  const r = String(user?.role || "").toLowerCase();
  return r === "owner" || r === "admin";
}

/**
 * Create a workspace.
 * - Owner/Admin only
 * - Returns the new workspaceId
 * - DOES NOT push workspaceId onto the creator's user doc
 */
export async function createWorkspace({ name, description = "" }, currentUser) {
  if (!currentUser?.uid) throw new Error("Not signed in");
  if (!isOwnerOrAdmin(currentUser)) throw new Error("Permission denied");
  if (!name?.trim()) throw new Error("Workspace name required");

  const ref = await addDoc(collection(db, "workspaces"), {
    name: name.trim(),
    description: description.trim(),
    createdBy: currentUser.uid,
    createdAt: serverTimestamp(),
    status: "active",
    // optional counters you can keep updated elsewhere (Cloud Functions or app-side)
    membersCount: 1, // counting the creator (optional)
  });

  // Optional: reflect creator in members subcollection (clarity; not required for access)
  await setDoc(
    doc(db, "workspaces", ref.id, "members", currentUser.uid),
    {
      role: String(currentUser.role || "").toLowerCase(), // 'owner' | 'admin'
      addedBy: currentUser.uid,
      addedAt: serverTimestamp(),
    },
    { merge: true }
  );

  return ref.id;
}

/**
 * Update workspace fields (name/description, etc.).
 * - Owner/Admin only
 * - `patch` is a partial object, e.g. { name, description }
 */
export async function updateWorkspaceMeta(workspaceId, patch, currentUser) {
  if (!currentUser?.uid) throw new Error("Not signed in");
  if (!isOwnerOrAdmin(currentUser)) throw new Error("Permission denied");
  if (!workspaceId) throw new Error("workspaceId required");

  const safe = {};
  if (typeof patch?.name === "string") safe.name = patch.name.trim();
  if (typeof patch?.description === "string") safe.description = patch.description.trim();

  if (Object.keys(safe).length === 0) return;

  await updateDoc(doc(db, "workspaces", workspaceId), safe);
}

/**
 * Set workspace status (e.g., 'active' | 'archived').
 * - Owner/Admin only
 */
export async function setWorkspaceStatus(workspaceId, status, currentUser) {
  if (!currentUser?.uid) throw new Error("Not signed in");
  if (!isOwnerOrAdmin(currentUser)) throw new Error("Permission denied");
  if (!workspaceId) throw new Error("workspaceId required");

  const s = String(status || "").toLowerCase();
  if (!["active", "archived"].includes(s)) throw new Error("Invalid status");

  await updateDoc(doc(db, "workspaces", workspaceId), { status: s });
}

/**
 * (Optional) Read a workspace once.
 */
export async function getWorkspace(workspaceId) {
  if (!workspaceId) throw new Error("workspaceId required");
  const snap = await getDoc(doc(db, "workspaces", workspaceId));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}
