// src/App.js
import React, { useState } from "react";
import { Routes, Route, Navigate, useNavigate } from "react-router-dom";

import Login from "./pages/Auth/Login";
import Dashboard from "./pages/Dashboard/Dashboard";     // placeholder now
import ContentPage from "./pages/Content/Content";        // NEW file (moved from Dashboard)
import SubmitContent from "./pages/SubmitContent/SubmitContent";
import ManageWorkspaces from "./pages/ManageWorkspaces/ManageWorkspaces";
import ManageUsers from "./pages/ManageUsers/ManageUsers";
import ReviewRoute from "./pages/ReviewSubmission/ReviewRoute";
import MonthlySEOReport from "./pages/Reports/MonthlySEOReport";
import ReportsList from "./pages/Reports/ReportsList";
import ProtectedLayout from "./components/layout/ProtectedLayout";
import { useAuth } from "./hooks/useAuth";
import { useFirestore } from "./hooks/useFirestore";
import { useSubmissions } from "./hooks/useSubmissions";

const Loading = () => (
  <div className="max-w-4xl mx-auto p-6">
    <div className="text-center py-12">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
      <h3 className="text-lg font-medium text-gray-900 mb-2">Loading...</h3>
      <p className="text-gray-600">Fetching data from Firebase...</p>
    </div>
  </div>
);

const RequireAuth = ({ children }) => {
  const { currentUser, loading } = useAuth();
  if (loading) return <Loading />;
  if (!currentUser) return <Navigate to="/login" replace />;
  return children;
};

export default function App() {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
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

  const onApprove = (id) => {
    updateSubmission(id, { status: "approved", feedback, approvedAt: new Date().toISOString() });
    setFeedback("");
    navigate("/content");
  };

  const onReject = (id) => {
    if (!feedback.trim()) {
      alert("Please provide feedback when rejecting a submission.");
      return;
    }
    updateSubmission(id, { status: "rejected", feedback, rejectedAt: new Date().toISOString() });
    setFeedback("");
    navigate("/content");
  };

  const onSelectSubmission = (submission) => navigate(`/review/${submission.id}`);

  return (
    <Routes>
      {/* Default to Content */}
      <Route path="/" element={<Navigate to="/content" replace />} />
      <Route path="/login" element={<Login />} />

      <Route
        element={
          <RequireAuth>
            <ProtectedLayout />
          </RequireAuth>
        }
      >
        {/* Placeholder dashboard */}
        <Route path="/dashboard" element={<Dashboard />} />

        {/* CONTENT list (migrated from Dashboard) */}
        <Route
          path="/content"
          element={
            isLoading ? (
              <Loading />
            ) : (
              <ContentPage
                submissions={submissions}
                workspaces={workspaces}
                users={users}
                filterWorkspace={filterWorkspace}
                setFilterWorkspace={setFilterWorkspace}
                filterType={filterType}
                setFilterType={setFilterType}
                onSelectSubmission={onSelectSubmission}
              />
            )
          }
        />

        {/* Submit Content (your existing page) */}
        <Route
          path="/content/submit"
          element={<SubmitContent workspaces={workspaces} currentUser={currentUser} onSubmit={addSubmission} />}
        />

        {/* Admin */}
        <Route path="/users" element={<ManageUsers users={users} currentUser={currentUser} onAddUser={addUser} />} />
        <Route
          path="/workspaces"
          element={<ManageWorkspaces workspaces={workspaces} currentUser={currentUser} onAddWorkspace={addWorkspace} />}
        />

        {/* Review by ID */}
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

        {/* Other placeholders */}
        <Route path="/audits" element={<div className="max-w-6xl mx-auto p-6">Audits (placeholder)</div>} />
        <Route path="/seo-reports" element={<ReportsList />} />
<Route path="/seo-reports/:id" element={<MonthlySEOReport />} />
      </Route>

      <Route path="*" element={<Navigate to="/content" replace />} />
    </Routes>
  );
}
