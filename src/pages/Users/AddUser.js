// src/pages/Users/AddUser.js
import React from "react";
import { useNavigate } from "react-router-dom";
import { useFirestore } from "../../hooks/useFirestore";
import UserForm from "./UserForm";
import { addUserWithInvite } from "./usersActions";

export default function AddUser() {
  const navigate = useNavigate();

  const { data: users = [], loading: loadingUsers, error: usersError } = useFirestore("users");
  const { data: workspaces = [], loading: loadingWs, error: wsError } = useFirestore("workspaces");

  const [submitError, setSubmitError] = React.useState("");

  async function handleAddUser(userData) {
    setSubmitError("");
    try {
      await addUserWithInvite(userData); // writes users + invites (auto-ID, no memberships)
      navigate("/invites");
    } catch (e) {
      console.error(e);
      setSubmitError("Failed to create user. Please try again.");
    }
  }

  if (loadingUsers || loadingWs) {
    return <div className="max-w-3xl mx-auto p-6">Loading…</div>;
  }

  if (usersError || wsError) {
    return (
      <div className="max-w-3xl mx-auto p-6 text-red-600">
        {usersError?.message || wsError?.message || "Failed to load data."}
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto p-6">
      <UserForm
        users={users}                 // used for duplicate-email validation
        workspaces={workspaces}       // shown in the multi-select
        onAddUser={handleAddUser}
        onCancel={() => navigate("/users")}
        showTitle
      />
      {submitError && (
        <div className="mt-4 text-sm text-red-600">{submitError}</div>
      )}
    </div>
  );
}
