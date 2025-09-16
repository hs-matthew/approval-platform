// src/context/WorkspaceContext.js
import * as React from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "../lib/firebase";
import useCurrentUser, { canAdminister } from "../hooks/useCurrentUser";

const WorkspaceContext = React.createContext(undefined);

export function WorkspaceProvider({ children }) {
  const { currentUser, loading: userLoading } = useCurrentUser();

  const [workspaces, setWorkspaces] = React.useState([]);
  const [activeWorkspaceId, setActiveWorkspaceId] = React.useState(null);
  const [loadingWorkspaces, setLoadingWorkspaces] = React.useState(true);

  // New: only Owner/Admin are global
  const isGlobalAccess = React.useMemo(
    () => canAdminister(currentUser), // owner | admin
    [currentUser]
  );

  // Subscribe to workspaces (fetch all; filter client-side for scoped users)
  React.useEffect(() => {
    if (userLoading) {
      setLoadingWorkspaces(true);
      return;
    }

    let unsub = () => {};
    setLoadingWorkspaces(true);

    const ref = collection(db, "workspaces");
    unsub = onSnapshot(
      ref,
      (snap) => {
        const all = snap.docs.map((d) => ({ id: d.id, ...d.data() }));

        let list = all;
        if (!isGlobalAccess) {
          const ids = Array.isArray(currentUser?.workspaceIds)
            ? currentUser.workspaceIds.map(String)
            : [];
          list = all.filter((w) => ids.includes(String(w.id)));
        }

        // sort by name then id for stability
        list.sort((a, b) => {
          const an = (a.name || "").toLowerCase();
          const bn = (b.name || "").toLowerCase();
          if (an < bn) return -1;
          if (an > bn) return 1;
          return String(a.id).localeCompare(String(b.id));
        });

        setWorkspaces(list);
        setLoadingWorkspaces(false);
      },
      () => {
        setWorkspaces([]);
        setLoadingWorkspaces(false);
      }
    );

    return () => unsub();
  }, [userLoading, currentUser, isGlobalAccess]);

  // Keep activeWorkspaceId valid
  React.useEffect(() => {
    if (loadingWorkspaces) return;
    const exists = workspaces.some((w) => String(w.id) === String(activeWorkspaceId));
    if (!exists) {
      setActiveWorkspaceId(workspaces.length ? workspaces[0].id : null);
    }
  }, [loadingWorkspaces, workspaces, activeWorkspaceId]);

  const activeWorkspace = React.useMemo(
    () => workspaces.find((w) => String(w.id) === String(activeWorkspaceId)) || null,
    [workspaces, activeWorkspaceId]
  );

  const value = React.useMemo(
    () => ({
      workspaces,
      activeWorkspaceId,
      setActiveWorkspaceId,
      activeWorkspace,
      loadingWorkspaces,
    }),
    [workspaces, activeWorkspaceId, activeWorkspace, loadingWorkspaces]
  );

  return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>;
}

export function useWorkspace() {
  const ctx = React.useContext(WorkspaceContext);
  if (!ctx) throw new Error("useWorkspace must be used inside <WorkspaceProvider>");
  return ctx;
}
