import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

const WorkspaceContext = createContext(null);

export function WorkspaceProvider({ workspaces, children }) {
  // init from localStorage if present
  const [activeWorkspaceId, setActiveWorkspaceId] = useState(
    () => localStorage.getItem("activeWorkspaceId") || "all"
  );

  useEffect(() => {
    localStorage.setItem("activeWorkspaceId", activeWorkspaceId);
  }, [activeWorkspaceId]);

  const activeWorkspace =
    activeWorkspaceId === "all"
      ? null
      : workspaces?.find((w) => String(w.id) === String(activeWorkspaceId)) || null;

  const value = useMemo(
    () => ({ workspaces: workspaces || [], activeWorkspaceId, setActiveWorkspaceId, activeWorkspace }),
    [workspaces, activeWorkspaceId, activeWorkspace]
  );

  return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>;
}

export function useWorkspace() {
  const ctx = useContext(WorkspaceContext);
  if (!ctx) throw new Error("useWorkspace must be used within a WorkspaceProvider");
  return ctx;
}
