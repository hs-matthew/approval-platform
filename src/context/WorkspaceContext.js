// src/context/WorkspaceContext.js
import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { onSnapshot, doc, collection, query, where } from "firebase/firestore";
import { db } from "../lib/firebase"; // your initialized Firestore
import { useAuth } from "../hooks/useAuth"; // returns { user, loading }

const WorkspaceContext = createContext(null);

export function WorkspaceProvider({ children }) {
  const { user, loading } = useAuth();
  const [workspaces, setWorkspaces] = useState([]); // [{id, name, ...}]
  const [activeWorkspaceId, setActiveWorkspaceId] = useState(null);
  const [loadingWorkspaces, setLoadingWorkspaces] = useState(true);

  // Load workspaces for current user
  useEffect(() => {
    if (loading) return; // wait for auth state
    if (!user) {
      setWorkspaces([]);
      setActiveWorkspaceId(null);
      setLoadingWorkspaces(false);
      return;
    }

    setLoadingWorkspaces(true);

    // Example membership model: workspaces where members.<uid> exists (role string)
    const q = query(
      collection(db, "workspaces"),
      where(`members.${user.uid}`, "in", ["admin","writer","client"])
    );

    const unsub = onSnapshot(q, (snap) => {
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setWorkspaces(list);

      // Restore persisted selection or default to first
      const saved = localStorage.getItem("activeWorkspaceId");
      const found = list.find(w => w.id === saved);
      const nextId = found?.id ?? list[0]?.id ?? null;
      setActiveWorkspaceId(nextId);
      setLoadingWorkspaces(false);
    });

    return () => unsub();
  }, [user, loading]);

  // Persist selection
  const selectWorkspace = (wid) => {
    setActiveWorkspaceId(wid);
    if (wid) localStorage.setItem("activeWorkspaceId", wid);
  };

  const value = useMemo(() => ({
    workspaces,
    activeWorkspaceId,
    selectWorkspace,
    loadingWorkspaces,
    user
  }), [workspaces, activeWorkspaceId, loadingWorkspaces, user]);

  return (
    <WorkspaceContext.Provider value={value}>
      {children}
    </WorkspaceContext.Provider>
  );
}

export function useWorkspace() {
  const ctx = useContext(WorkspaceContext);
  if (!ctx) throw new Error("useWorkspace must be used within WorkspaceProvider");
  return ctx;
}
