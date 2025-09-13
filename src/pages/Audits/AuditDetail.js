// src/pages/Audits/AuditDetail.js
import React, { useRef, useState } from "react";
import { useParams, Link } from "react-router-dom";
import {
  Upload,
  CheckCircle,
  AlertCircle,
  Clock,
  ExternalLink,
  BarChart3,
  ArrowLeft,
  CalendarDays,
} from "lucide-react";
import { mockAuditsIndex } from "./AuditsList"; // reuse list metadata

// --- Mock data to simulate CSV import results (per-audit items) ---
const mockAuditData = [
  {
    id: 1,
    item: "Missing meta descriptions",
    pageUrl: "https://example.com/services",
    priority: "High",
    contentToUpdate:
      "Add meta description: 'Professional web design services in Austin, TX. Get a custom website that drives results. Free consultation available.'",
    completed: false,
  },
  {
    id: 2,
    item: "Image missing alt text",
    pageUrl: "https://example.com/about",
    priority: "Medium",
    contentToUpdate:
      "Add alt text to hero image: 'Team of web designers collaborating on laptop in modern office'",
    completed: true,
  },
  {
    id: 3,
    item: "Page loading slowly",
    pageUrl: "https://example.com/portfolio",
    priority: "High",
    contentToUpdate:
      "Optimize images and enable compression. Target load time under 3 seconds.",
    completed: false,
  },
  {
    id: 4,
    item: "H1 tag missing",
    pageUrl: "https://example.com/contact",
    priority: "High",
    contentToUpdate: "Add H1 tag: 'Contact Our Web Design Team'",
    completed: false,
  },
  {
    id: 5,
    item: "Internal link opportunity",
    pageUrl: "https://example.com/blog/seo-tips",
    priority: "Low",
    contentToUpdate: "Add internal link to services page in paragraph 3",
    completed: true,
  },
  {
    id: 6,
    item: "Title tag too long",
    pageUrl: "https://example.com/services/ecommerce",
    priority: "Medium",
    contentToUpdate:
      "Shorten title from 68 to 55 characters: 'Austin Ecommerce Web Design | Custom Online Stores'",
    completed: false,
  },
];

const getPriorityIcon = (priority) => {
  switch (priority.toLowerCase()) {
    case "high":
      return <AlertCircle className="w-4 h-4 text-red-500" />;
    case "medium":
      return <Clock className="w-4 h-4 text-yellow-500" />;
    case "low":
      return <BarChart3 className="w-4 h-4 text-blue-500" />;
    default:
      return <Clock className="w-4 h-4 text-gray-500" />;
  }
};

const getPriorityColor = (priority) => {
  switch (priority.toLowerCase()) {
    case "high":
      return "bg-red-50 border-red-200 text-red-800";
    case "medium":
      return "bg-yellow-50 border-yellow-200 text-yellow-800";
    case "low":
      return "bg-blue-50 border-blue-200 text-blue-800";
    default:
      return "bg-gray-50 border-gray-200 text-gray-800";
  }
};

export default function AuditDetail() {
  const { id } = useParams(); // e.g. "2025-11-tech"
  const header = mockAuditsIndex.find((a) => a.id === id);
  const [auditData, setAuditData] = useState(mockAuditData);
  const [showImport, setShowImport] = useState(false);
  const fileInputRef = useRef(null);

  // Progress stats
  const totalItems = auditData.length;
  const completedItems = auditData.filter((i) => i.completed).length;
  const progressPercentage =
    totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;

  const priorityStats = auditData.reduce((acc, item) => {
    const p = item.priority.toLowerCase();
    acc[p] = acc[p] || { total: 0, completed: 0 };
    acc[p].total++;
    if (item.completed) acc[p].completed++;
    return acc;
  }, {});

  const toggleCompleted = (rowId) => {
    setAuditData((data) =>
      data.map((i) => (i.id === rowId ? { ...i, completed: !i.completed } : i))
    );
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (file && file.type === "text/csv") {
      console.log("CSV uploaded:", file.name);
      setShowImport(false);
      alert("CSV imported successfully! Audit items updated.");
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Back link */}
      <div className="mb-4">
        <Link
          to="/audits"
          className="inline-flex items-center text-blue-600 hover:text-blue-800 text-sm font-medium"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back to Audits
        </Link>
      </div>

      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {header?.title || "SEO Technical Audit"}
            </h1>
            <p className="text-gray-600 flex items-center gap-2">
              <CalendarDays className="w-4 h-4" />
              {header?.createdAt
                ? `Created on ${new Date(header.createdAt).toLocaleDateString()}`
                : "Review and track technical SEO improvements"}
            </p>
          </div>
          <button
            onClick={() => setShowImport(true)}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
          >
            <Upload className="w-4 h-4" />
            Import CSV
          </button>
        </div>

        {/* Progress Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Overall Progress */}
          <div className="bg-gradient-to-r from-green-50 to-green-100 p-4 rounded-lg border border-green-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-green-800">
                Overall Progress
              </span>
              <span className="text-2xl font-bold text-green-600">
                {progressPercentage}%
              </span>
            </div>
            <div className="w-full bg-green-200 rounded-full h-2">
              <div
                className="bg-green-600 h-2 rounded-full transition-all duration-500"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
            <p className="text-xs text-green-700 mt-1">
              {completedItems} of {totalItems} completed
            </p>
          </div>

          {/* Priority Breakdowns */}
          {["high", "medium", "low"].map((priority) => {
            const stats = priorityStats[priority] || { total: 0, completed: 0 };
            const pct =
              stats.total > 0
                ? Math.round((stats.completed / stats.total) * 100)
                : 0;
            return (
              <div
                key={priority}
                className={`p-4 rounded-lg border ${getPriorityColor(priority)}`}
              >
                <div className="flex items-center gap-2 mb-2">
                  {getPriorityIcon(priority)}
                  <span className="font-medium capitalize">
                    {priority} Priority
                  </span>
                </div>
                <div className="text-2xl font-bold mb-1">
                  {stats.completed}/{stats.total}
                </div>
                <div className="text-xs opacity-75">{pct}% complete</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Audit Items */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Audit Items</h2>
          <p className="text-sm text-gray-600">
            Click the checkbox when an item is completed
          </p>
        </div>

        <div className="divide-y divide-gray-200">
          {auditData.map((item) => (
            <div
              key={item.id}
              className={`p-6 ${item.completed ? "bg-gray-50" : "bg-white"}`}
            >
              <div className="flex items-start gap-4">
                {/* Checkbox */}
                <button
                  onClick={() => toggleCompleted(item.id)}
                  className={`flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                    item.completed
                      ? "bg-green-500 border-green-500 text-white"
                      : "border-gray-300 hover:border-gray-400"
                  }`}
                >
                  {item.completed && <CheckCircle className="w-3 h-3" />}
                </button>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div className="flex items-center gap-3">
                      <h3
                        className={`font-medium ${
                          item.completed
                            ? "line-through text-gray-500"
                            : "text-gray-900"
                        }`}
                      >
                        {item.item}
                      </h3>
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${getPriorityColor(
                          item.priority
                        )}`}
                      >
                        {getPriorityIcon(item.priority)}
                        {item.priority}
                      </span>
                    </div>
                  </div>

                  {/* Page URL */}
                  <div className="flex items-center gap-2 mb-3">
                    <ExternalLink className="w-4 h-4 text-gray-400" />
                    <a
                      href={item.pageUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-700 text-sm font-medium break-all"
                    >
                      {item.pageUrl}
                    </a>
                  </div>

                  {/* Content to Update */}
                  <div className="bg-gray-50 rounded-md p-3 border border-gray-200">
                    <h4 className="text-sm font-medium text-gray-900 mb-1">
                      Action Required:
                    </h4>
                    <p
                      className={`text-sm ${
                        item.completed ? "text-gray-500" : "text-gray-700"
                      }`}
                    >
                      {item.contentToUpdate}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* CSV Import Modal */}
      {showImport && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Import SEO Audit CSV</h3>
            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-3">
                Upload a CSV file with columns: Item, Page URL, Priority,
                Content to Update
              </p>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-600 mb-3">
                  Click to upload or drag and drop
                </p>
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
