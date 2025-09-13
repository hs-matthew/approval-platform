// src/App.js
import React, { useState } from "react";
import { Routes, Route, Navigate } from "react-router-dom";

// Layout
import Navigation from "./components/layout/Navigation";
import Footer from "./components/layout/Footer";

// Context
import { WorkspaceProvider, useWorkspace } from "./context/WorkspaceContext";

// Hooks
import { useAuth } from "./hooks/useAuth";
import { useFirestore } from "./hooks/useFirestore";
import { useSubmissions } from "./hooks/useSubmissions";

// Pages
import Dashboard from "./pages/Dashboard/Dashboard";                // placeholder (simple skeleton ok)
import ContentPage from "./pages/Content/ContentPage";              
import SubmitContent from "./pages/SubmitContent/SubmitContent";    
import ManageWorkspaces from "./pages/ManageWorkspaces/ManageWorkspaces";
import ManageUsers from "./pages/ManageUsers/ManageUsers";
import ReviewSubmission from "./pages/ReviewSubmission/ReviewSubmission";

import ReportsList from "./pages/Reports/ReportsList";
import ReportDetail from "./pages/Reports/ReportDetail";            

import AuditsList from "./pages/Audits/AuditsList";
import AuditDetail from "./pages/Audits/AuditDetail";

// (Optional) Profile/Login pages if you have them
//import Profile from "./pages/Profile/Profile";                      if not created yet, stub it
//import Login from "./pages/Auth/Login";                             if not created yet, stub it

function App() {
  // ✅ Keep ApprovalPlatform as the default export for index.js to render
  return <ApprovalPlatform />;
}

const ApprovalPlatform = () => {
  const { currentUser } = useAuth();

  // Local UI state
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [feedback, setFeedback] = useState("");

  // Firestore data
  const { data: users, addItem: addUser, loading: usersLoading } = useFirestore("users");
  const { data: workspaces, addItem: addWorkspace, loading: workspacesLoading } = useFirestore("workspaces");

  // Submissions (you can later move workspace filtering into the hook’s query)
  const {
    submissions,
    addSubmission,
    updateSubmission,
    filterType,
    setFilterType,
    loading: submissionsLoading,
  } = useSubmissions(workspaces);

  const isLoading = usersLoading || workspacesLoading || submissionsLoading;

  const handleSelectSubmission = (submission) => {
    setSelectedSubmission(submission);
  };

  const handleApprove = (id) => {
    updateSubmission(id, {
      status: "approved",
      feedback,
      approvedAt: new Date().toISOString(),
    });
    setFeedback("");
  };

  const handleReject = (id) => {
    if (!feedback.trim()) {
      alert("Please provide feedback when rejecting a submission.");
      return;
    }
    updateSubmission(id, {
      status: "rejected",
      feedback,
      rejectedAt: new Date().toISOString(),
    });
    setFeedback("");
  };

  return (
    <WorkspaceProvider workspaces={workspaces}>
      <div className="min-h-screen bg-gray-100">
        <Navigation currentUser={currentUser} />

        {isLoading ? (
          <div className="max-w-4xl mx-auto p-6">
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Loading...</h3>
              <p className="text-gray-600">Fetching data from Firebase…</p>
            </div>
          </div>
        ) : (
          <MainRoutes
            currentUser={currentUser}
            users={users}
            workspaces={workspaces}
            submissions={submissions}
            addSubmission={addSubmission}
            updateSubmission={updateSubmission}
            filterType={filterType}
            setFilterType={setFilterType}
            selectedSubmission={selectedSubmission}
            setSelectedSubmission={setSelectedSubmission}
            feedback={feedback}
            setFeedback={setFeedback}
            onApprove={handleApprove}
            onReject={handleReject}
            onSelectSubmission={handleSelectSubmission}
            onAddUser={addUser}
            onAddWorkspace={addWorkspace}
          />
        )}

        <Footer />
      </div>
    </WorkspaceProvider>
  );
};

/**
 * Routes separated for clarity. Applies active workspace filtering before
 * passing data down to pages.
 */
function MainRoutes(props) {
  const {
    currentUser,
    users,
    workspaces,
    submissions,
    addSubmission,
    updateSubmission,
    filterType,
    setFilterType,
    selectedSubmission,
    setSelectedSubmission,
    feedback,
    setFeedback,
    onApprove,
    onReject,
    onSelectSubmission,
    onAddUser,
    onAddWorkspace,
  } = props;

  const { activeWorkspaceId } = useWorkspace();

  // ✅ Filter submissions by active workspace (client-side for now)
  const filteredSubmissions =
    activeWorkspaceId === "all"
      ? submissions
      : submissions.filter((s) => String(s.workspaceId) === String(activeWorkspaceId));

  return (
    <Routes>
      {/* Default redirect to Dashboard */}
      <Route path="/" element={<Navigate to="/dashboard" replace />} />

      {/* Dashboard (placeholder for now) */}
      <Route path="/dashboard" element={<Dashboard />} />

      {/* Content list (formerly Dashboard UI) */}
      <Route
        path="/content"
        element={
          <ContentPage
            submissions={filteredSubmissions}
            workspaces={workspaces}
            users={users}
            currentUser={currentUser}
            filterType={filterType}
            setFilterType={setFilterType}
            onSelectSubmission={(s) => {
              onSelectSubmission(s);
              // navigate handled inside the page if you want deep-links,
              // or just use state + a modal; your choice.
            }}
          />
        }
      />

      {/* Submit Content (separate page) */}
      <Route
        path="/content/submit"
        element={
          <SubmitContent
            workspaces={workspaces}
            currentUser={currentUser}
            onSubmit={addSubmission}
          />
        }
      />

      {/* Review a submission by ID (shareable deep link) */}
      <Route
        path="/review/:id"
        element={
          <ReviewSubmission
            submission={selectedSubmission}
            // If you want to fetch by :id here, you can do it inside the component.
            // For now we still pass state for compatibility.
            workspace={
              selectedSubmission
                ? workspaces.find((w) => String(w.id) === String(selectedSubmission.workspaceId))
                : null
            }
            author={
              selectedSubmission
                ? users.find((u) => String(u.id) === String(selectedSubmission.authorId))
                : null
            }
            currentUser={currentUser}
            feedback={feedback}
            onFeedbackChange={setFeedback}
            onApprove={onApprove}
            onReject={onReject}
          />
        }
      />

      {/* Reports */}
      <Route path="/seo-reports" element={<ReportsList />} />
      <Route path="/seo-reports/:id" element={<ReportDetail />} />

      {/* Audits */}
      <Route path="/audits" element={<AuditsList />} />
      <Route path="/audits/:id" element={<AuditDetail />} />

      {/* Admin */}
      <Route
        path="/users"
        element={
          <ManageUsers
            users={users}
            currentUser={currentUser}
            onAddUser={onAddUser}
          />
        }
      />
      <Route
        path="/workspaces"
        element={
          <ManageWorkspaces
            workspaces={workspaces}
            currentUser={currentUser}
            onAddWorkspace={onAddWorkspace}
          />
        }
      />

      {/* Profile / Auth */}
      <Route path="/profile" element={<Profile currentUser={currentUser} />} />
      <Route path="/login" element={<Login />} />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

export default App;
