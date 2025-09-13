// src/pages/Users/AddUser.js
import React from "react";
import { useNavigate } from "react-router-dom";
import { useFirestore } from "../../hooks/useFirestore";
import UserForm from "./UserForm";
import { addUserWithInvite } from "./usersActions";

export default function AddUser() {
  const navigate = useNavigate();
  const { data: users = [] } = useFirestore("users");
  const { data: workspaces = [] } = useFirestore("workspaces");

  async function handleAddUser(userData) {
    await addUserWithInvite(userData); // writes users + invites
    navigate("/users");
  }

  return (
    <div className="max-w-3xl mx-auto p-6">
      <UserForm
        users={users}
        workspaces={workspaces}
        onAddUser={handleAddUser}
        onCancel={() => navigate("/users")}
        showTitle
      />
    </div>
  );
}
