// src/App.js
import React, { useState } from "react";
import { Routes, Route, Navigate, useNavigate } from "react-router-dom";

import Navigation from "./components/layout/Navigation";
import Footer from "./components/layout/Footer";
import Login from "./pages/Auth/Login";
import Dashboard from "./pages/Dashboard/Dashboard";
import SubmitContent from "./pages/SubmitContent/SubmitContent";
import ManageWorkspaces from "./pages/ManageWorkspaces/ManageWorkspaces";
import ManageUsers from "./pages/ManageUsers/ManageUsers";
import ReviewRoute from "./pages/ReviewSubmission/ReviewRoute";

import RequireAuth from "./components/auth/RequireAuth";
import { useAuth } from "./hooks/useAuth";
import { useFirestore } from "./hooks/useFirestore";
import { useSubmissions } from "./hooks/useSubmissions";

export default function App() {
  return <ApprovalPlatform />;
}

function ApprovalPlatform() {
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  // Your existing state & hooks
  const [feedback, setFeedback] = useState("");
  const { data: users, addItem: addUser, loading: usersLoading } = useFirestore("users");
  const { data: workspaces, addItem: addWorkspace, loading: workspacesLoading } = useFirestore("workspaces");
  const {
    submissions,
    addSubmission,
    updateSubmission,
    filterWorkspace,
    setFilterWorkspace,
    filterType,
    setFilterType,
    loading: submissionsLoading,
  } = useSubmissions(workspaces);

  const isLoading = usersLoading || workspacesLoading || submissionsLoading;

  // Navigations previously handled by onViewChange
  const toDashboard = () => navigate("/dashboard");
  const toSubmit = () => navigate("/submit");
  const toWorkspaces = () => navigate("/workspaces");
  const toUsers = () => navigate("/users");

  // Dashboard -> Review button
  const onSelectSubmission = (submission) => {
    navigate(`/review/${submission.id}`);
  };

  const onApprove = (id) => {
    updateSubmission(id, { status: "approved", feedback, approvedAt: new Date().toISOString() });
    setFeedback("");
    toDashboard();
  };

  const onReject = (id) => {
    if (!feedback.trim()) {
      alert("Please provide feedback when rejecting a submission.");
      return;
    }
    updateSubmission(id, { status: "rejected", feedback, rejectedAt: new Date().toISOString() });
    setFeedback("");
    toDashboard();
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <Routes>
        {/* Public */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/login" element={<Login />} />

        {/* Protected shell: shows Navigation + protected routes */}
        <Route
          element={
            <RequireAuth>
              <>
                <Navigation currentUser={currentUser} />
              </>
            </RequireAuth>
          }
        >
          <Route
            path="/dashboard"
            element={
              isLoading ? (
                <Loading />
              ) : (
                <Dashboard
                  submissions={submissions}
                  workspaces={workspaces}
                  users={users}
                  currentUser={currentUser}
                  filterWorkspace={filterWorkspace}
                  setFilterWorkspace={setFilterWorkspace}
                  filterType={filterType}
                  setFilterType={setFilterType}
                  onSelectSubmission={onSelectSubmission}
                />
              )
            }
          />

          <Route
            path="/submit"
            element={<SubmitContent workspaces={workspaces} currentUser={currentUser} onSubmit={addSubmission} />}
          />

          <Route
            path="/workspaces"
            element={<ManageWorkspaces workspaces={workspaces} currentUser={currentUser} onAddWorkspace={addWorkspace} />}
          />

          <Route
            path="/users"
            element={<ManageUsers users={users} currentUser={currentUser} onAddUser={addUser} />}
          />

          {/* NEW: review by id, data loaded inside ReviewRoute */}
          <Route
            path="/review/:id"
            element={
              <ReviewRoute
                users={users}
                workspaces={workspaces}
                currentUser={currentUser}
                onApprove={onApprove}
                onReject={onReject}
                feedback={feedback}
                onFeedbackChange={setFeedback}
              />
            }
          />
        </Route>

        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>

      <Footer />
    </div>
  );
}

function Loading() {
  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Loading...</h3>
        <p className="text-gray-600">Fetching data from Firebase...</p>
      </div>
    </div>
  );
}
