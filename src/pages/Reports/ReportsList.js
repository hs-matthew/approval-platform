// src/pages/Reports/ReportsList.js
import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { Calendar, ArrowRight } from "lucide-react";

// --- Mock list of monthly reports you have available ---
export const mockReportIndex = [
  {
    id: "2025-11",
    monthLabel: "November 2025",
    isCurrent: true,
    totalCredits: 40,
    usedCredits: 32,
    deliverables: 8,
    lastUpdated: "2025-11-29",
  },
  {
    id: "2025-10",
    monthLabel: "October 2025",
    isCurrent: false,
    totalCredits: 40,
    usedCredits: 38,
    deliverables: 9,
    lastUpdated: "2025-10-30",
  },
  {
    id: "2025-09",
    monthLabel: "September 2025",
    isCurrent: false,
    totalCredits: 20,
    usedCredits: 17,
    deliverables: 6,
    lastUpdated: "2025-09-28",
  },
  {
    id: "2025-08",
    monthLabel: "August 2025",
    isCurrent: false,
    totalCredits: 20,
    usedCredits: 18,
    deliverables: 7,
    lastUpdated: "2025-08-30",
  },
  {
    id: "2025-07",
    monthLabel: "July 2025",
    isCurrent: false,
    totalCredits: 20,
    usedCredits: 19,
    deliverables: 7,
    lastUpdated: "2025-07-31",
  },
];

export default function ReportsList() {
  const navigate = useNavigate();
  const totalAvailable = mockReportIndex.length;

 return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900">
            Monthly SEO Reports
          </h1>
        <p className="text-gray-600">
            View detailed reports of completed SEO work by month
          </p>
        </div>

        {/* Available Reports stat card (same style as Audits) */}
        <div className="bg-white border border-gray-200 rounded-md shadow-sm px-4 py-2 text-center">
          <div className="text-xs font-medium text-gray-600">Available Reports</div>
          <div className="text-lg font-bold text-blue-600">{totalAvailable}</div>
        </div>
      </div>

      {/* Cards */}
      <div className="space-y-5">
        {mockReportIndex.map((r) => {
          const utilization = Math.round((r.usedCredits / r.totalCredits) * 100);
          const barColor = r.isCurrent ? "bg-blue-600" : "bg-green-600";

          return (
            <div
              key={r.id}
              className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 flex flex-col h-full"
            >
              {/* Title + Date (like audits list) */}
              <div className="mb-4">
                <h2 className="text-xl font-semibold text-gray-900">{r.monthLabel}</h2>
                <p className="text-sm text-gray-500">
                  Created on{" "}
                  {new Date(r.lastUpdated).toLocaleDateString(undefined, {
                    month: "short",
                    day: "2-digit",
                    year: "numeric",
                  })}
                </p>
              </div>

              {/* Stat boxes (3) */}
              <div className="grid grid-cols-3 gap-4 text-center mb-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="text-2xl font-bold text-gray-900">{r.deliverables}</div>
                  <div className="text-xs text-gray-500 mt-1">Deliverables</div>
                </div>
                <div className="bg-blue-50 rounded-lg p-4">
                  <div className="text-2xl font-bold text-blue-700">{r.usedCredits}</div>
                  <div className="text-xs text-gray-500 mt-1">Credits Used</div>
                </div>
                <div className="bg-indigo-50 rounded-lg p-4">
                  <div className="text-2xl font-bold text-indigo-700">{r.totalCredits}</div>
                  <div className="text-xs text-gray-500 mt-1">Monthly Credits</div>
                </div>
              </div>

              {/* Credit Utilization bar */}
              <div className="flex-1">
                <div className="text-xs text-gray-500 mb-1">Credit Utilization</div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`${barColor} h-2 rounded-full transition-all`}
                    style={{ width: `${utilization}%` }}
                  />
                </div>
              </div>

              {/* Footer link pinned at bottom-right */}
              <div className="mt-4 flex justify-end">
                <Link
                  to={`/seo-reports/${r.id}`}
                  className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 font-medium text-sm"
                  aria-label={`View report for ${r.monthLabel}`}
                >
                  View Report
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
