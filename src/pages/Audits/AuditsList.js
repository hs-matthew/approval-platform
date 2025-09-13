import React from "react";
import { useNavigate } from "react-router-dom";
import { CalendarDays, CheckCircle2, AlertCircle, ExternalLink } from "lucide-react";

// Export so the detail page can reuse this later
export const mockAuditsIndex = [
  {
    id: "2025-11-tech",
    title: "November 2025 Technical SEO Audit",
    createdAt: "2025-11-19",
    status: "in_progress",        // "in_progress" | "completed"
    totals: { total: 23, completed: 15, highPriority: 3 },
  },
  {
    id: "2025-10-tech",
    title: "October 2025 Technical SEO Audit",
    createdAt: "2025-10-14",
    status: "completed",
    totals: { total: 18, completed: 18, highPriority: 0 },
  },
];

const statusPill = (status) => {
  if (status === "completed")
    return (
      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
        <CheckCircle2 className="w-3.5 h-3.5" /> Completed
      </span>
    );
  return (
    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
      <div className="w-2 h-2 rounded-full bg-blue-500" /> In Progress
    </span>
  );
};

export default function AuditsList() {
  const navigate = useNavigate();
  const activeCount = mockAuditsIndex.filter(a => a.status !== "completed").length;

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Header */}
      <div className="flex items-start justify-between mb-5">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900">Technical SEO Audits</h1>
          <p className="text-gray-600">Review technical issues and track implementation progress</p>
        </div>
        <div className="text-right">
          <div className="text-sm text-gray-500">Active Audits</div>
          <div className="text-3xl font-bold text-blue-600">{activeCount}</div>
        </div>
      </div>

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
                  {/* Total Issues */}
                  <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">
                    <div className="text-2xl font-bold text-gray-900">{total}</div>
                    <div className="text-xs text-gray-500">Total Issues</div>
                  </div>

                  {/* Completed */}
                  <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3">
                    <div className="text-2xl font-bold text-green-600">{completed}</div>
                    <div className="text-xs text-green-700">Completed</div>
                  </div>

                  {/* High Priority */}
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
    </div>
  );
}
