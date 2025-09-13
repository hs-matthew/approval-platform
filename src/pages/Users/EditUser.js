// src/pages/Users/EditUser.js
import React, { useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useFirestore } from "../../hooks/useFirestore";
import UserForm from "./UserForm";
import { updateUserBasic } from "./usersActions";

// derive workspaceIds from either shape on the user record
const deriveWorkspaceIds = (u) => {
  if (!u) return [];
  if (Array.isArray(u.workspaceIds)) return u.workspaceIds.map(String);
  if (u.memberships && typeof u.memberships === "object") {
    return Object.entries(u.memberships)
      .filter(([_, v]) => {
        if (v == null) return false;
        if (typeof v === "boolean") return v;
        if (typeof v === "string") return v.trim().length > 0;
        if (typeof v === "object") return v.assigned !== false;
        return false;
      })
      .map(([k]) => String(k));
  }
  return [];
};

export default function EditUser() {
  const navigate = useNavigate();
  const { id } = useParams();

  const { data: users = [], loading: loadingUsers } = useFirestore("users");
  const { data: workspaces = [], loading: loadingWs } = useFirestore("workspaces");

  const user = useMemo(
    () => users.find((u) => u.id === id || u.email === id),
    [users, id]
  );

  if (loadingUsers || loadingWs || !user) {
    return <div className="max-w-3xl mx-auto p-6">Loading user…</div>;
  }

  // Build the initialValues expected by <UserForm>
  const initialValues = {
    id: user.id,
    name: user.name || "",
    email: user.email || "",
    role: user.role || "collaborator",                 // match the roles your form knows about
    workspaceIds: deriveWorkspaceIds(user),            // 👈 this populates the chips
    memberships: user.memberships || undefined,        // optional: pass through if present
    collaboratorPerms: user.collaboratorPerms || undefined,
    createdAt: user.createdAt || undefined,
    createdBy: user.createdBy || "system",
    updatedAt: user.updatedAt || undefined,
    isActive: typeof user.isActive === "boolean" ? user.isActive : true,
    lastLogin: user.lastLogin || null,
  };

  // Call your update path (no auth create here)
  async function handleUpdate(payload) {
    await updateUserBasic(user.id, payload);  // ensure this updates the doc; do not create auth users here
    navigate("/users");
  }

  return (
    <div className="max-w-3xl mx-auto p-6">
      <UserForm
        users={users}
        workspaces={workspaces}
        initialValues={initialValues}
        onAddUser={handleUpdate}      // your form currently calls onAddUser; this is your update handler
        // If you exposed onUpdateUser in the form, use: onUpdateUser={handleUpdate}
        allowEmailEdit={false}        // lock email in edit mode
        onCancel={() => navigate("/users")}
        showTitle
      />
    </div>
  );
}
