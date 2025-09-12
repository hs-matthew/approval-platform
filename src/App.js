// src/App.js
import React, { useState } from "react";
import {
  Routes,
  Route,
  Navigate,
  useNavigate,
} from "react-router-dom";

import Dashboard from "./pages/Dashboard/Dashboard";
import SubmitContent from "./pages/SubmitContent/SubmitContent";
import ManageWorkspaces from "./pages/ManageWorkspaces/ManageWorkspaces";
import ManageUsers from "./pages/ManageUsers/ManageUsers";
import ReviewSubmission from "./pages/ReviewSubmission/ReviewSubmission";
import Login from "./pages/Auth/Login";

import { useAuth } from "./hooks/useAuth";
import { useFirestore } from "./hooks/useFirestore";
import { useSubmissions } from "./hooks/useSubmissions";

import ProtectedLayout from "./components/layout/ProtectedLayout";

// Simple loading spinner while waiting on data
const Loading = () => (
  <div className="max-w-4xl mx-auto p-6">
    <div className="text-center py-12">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
      <h3 className="text-lg font-medium text-gray-900 mb-2">Loading...</h3>
      <p className="text-gray-600">Fetching data from Firebase...</p>
    </div>
  </div>
);

// Auth gate for protected routes
const RequireAuth = ({ children }) => {
  const { currentUser, loading } = useAuth();
  if (loading) return <Loading />;
  if (!currentUser) return <Navigate to="/login" replace />;
  return children;
};

// Review route wrapper – loads submission by ID from Firestore
const ReviewRoute = ({
  users,
  workspaces,
  currentUser,
  onApprove,
  onReject,
  feedback,
  onFeedbackChange,
}) => {
  const { submissions } = useSubmissions(workspaces);
  const navigate = useNavigate();
  const { id } = useParams();
  const submission = submissions.find((s) => s.id === id);

  if (!submission) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <h2 className="text-xl font-semibold mb-4">Submission not found</h2>
        <button
          onClick={() => navigate("/dashboard")}
          className="px-4 py-2 bg-blue-600 text-white rounded-md"
        >
          Back to Dashboard
        </button>
      </div>
    );
  }

  const workspace = workspaces.find((w) => w.id === submission.workspaceId);
  const author = users.find((u) => u.id === submission.authorId);

  return (
    <ReviewSubmission
      submission={submission}
      workspace={workspace}
      author={author}
      currentUser={currentUser}
      feedback={feedback}
      onFeedbackChange={onFeedbackChange}
      onApprove={onApprove}
      onReject={onReject}
      onBack={() => navigate("/dashboard")}
    />
  );
};

export default function App() {
  const { currentUser } = useAuth();
  const [feedback, setFeedback] = useState("");

  // Firestore hooks
  const {
    data: users,
    addItem: addUser,
    loading: usersLoading,
  } = useFirestore("users");
  const {
    data: workspaces,
    addItem: addWorkspace,
    loading: workspacesLoading,
  } = useFirestore("workspaces");
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
    updateSubmission(id, {
      status: "approved",
      feedback,
      approvedAt: new Date().toISOString(),
    });
    setFeedback("");
  };

  const onReject = (id) => {
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
    <Routes>
      {/* Public */}
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="/login" element={<Login />} />

      {/* Protected Layout with nav + outlet */}
      <Route
        element={
          <RequireAuth>
            <ProtectedLayout />
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
                onSelectSubmission={() => {}}
              />
            )
          }
        />
        <Route
          path="/content"
          element={
            <SubmitContent
              workspaces={workspaces}
              currentUser={currentUser}
              onSubmit={addSubmission}
            />
          }
        />
        <Route
          path="/audits"
          element={<div className="p-6">Audits (placeholder)</div>}
        />
        <Route
          path="/seo-reports"
          element={<div className="p-6">SEO Reports (placeholder)</div>}
        />
        <Route
          path="/users"
          element={
            <ManageUsers
              users={users}
              currentUser={currentUser}
              onAddUser={addUser}
            />
          }
        />
        <Route
          path="/workspaces"
          element={
            <ManageWorkspaces
              workspaces={workspaces}
              currentUser={currentUser}
              onAddWorkspace={addWorkspace}
            />
          }
        />
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
  );
}
