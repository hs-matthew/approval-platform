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
  {/* Left: Title + description */}
  <div>
    <h1 className="text-3xl font-extrabold text-gray-900">Monthly SEO Reports</h1>
    <p className="text-gray-600">View detailed reports of completed SEO work by month</p>
  </div>

  {/* Right: Available Reports stat card (same style as Audits) */}
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
          const barTrack = "bg-gray-200";

          return (
<div
  key={r.id}
  className={`bg-white rounded-xl border ${
    r.isCurrent ? "border-blue-300" : "border-gray-200"
  } shadow-sm`}
>
  <div className="p-5 flex flex-col h-full">
    {/* Top row */}
    <div className="flex items-center justify-between">
      <div className="text-xl font-semibold text-gray-900">
        {r.monthLabel}
      </div>
      <div className="flex items-center gap-3">
        {r.isCurrent && (
          <span className="px-3 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-700">
            Current
          </span>
        )}
        <div className="text-sm font-semibold text-gray-900">
          {utilization}%
        </div>
      </div>
    </div>

    {/* Utilization bar */}
    <div className="mt-3">
      <div className={`w-full ${barTrack} h-2 rounded-full`}>
        <div
          className={`${barColor} h-2 rounded-full transition-all`}
          style={{ width: `${utilization}%` }}
        />
      </div>
    </div>

    {/* Stats row */}
    <div className="mt-5 grid grid-cols-2 gap-6 text-center">
      <div>
        <div className="text-3xl font-bold text-gray-900">
          {r.deliverables}
        </div>
        <div className="text-xs text-gray-500 mt-1">Deliverables</div>
      </div>
      <div>
        <div className="text-3xl font-bold text-blue-700">
          {r.usedCredits}
        </div>
        <div className="text-xs text-gray-500 mt-1">Credits Used</div>
      </div>
    </div>

    {/* Footer row (date left, link right) */}
    <div className="mt-6 flex items-center justify-between text-sm text-gray-500">
      <div className="flex items-center gap-2">
        <Calendar className="w-4 h-4" />
        {new Date(r.lastUpdated).toLocaleDateString(undefined, {
          month: "short",
          day: "2-digit",
          year: "numeric",
        })}
      </div>
      <button
        onClick={() => navigate(`/seo-reports/${r.id}`)}
        className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 font-medium text-sm"
      >
        View Report
        <ArrowRight className="w-4 h-4" />
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
