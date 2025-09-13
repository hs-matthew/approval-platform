// src/pages/Audits/AuditsList.js
import React, { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CalendarDays, CheckCircle2, AlertCircle, ExternalLink, Upload } from "lucide-react";
import { useAuth } from "../../hooks/useAuth";

// Export for detail header reuse
export const mockAuditsIndex = [
  { id: "2025-11-tech", title: "November 2025 Technical SEO Audit", createdAt: "2025-11-19", status: "in_progress",
    totals: { total: 23, completed: 15, highPriority: 3 } },
  { id: "2025-10-tech", title: "October 2025 Technical SEO Audit", createdAt: "2025-10-14", status: "completed",
    totals: { total: 18, completed: 18, highPriority: 0 } },
];

const statusPill = (status) =>
  status === "completed" ? (
    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
      <CheckCircle2 className="w-3.5 h-3.5" /> Completed
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
      <div className="w-2 h-2 rounded-full bg-blue-500" /> In Progress
    </span>
  );

export default function AuditsList() {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [showImport, setShowImport] = useState(false);
  const fileInputRef = useRef(null);

  const roles = Array.isArray(currentUser?.roles)
    ? currentUser.roles.map((r) => String(r).toLowerCase())
    : currentUser?.role
    ? [String(currentUser.role).toLowerCase()]
    : [];
  const isAdmin = roles.includes("admin");

  const activeCount = mockAuditsIndex.filter((a) => a.status !== "completed").length;

  // CSV import handler (mock)
  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (file && file.type === "text/csv") {
      console.log("Audit CSV uploaded:", file.name);
      setShowImport(false);
      alert("Audit imported! (Next: create a new audit document, then navigate to it.)");
      // In real impl: parse CSV → create Firestore doc → navigate(`/audits/${newId}`)
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
{/* Header */}
<div className="flex items-center justify-between mb-6">
  {/* Left: Title + description */}
  <div>
    <h1 className="text-3xl font-extrabold text-gray-900">Technical SEO Audits</h1>
    <p className="text-gray-600">
      Review technical issues and track implementation progress
    </p>
  </div>

  {/* Right: Active Audits + Import CSV */}
  <div className="flex items-center gap-6">
    {/* Active Audits Stat Card */}
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm px-6 py-4 text-center">
      <div className="text-sm font-medium text-gray-600">Active Audits</div>
      <div className="text-2xl font-bold text-blue-600">{activeCount}</div>
    </div>

    {/* Admin-only Import CSV */}
    {isAdmin && (
      <button
        onClick={() => setShowImport(true)}
        className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-md text-sm hover:bg-blue-700"
      >
        <Upload className="w-4 h-4" />
        Import Audit CSV
      </button>
    )}
  </div>
</div>

      {/* Cards */}
      <div className="space-y-5">
        {mockAuditsIndex.map((audit) => {
          const { total, completed, highPriority } = audit.totals;
          const progressPct = total > 0 ? Math.round((completed / total) * 100) : 0;

          return (
            <div key={audit.id} className="bg-white rounded-xl border border-gray-200 shadow-sm">
              <div className="p-5">
                {/* Title row */}
                <div className="flex items-center justify-between">
                  <div className="text-lg font-semibold text-gray-900">{audit.title}</div>
                  {statusPill(audit.status)}
                </div>
                <div className="mt-1 flex items-center gap-2 text-sm text-gray-500">
                  <CalendarDays className="w-4 h-4" />
                  Created on{" "}
                  {new Date(audit.createdAt).toLocaleDateString(undefined, {
                    month: "short",
                    day: "2-digit",
                    year: "numeric",
                  })}
                </div>

                {/* Metrics stripes */}
                <div className="mt-4 space-y-3">
                  <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">
                    <div className="text-2xl font-bold text-gray-900">{total}</div>
                    <div className="text-xs text-gray-500">Total Issues</div>
                  </div>

                  <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3">
                    <div className="text-2xl font-bold text-green-600">{completed}</div>
                    <div className="text-xs text-green-700">Completed</div>
                  </div>

                  <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3">
                    <div className="text-2xl font-bold text-red-600 flex items-center gap-1">
                      {highPriority} <AlertCircle className="w-5 h-5" />
                    </div>
                    <div className="text-xs text-red-700">High Priority</div>
                  </div>
                </div>

                {/* Progress + CTA */}
                <div className="mt-4 flex items-center gap-3">
                  <div className="flex-1">
                    <div className="text-xs text-gray-500 mb-1">Progress</div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${progressPct === 100 ? "bg-green-600" : "bg-green-500"}`}
                        style={{ width: `${progressPct}%` }}
                      />
                    </div>
                  </div>

                  <button
                    onClick={() => navigate(`/audits/${audit.id}`)}
                    className="inline-flex items-center gap-2 bg-blue-600 text-white px-3 py-2 rounded-md text-sm hover:bg-blue-700"
                  >
                    <ExternalLink className="w-4 h-4" />
                    View Details
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Admin-only Import Modal */}
      {showImport && isAdmin && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Import SEO Audit CSV</h3>
            <p className="text-sm text-gray-600 mb-4">
              Upload a CSV with columns: <b>Item</b>, <b>Page URL</b>, <b>Priority</b>, <b>Content to Update</b>
            </p>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center mb-4">
              <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-600 mb-3">Click to upload or drag and drop</p>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={handleFileUpload}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm hover:bg-blue-700"
              >
                Choose File
              </button>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowImport(false)}
                className="flex-1 bg-gray-200 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-300"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
