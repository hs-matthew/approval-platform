// src/hooks/useCurrentUser.js
import { useEffect, useMemo, useState } from "react";
import { onAuthStateChanged, onIdTokenChanged, getIdTokenResult } from "firebase/auth";
import { doc, onSnapshot } from "firebase/firestore";
import { auth, db } from "../lib/firebase";

/* ============================
   Centralized role & permission helpers
   ============================ */

// Normalize a role string
export function normalizeRole(role) {
  return String(role || "").trim().toLowerCase();
}

// Extract roles array from user (supports single role or array)
export function getRoles(user) {
  return Array.isArray(user?.roles)
    ? user.roles.map(normalizeRole)
    : user?.role
    ? [normalizeRole(user.role)]
    : [];
}

// First role in list (for badge/display)
export function getPrimaryRole(user) {
  const roles = getRoles(user);
  return roles[0] || "";
}

// Admin/Owner have full administrative powers
export function canAdminister(user) {
  const roles = getRoles(user);
  return roles.includes("admin") || roles.includes("owner");
}

// Staff is treated as internal (broad read/write powers)
export function isStaff(user) {
  const roles = getRoles(user);
  return roles.includes("staff");
}

// Global collaborator permissions (NOT per workspace):
// If privileged or staff => all true
// Else if user.collaboratorPerms object exists, use it
// Else => all false by default
export function getGlobalCollaboratorPerms(user) {
  if (!user) return { reports: false, content: false, audits: false };

  if (canAdminister(user) || isStaff(user)) {
    return { reports: true, content: true, audits: true };
  }

  const p = user?.collaboratorPerms;
  return {
    reports: Boolean(p?.reports),
    content: Boolean(p?.content),
    audits: Boolean(p?.audits),
  };
}

// Section guards (derived from global perms)
export function canSeeReports(user) {
  return getGlobalCollaboratorPerms(user).reports;
}
export function canSeeContent(user) {
  return getGlobalCollaboratorPerms(user).content;
}
export function canSeeAudits(user) {
  return getGlobalCollaboratorPerms(user).audits;
}

// Workspace access:
// - Admin/Owner => all workspaces
// - Staff/Collaborator/Client => must be listed in workspaceIds
export function canAccessWorkspace(user, workspaceId) {
  if (!user) return false;
  if (canAdminister(user)) return true; // owner | admin
  const list = Array.isArray(user.workspaceIds) ? user.workspaceIds : [];
  return list.includes(String(workspaceId));
}

/* ============================
   Hook: useCurrentUser
   ============================ */
export default function useCurrentUser() {
  const [authUser, setAuthUser] = useState(null);
  const [claims, setClaims] = useState(null);
  const [docData, setDocData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Auth state (Firebase Auth user)
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setAuthUser(u || null);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  // Custom claims (e.g., role from Firebase Auth token)
  useEffect(() => {
    const unsub = onIdTokenChanged(auth, async (u) => {
      if (!u) {
        setClaims(null);
        return;
      }
      try {
        const res = await getIdTokenResult(u);
        setClaims(res.claims || null);
      } catch {
        setClaims(null);
      }
    });
    return () => unsub();
  }, []);

  // Firestore profile doc (overrides certain Auth fields)
  useEffect(() => {
    if (!authUser?.uid) {
      setDocData(null);
      return;
    }
    const ref = doc(db, "users", authUser.uid);
    const unsub = onSnapshot(
      ref,
      (snap) => setDocData(snap.exists() ? snap.data() : null),
      () => setDocData(null)
    );
    return () => unsub();
  }, [authUser?.uid]);

  // Merge sources: Firestore overrides Auth; retain fallbacks
  const currentUser = useMemo(() => {
    if (!authUser) return null;

    const roleFromDoc = docData?.role;
    const rolesFromDoc = Array.isArray(docData?.roles)
      ? docData.roles
      : roleFromDoc
      ? [roleFromDoc]
      : [];

    const roleFromClaims = claims?.role ? String(claims.role) : undefined;
    const roles = rolesFromDoc.length ? rolesFromDoc : roleFromClaims ? [roleFromClaims] : [];

    return {
      uid: authUser.uid,
      email: authUser.email,
      name: (docData?.name || authUser.displayName || "").trim(),
      photoURL: docData?.photoURL || authUser.photoURL || null,
      role: roleFromDoc || roleFromClaims || "collaborator",
      roles, // keep raw; helpers normalize when needed
      phone: docData?.phone || "",
      bio: docData?.bio || "",
      workspaceIds: Array.isArray(docData?.workspaceIds) ? docData.workspaceIds : [],
      // NEW: global collaborator perms stored on the user doc (optional)
      collaboratorPerms: docData?.collaboratorPerms || null,
    };
  }, [authUser, docData, claims]);

  // Derived fields (centralized)
  const rolePrimary = useMemo(() => getPrimaryRole(currentUser), [currentUser]);
  const isPrivileged = useMemo(() => canAdminister(currentUser), [currentUser]);
  const perms = useMemo(() => getGlobalCollaboratorPerms(currentUser), [currentUser]);

  // Convenience booleans for sections
  const canReports = perms.reports;
  const canContent = perms.content;
  const canAudits = perms.audits;

  return {
    currentUser,
    loading,
    // roles/privileges
    rolePrimary,
    isPrivileged,
    // global collaborator perms
    perms,                // { reports, content, audits }
    canReports,
    canContent,
    canAudits,
    // helpers (exported above if you need them elsewhere)
  };
}
