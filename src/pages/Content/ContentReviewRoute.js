// src/pages/Content/ContentReviewRoute.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../../lib/firebase";
import ReviewSubmission from "../ReviewSubmission/ReviewSubmission";
import { useWorkspace } from "../../context/WorkspaceContext";
import useCurrentUser, {
  canAdminister,
  isStaff,
  canAccessWorkspace,
} from "../../hooks/useCurrentUser";

export default function ContentReviewRoute({
  users = [],
  workspaces = [],
  onApprove,
  onReject,
  feedback,
  onFeedbackChange,
}) {
  const { id } = useParams();
  const navigate = useNavigate();
  const { activeWorkspace } = useWorkspace();
  const { currentUser, loading } = useCurrentUser();

  const [submission, setSubmission] = useState(null);
  const [loadingSub, setLoadingSub] = useState(true);

  const canModerate = useMemo(
    () => canAdminister(currentUser) || isStaff(currentUser),
    [currentUser]
  );
  const isPrivileged = canModerate;

  // Load submission by id
  useEffect(() => {
    let mounted = true;
    async function run() {
      try {
        const ref = doc(db, "submissions", id);
        const snap = await getDoc(ref);
        if (!mounted) return;
        if (!snap.exists()) {
          setSubmission(null);
        } else {
          setSubmission({ id: snap.id, ...snap.data() });
        }
      } catch (e) {
        console.error("Failed to load submission:", e);
        setSubmission(null);
      } finally {
        if (mounted) setLoadingSub(false);
      }
    }
    run();
    return () => {
      mounted = false;
    };
  }, [id]);

  if (loading || loadingSub) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Loading submission…</h3>
        </div>
      </div>
    );
  }

  if (!submission) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <h2 className="text-xl font-semibold mb-2">Submission not found</h2>
        <button
          onClick={() => navigate("/content")}
          className="mt-2 px-3 py-2 rounded-md bg-gray-100 hover:bg-gray-200"
        >
          Back to Content
        </button>
      </div>
    );
  }

  // Workspace context fallback to the submission's workspace
  const workspace =
    workspaces.find((w) => String(w.id) === String(submission.workspaceId)) ||
    activeWorkspace ||
    null;

  // Admin/Owner/Staff bypass membership; others must be in workspaceIds
  const allowedToSee =
    !!workspace && (isPrivileged || canAccessWorkspace(currentUser, submission.workspaceId));

  if (!allowedToSee) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <h2 className="text-xl font-semibold mb-2">No access</h2>
        <p className="text-gray-600">You don’t have access to this submission.</p>
        <button
          onClick={() => navigate("/content")}
          className="mt-3 px-3 py-2 rounded-md bg-gray-100 hover:bg-gray-200"
        >
          Back to Content
        </button>
      </div>
    );
  }

  const author = users.find((u) => String(u.id) === String(submission.authorId)) || null;

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
      canModerate={canModerate}   // <-- hides Approve/Reject if false
      onBack={() => navigate("/content")}
    />
  );
}
