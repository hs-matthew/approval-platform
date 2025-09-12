import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../../lib/firebase";
import ReviewSubmission from "./ReviewSubmission";

export default function ReviewRoute({
  users,
  workspaces,
  currentUser,
  onApprove,
  onReject,
  feedback,
  onFeedbackChange,
}) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [submission, setSubmission] = useState(null);
  const [loading, setLoading] = useState(true);

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
        if (mounted) setLoading(false);
      }
    }
    run();
    return () => {
      mounted = false;
    };
  }, [id]);

  if (loading) {
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
          onClick={() => navigate("/dashboard")}
          className="mt-2 px-3 py-2 rounded-md bg-gray-100 hover:bg-gray-200"
        >
          Back to Dashboard
        </button>
      </div>
    );
  }

  const workspace = workspaces.find(w => w.id === submission.workspaceId);
  const author = users.find(u => u.id === submission.authorId);

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
}
