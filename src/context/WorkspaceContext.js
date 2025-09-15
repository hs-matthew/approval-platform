// src/context/WorkspaceContext.js
import * as React from "react";
import {
  collection,
  onSnapshot,
} from "firebase/firestore";
import { db } from "../lib/firebase";
import useCurrentUser, { canAdminister, isStaff } from "../hooks/useCurrentUser";

const WorkspaceContext = React.createContext(undefined);

export function WorkspaceProvider({ children }) {
  const { currentUser, loading: userLoading } = useCurrentUser();

  const [workspaces, setWorkspaces] = React.useState([]);
  const [activeWorkspaceId, setActiveWorkspaceId] = React.useState(null);
  const [loadingWorkspaces, setLoadingWorkspaces] = React.useState(true);

  const isPrivileged = React.useMemo(
    () => canAdminister(currentUser) || isStaff(currentUser),
    [currentUser]
  );

  // Subscribe to workspaces
  React.useEffect(() => {
    // Wait until we know who the user is
    if (userLoading) {
      setLoadingWorkspaces(true);
      return;
    }

    let unsub = () => {};
    setLoadingWorkspaces(true);

    // We’ll just subscribe to all and filter client-side for collaborators.
    // (This avoids Firestore 'in' query chunking & composite-index headaches.)
    const ref = collection(db, "workspaces");
    unsub = onSnapshot(
      ref,
      (snap) => {
        const all = snap.docs.map((d) => ({ id: d.id, ...d.data() }));

        let list = all;
        if (!isPrivileged) {
          const ids = Array.isArray(currentUser?.workspaceIds) ? currentUser.workspaceIds.map(String) : [];
          list = all.filter((w) => ids.includes(String(w.id)));
        }

        // Keep list stable-ish by name, then id
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
  }, [userLoading, currentUser, isPrivileged]);

  // Ensure we always have a valid activeWorkspaceId when possible
  React.useEffect(() => {
    if (loadingWorkspaces) return;

    // If there’s no active workspace or it disappeared from the list, pick the first
    const exists = workspaces.some((w) => String(w.id) === String(activeWorkspaceId));
    if (!exists) {
      if (workspaces.length > 0) {
        setActiveWorkspaceId(workspaces[0].id);
      } else {
        setActiveWorkspaceId(null);
      }
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
  if (!ctx) {
    throw new Error("useWorkspace must be used inside <WorkspaceProvider>");
  }
  return ctx;
}
