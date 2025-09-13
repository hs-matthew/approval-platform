// src/pages/Users/EditUser.js
import React, { useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useFirestore } from "../../hooks/useFirestore";
import UserForm from "./UserForm";
import { updateUserBasic } from "./usersActions";

export default function EditUser() {
  const navigate = useNavigate();
  const { id } = useParams();               // id can be your doc id (email id if you use that scheme)
  const { data: users = [] } = useFirestore("users");
  const { data: workspaces = [] } = useFirestore("workspaces");

  const user = useMemo(() => users.find(u => (u.id === id) || (u.email === id)), [users, id]);

  if (!user) {
    return <div className="max-w-3xl mx-auto p-6">Loading user…</div>;
  }

  async function handleSave(changes) {
    await updateUserBasic(user.id || user.email, changes);
    navigate("/users");
  }

  // Pre-fill the form: your UserForm reads initial state from props? If not, you can extend it.
  const initial = {
    name: user.name || "",
    email: user.email || "",
    role: user.role || "writer",
    // optional: you could pre-select a workspace & role from memberships:
    workspaceId: "",
    wsRole: "writer",
  };

  return (
    <div className="max-w-3xl mx-auto p-6">
      <UserForm
        users={users}
        workspaces={workspaces}
        onAddUser={handleSave}      // reusing the same prop, your form calls this on submit
        onCancel={() => navigate("/users")}
        showTitle
        initialValues={initial}     // add this prop in your form to pre-fill if provided
      />
    </div>
  );
}
