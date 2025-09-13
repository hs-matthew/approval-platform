// src/context/WorkspaceContext.js
import * as React from "react";                     // ⟵ key change
import { collection, onSnapshot, query, where, orderBy } from "firebase/firestore";
import { db } from "../lib/firebase";
import { useAuth } from "../hooks/useAuth";

const WorkspaceContext = React.createContext(undefined);

export function WorkspaceProvider({ children }) {
  const { user, loading: authLoading } = useAuth();
  const [workspaces, setWorkspaces] = React.useState([]);
  const [activeWorkspaceId, setActiveWorkspaceId] = React.useState(null);
  const [loadingWorkspaces, setLoadingWorkspaces] = React.useState(true);

  const activeWorkspace = React.useMemo(
    () => workspaces.find((w) => w.id === activeWorkspaceId) || null,
    [workspaces, activeWorkspaceId]
  );

  React.useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setWorkspaces([]);
      setActiveWorkspaceId(null);
      setLoadingWorkspaces(false);
      return;
    }

    setLoadingWorkspaces(true);
const q = query(
  collection(db, "workspaces"),
  where(`members.${user.uid}.role`, "in", ["owner","admin","staff","client","collaborator"]),
  orderBy("name")
);

    const unsub = onSnapshot(
      q,
      (snap) => {
        const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        setWorkspaces(list);
        const saved = localStorage.getItem("activeWorkspaceId");
        const next = list.find((w) => w.id === saved)?.id || list[0]?.id || null;
        setActiveWorkspaceId(next);
        setLoadingWorkspaces(false);
      },
      () => setLoadingWorkspaces(false)
    );

    return () => unsub();
  }, [authLoading, user]);

  React.useEffect(() => {
    if (activeWorkspaceId) localStorage.setItem("activeWorkspaceId", activeWorkspaceId);
  }, [activeWorkspaceId]);

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
  const ctx = React.useContext(WorkspaceContext);   // ⟵ no destructure
  if (ctx === undefined) {
    throw new Error("useWorkspace must be used within <WorkspaceProvider>");
  }
  return ctx;
}
