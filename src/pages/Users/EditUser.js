// src/pages/Users/EditUser.js
import React, { useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useFirestore } from "../../hooks/useFirestore";
import UserForm from "./UserForm";
import { updateUserBasic } from "./usersActions";

export default function EditUser() {
  const navigate = useNavigate();
  const { id } = useParams();

  const { data: users = [], loading: loadingUsers } = useFirestore("users");
  const { data: workspaces = [], loading: loadingWs } = useFirestore("workspaces");

  // Prefer doc id match; keep email fallback just in case route param is email
  const user = useMemo(
    () => users.find((u) => u.id === id || (u.email || "").toLowerCase() === (id || "").toLowerCase()),
    [users, id]
  );

  if (loadingUsers || loadingWs || !user) {
    return <div className="max-w-3xl mx-auto p-6">Loading user…</div>;
  }

  const initialValues = {
    id: user.id,
    name: user.name || "",
    email: user.email || "",
    role: user.role || "collaborator",
    workspaceIds: Array.isArray(user.workspaceIds) ? user.workspaceIds.map(String) : [],
    collaboratorPerms: user.collaboratorPerms ?? { content: true, audits: false, reports: false },
    createdAt: user.createdAt || undefined,
    createdBy: user.createdBy || "system",
    updatedAt: user.updatedAt || undefined,
    isActive: typeof user.isActive === "boolean" ? user.isActive : true,
    lastLogin: user.lastLogin ?? null,
  };

  async function handleUpdate(payload) {
    // Update only this doc by id; usersActions guards against legacy fields
    await updateUserBasic(user.id, payload);
    navigate("/users");
  }

  return (
    <div className="max-w-3xl mx-auto p-6">
      <UserForm
        users={users}
        workspaces={workspaces}
        initialValues={initialValues}
        onAddUser={handleUpdate}   // Form calls this for both create/edit; here it's our update handler
        allowEmailEdit={false}
        onCancel={() => navigate("/users")}
        showTitle
      />
    </div>
  );
}
