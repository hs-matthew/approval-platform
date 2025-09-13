// src/hooks/useCurrentUser.js
import { useEffect, useMemo, useState } from "react";
import { onAuthStateChanged, onIdTokenChanged, getIdTokenResult } from "firebase/auth";
import { doc, onSnapshot } from "firebase/firestore";
import { auth, db } from "../lib/firebase";

export default function useCurrentUser() {
  const [authUser, setAuthUser] = useState(null);
  const [claims, setClaims] = useState(null);
  const [docData, setDocData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Auth user
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setAuthUser(u || null);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  // Custom claims (e.g., role)
  useEffect(() => {
    const unsub = onIdTokenChanged(auth, async (u) => {
      if (!u) return setClaims(null);
      try {
        const res = await getIdTokenResult(u);
        setClaims(res.claims || null);
      } catch {
        setClaims(null);
      }
    });
    return () => unsub();
  }, []);

  // Firestore profile doc
  useEffect(() => {
    if (!authUser?.uid) { setDocData(null); return; }
    const unsub = onSnapshot(doc(db, "users", authUser.uid), (snap) => {
      setDocData(snap.exists() ? snap.data() : null);
    }, () => setDocData(null));
    return () => unsub();
  }, [authUser?.uid]);

  // Merge: Firestore fields override Auth; fallbacks preserved
  const currentUser = useMemo(() => {
    if (!authUser) return null;
    const roleFromDoc = docData?.role;
    const rolesFromDoc = Array.isArray(docData?.roles) ? docData.roles : (roleFromDoc ? [roleFromDoc] : []);
    const roleFromClaims = claims?.role ? String(claims.role) : undefined;
    const roles = rolesFromDoc.length ? rolesFromDoc : (roleFromClaims ? [roleFromClaims] : []);

    return {
      uid: authUser.uid,
      email: authUser.email,
      name: (docData?.name || authUser.displayName || "").trim(),
      photoURL: docData?.photoURL || authUser.photoURL || null,
      role: roleFromDoc || roleFromClaims || "collaborator",
      roles,
      phone: docData?.phone || "",
      bio: docData?.bio || "",
      workspaceIds: Array.isArray(docData?.workspaceIds) ? docData.workspaceIds : [],
    };
  }, [authUser, docData, claims]);

  return { currentUser, loading };
}
