// src/App.js
import React, { useState } from "react";
import { Routes, Route, Navigate } from "react-router-dom";

// Auth
import AcceptInvite from "./pages/Auth/AcceptInvite";
import Login from "./pages/Auth/Login";

// Layout
import Navigation from "./components/layout/Navigation";
import Footer from "./components/layout/Footer";

// Context
import { WorkspaceProvider, useWorkspace } from "./context/WorkspaceContext";

// Hooks
import useCurrentUser from "./hooks/useCurrentUser";
import { useFirestore } from "./hooks/useFirestore";
import { useSubmissions } from "./hooks/useSubmissions";

// Dashbaord
import Dashboard from "./pages/Dashboard/Dashboard";

// Content
import ContentList from "./pages/Content/ContentList";
import SubmitContent from "./pages/Content/SubmitContent";
import ContentReviewRoute from "./pages/Content/ContentReviewRoute";

// Reports
import ReportsList from "./pages/Reports/ReportsList";
import ReportDetail from "./pages/Reports/ReportDetail";

// Audits
import AuditsList from "./pages/Audits/AuditsList";
import AuditDetail from "./pages/Audits/AuditDetail";

// Users
import Users from "./pages/Users/Users";
import AddUser from "./pages/Users/AddUser";
import EditUser from "./pages/Users/EditUser";
import UserProfile from "./pages/Users/UserProfile";
import ManageWorkspaces from "./pages/ManageWorkspaces/ManageWorkspaces";
import InvitesList from "./pages/Users/InvitesList";



// ------------------------------------------------------------------

export default function App() {
  // ✅ Keep ApprovalPlatform as the default export
  return <ApprovalPlatform />;
}

function ApprovalPlatform() {
  const { currentUser, loading: userLoading } = useCurrentUser();

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

  const isLoading = userLoading || usersLoading || workspacesLoading || submissionsLoading;

  const handleSelectSubmission = (submission) => setSelectedSubmission(submission);

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
  <WorkspaceProvider>
    {/* Flex column wrapper makes the footer sticky */}
    <div className="min-h-screen flex flex-col bg-gray-100">
      <Navigation currentUser={currentUser} />

      {/* Main grows to fill the remaining space */}
      <main className="flex-1">
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
      </main>

      {/* Footer naturally sits at bottom of viewport or content */}
      <Footer />
    </div>
  </WorkspaceProvider>
);
}

// ------------------------------------------------------------------
// Routes (workspace-scoped)
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

  function ProfilePlaceholder({ currentUser }) {
  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-xl font-semibold mb-2">Profile</h1>
      <pre className="text-sm bg-white border rounded p-3 overflow-auto">
        {JSON.stringify(currentUser || {}, null, 2)}
      </pre>
    </div>
  );
}

function LoginPlaceholder() {
  return (
    <div className="max-w-md mx-auto p-6">
      <h1 className="text-xl font-semibold mb-2">Login</h1>
      <p className="text-gray-600">Replace this with your real Login page.</p>
    </div>
  );
}

  // 🟦 Single source of truth for active workspace
  const { activeWorkspaceId } = useWorkspace();

  // 🔎 Client-side workspace filter (keeps "all" working if you expose it in the nav)
  const byWorkspace = (list) =>
    activeWorkspaceId === "all"
      ? list || []
      : (list || []).filter((item) => String(item?.workspaceId) === String(activeWorkspaceId));

  const filteredSubmissions = byWorkspace(submissions);

  return (
    <Routes>
      {/* Default redirect */}
      <Route path="/" element={<Navigate to="/dashboard" replace />} />

      {/* Dashboard */}
      <Route path="/dashboard" element={<Dashboard />} />
{/* Content */}
{/* Content hub (pending list + CTA) */}
<Route path="/content" element={<ContentList />} />

{/* Submit Content (reuses your existing component) */}
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

{/* Review a specific submission (loads by ID; handles permissions) */}
<Route
  path="/content/review/:id"
  element={
    <ContentReviewRoute
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
{/* Auth */}
<Route path="/accept-invite" element={<AcceptInvite />} />
<Route path="/login" element={<Login />} />

      {/* Reports */}
      <Route path="/reports" element={<ReportsList />} />
      <Route path="/reports/:id" element={<ReportDetail />} />

      {/* Audits */}
      <Route path="/audits" element={<AuditsList />} />
      <Route path="/audits/:id" element={<AuditDetail />} />
      
{/* Users */}
<Route path="/users" element={<Users />} />
<Route path="/users/new" element={<AddUser />} />
<Route path="/users/:id/edit" element={<EditUser />} />
<Route path="/profile" element={<UserProfile />} />
<Route path="/invites" element={<InvitesList />} />

      {/* Admin */}
      <Route
        path="/users"
        element={<Users users={users} currentUser={currentUser} onAddUser={onAddUser} />}
      />
      <Route
        path="/workspaces"
        element={<ManageWorkspaces workspaces={workspaces} currentUser={currentUser} onAddWorkspace={onAddWorkspace} />}
      />

      {/* Profile / Auth placeholders (replace with real pages when added) */}
      <Route path="/login" element={<LoginPlaceholder />} />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
