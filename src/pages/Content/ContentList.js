// src/pages/Content/ContentList.jsx
import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "../../lib/firebase";
import { useWorkspace } from "../../context/WorkspaceContext";
import useCurrentUser, {
  canAdminister,
  isStaff,
  canAccessWorkspace,
  getGlobalCollaboratorPerms,
} from "../../hooks/useCurrentUser";
import { FileText, ArrowRight, CheckCircle2 } from "lucide-react";

function toDate(val) {
  // Accept Firestore Timestamp, JS Date, or ISO string
  if (!val) return new Date(0);
  if (val?.toDate) return val.toDate();
  if (val instanceof Date) return val;
  return new Date(String(val));
}

export default function ContentList() {
  const navigate = useNavigate();
  const { activeWorkspace, workspaces, setActiveWorkspaceId } = useWorkspace();
  const { currentUser, loading } = useCurrentUser();

  const [rows, setRows] = useState([]);
  const [loadingRows, setLoadingRows] = useState(true);

  const isPrivileged = useMemo(
    () => canAdminister(currentUser) || isStaff(currentUser),
    [currentUser]
  );
  const perms = useMemo(() => getGlobalCollaboratorPerms(currentUser), [currentUser]);
  const canSubmit = perms.content;

  // Auto-pick a workspace for privileged users
  useEffect(() => {
    if (isPrivileged && !activeWorkspace?.id && workspaces?.length > 0) {
      setActiveWorkspaceId(workspaces[0].id);
    }
  }, [isPrivileged, activeWorkspace?.id, workspaces, setActiveWorkspaceId]);

  // Fetch pending submissions for the active workspace
  useEffect(() => {
    let mounted = true;
    async function run() {
      if (!activeWorkspace?.id || !currentUser) return;
      setLoadingRows(true);
      try {
        // NOTE: no orderBy here to avoid composite index requirement.
        const qRef = query(
          collection(db, "submissions"),
          where("workspaceId", "==", activeWorkspace.id),
          where("status", "==", "pending")
        );
        const snap = await getDocs(qRef);
        if (!mounted) return;

        const items = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        // Sort in JS by submittedAt desc (works for string or Timestamp)
        items.sort((a, b) => toDate(b.submittedAt) - toDate(a.submittedAt));
        setRows(items);
      } catch (e) {
        console.error("Failed to load submissions:", e);
        if (mounted) setRows([]);
      } finally {
        if (mounted) setLoadingRows(false);
      }
    }
    run();
    return () => {
      mounted = false;
    };
  }, [activeWorkspace?.id, currentUser]);

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto p-6">
        <p className="text-gray-600">Loading user…</p>
      </div>
    );
  }

  // For non-privileged users with nothing selected, ask to pick one
  if (!activeWorkspace?.id && !isPrivileged) {
    return (
      <div className="max-w-5xl mx-auto p-6">
        <h2 className="text-xl font-semibold mb-2">Select a workspace</h2>
        <p className="text-gray-600">Choose a workspace from the selector to view pending content.</p>
      </div>
    );
  }

  const allowedForWorkspace =
    activeWorkspace?.id && (isPrivileged || canAccessWorkspace(currentUser, activeWorkspace.id));
  if (!allowedForWorkspace) {
    return (
      <div className="max-w-5xl mx-auto p-6">
        <h2 className="text-xl font-semibold mb-2">No access</h2>
        <p className="text-gray-600">You don’t have access to this workspace.</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Content</h2>
          {activeWorkspace && (
            <p className="text-gray-600">Pending items for {activeWorkspace.name}</p>
          )}
        </div>

        {canSubmit && (
          <button
            onClick={() => navigate("/content/submit")}
            className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
          >
            Submit New Content
            <ArrowRight className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Pending list */}
      <div className="bg-white border border-gray-200 rounded-lg">
        <div className="px-4 py-3 border-b border-gray-200 flex items-center gap-2">
          <FileText className="w-5 h-5 text-gray-700" />
          <h3 className="font-semibold text-gray-900">Pending Review</h3>
        </div>

        {loadingRows ? (
          <div className="p-6 text-gray-600">Loading…</div>
        ) : rows.length === 0 ? (
          <div className="p-6 text-gray-600">No pending submissions.</div>
        ) : (
          <ul className="divide-y divide-gray-200">
            {rows.map((r) => (
              <li key={r.id} className="p-4 flex items-center justify-between">
                <div>
                  <div className="font-medium text-gray-900">{r.title || "(Untitled)"}</div>
                  <div className="text-sm text-gray-600">
                    {(r.type || "content").replace("_", " ")} ·{" "}
                    {toDate(r.submittedAt).toLocaleString()}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {r.status === "approved" && (
                    <span className="inline-flex items-center gap-1 text-green-700 text-sm bg-green-100 px-2 py-1 rounded">
                      <CheckCircle2 className="w-4 h-4" /> Approved
                    </span>
                  )}
                  <Link
                    to={`/content/review/${r.id}`}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    Review
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
