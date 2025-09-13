// src/pages/Users/usersActions.js
import {
  addDoc,
  collection,
  doc,
  serverTimestamp,
  updateDoc,
  getDocs,
  query,
  where,
  limit,
} from "firebase/firestore";
import { db, auth } from "../../lib/firebase";

/* =========================
   API base (dev & prod)
   - Default: same-origin (/api/...)
   - Overrides: window.__API_BASE__ or REACT_APP_API_BASE
   ========================= */
const API_BASE =
  (typeof window !== "undefined" && (window.__API_BASE__ || "")) ||
  process.env.REACT_APP_API_BASE ||
  "";

const apiUrl = (path) =>
  (API_BASE ? API_BASE.replace(/\/+$/, "") : "") + "/" + path.replace(/^\/+/, "");

/* =========================
   Role & perms guards
   ========================= */
export function normalizeRole(role) {
  const r = String(role || "collaborator").toLowerCase();
  const allowed = ["owner", "admin", "staff", "client", "collaborator"];
  const clean = allowed.includes(r) ? r : "collaborator";
  return clean === "owner" ? "admin" : clean; // UI cannot create owner
}

export const DEFAULT_COLLAB_PERMS = { content: true, audits: false, reports: false };

/* =========================
   Helpers
   ========================= */
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

/* =========================
   Add user + send invite
   - Upserts admin-facing user record (workspaceIds canonical)
   - Calls /api/invites/create to generate+email secure invite
   ========================= */
export async function addUserWithInvite(payload) {
  const {
    name = "",
    email = "",
    role = "collaborator",
    workspaceIds = [],
    collaboratorPerms = null,
  } = payload || {};

  const normalizedEmail = String(email).trim().toLowerCase();
  if (!normalizedEmail) throw new Error("Email is required");

  const roleNorm = normalizeRole(role);
  const createdBy = auth.currentUser?.uid || "system";
  const safeWorkspaceIds = Array.isArray(workspaceIds) ? workspaceIds.map(String) : [];

  const baseData = {
    name: String(name).trim(),
    email: normalizedEmail,
    role: roleNorm,
    isActive: true,
    lastLogin: null,
    workspaceIds: safeWorkspaceIds, // ✅ canonical
    collaboratorPerms:
      roleNorm === "collaborator" ? (collaboratorPerms || DEFAULT_COLLAB_PERMS) : null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    createdBy,
  };

  // Upsert by email (no deleteField usage anywhere)
  let userId;
  const existing = await findUserByEmail(normalizedEmail);
  if (existing) {
    await updateDoc(doc(db, "users", existing.id), baseData);
    userId = existing.id;
  } else {
    const userRef = await addDoc(collection(db, "users"), baseData);
    userId = userRef.id;
  }

  // Create + email invite via serverless API
  let inviteSent = false;
  try {
    const resp = await fetch(apiUrl("/api/invites/create"), {
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
    inviteSent = resp.ok;
    if (!resp.ok) {
      const txt = await resp.text().catch(() => "");
      console.error("[addUserWithInvite] /api/invites/create failed", resp.status, txt);
    }
  } catch (e) {
    console.error("[addUserWithInvite] fetch error /api/invites/create", e);
  }

  return { userId, email: normalizedEmail, inviteSent };
}

/* =========================
   Update user admin record
   - Full replace of workspaceIds when provided
   ========================= */
export async function updateUserBasic(docId, changes) {
  const patch = { updatedAt: serverTimestamp() };

  if (changes.name != null) patch.name = String(changes.name).trim();
  if (changes.email != null) patch.email = String(changes.email).trim().toLowerCase();
  if (changes.role != null) patch.role = normalizeRole(changes.role);

  if (Array.isArray(changes.workspaceIds)) {
    patch.workspaceIds = changes.workspaceIds.map(String); // full replace
  }

  if ("collaboratorPerms" in changes) {
    const nextRole = patch.role ?? undefined;
    patch.collaboratorPerms =
      nextRole && nextRole !== "collaborator"
        ? null
        : (changes.collaboratorPerms ?? { ...DEFAULT_COLLAB_PERMS });
  }

  await updateDoc(doc(db, "users", docId), patch);
}

/* =========================
   Fulfill invite on first login (fallback util)
   ========================= */
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
    fulfilledByUid: uid || null,
  };

  const existing = await findUserByEmail(normalizedEmail);
  if (existing) {
    await updateDoc(doc(db, "users", existing.id), baseData);
  } else {
    await addDoc(collection(db, "users"), {
      name: "",
      isActive: true,
      lastLogin: null,
      createdAt: serverTimestamp(),
      createdBy: uid || "system",
      ...baseData,
    });
  }
}

/* =========================
   Resend invite (InvitesList)
   ========================= */
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

  const resp = await fetch(apiUrl("/api/invites/create"), {
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
