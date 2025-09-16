// pages/ManageWorkspaces/ManageWorkspaces.js
import React, { useState } from "react";
import { Building, Plus, Calendar, Users } from "lucide-react";
import useCurrentUser from "../../hooks/useCurrentUser";
import { useWorkspace } from "../../context/WorkspaceContext";
import { createWorkspace } from "../../data/workspaces"; // from earlier snippet

export default function ManageWorkspaces() {
  const { currentUser } = useCurrentUser();
  const { workspaces, setActiveWorkspaceId } = useWorkspace();

  const [newWorkspace, setNewWorkspace] = useState({ name: "", description: "" });
  const [saving, setSaving] = useState(false);

  const canCreate =
    ["owner", "admin"].includes(String(currentUser?.role || "").toLowerCase()) && !!currentUser?.uid;

  const formatDate = (val) => {
    if (!val) return "—";
    const d =
      typeof val?.toDate === "function"
        ? val.toDate()
        : typeof val?.seconds === "number"
        ? new Date(val.seconds * 1000)
        : new Date(val);
    return isNaN(d.getTime())
      ? "—"
      : d.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
  };

  const handleSubmit = async () => {
    if (!newWorkspace.name.trim()) {
      alert("Please enter a workspace name.");
      return;
    }
    if (!canCreate) {
      alert("Only an Owner or Admin can create a workspace.");
      return;
    }
    try {
      setSaving(true);
      const id = await createWorkspace(
        { name: newWorkspace.name.trim(), description: newWorkspace.description.trim() },
        currentUser
      );
      setActiveWorkspaceId(id);       // immediately switch to the new workspace
      setNewWorkspace({ name: "", description: "" });
    } catch (err) {
      console.error("Error creating workspace:", err);
      alert("Error creating workspace. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Manage Workspaces</h2>
        <p className="text-gray-600">Create and manage client workspaces</p>
      </div>

      {/* Add New Workspace */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Plus className="w-5 h-5" />
          Add New Workspace
        </h3>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Workspace Name *</label>
            <input
              type="text"
              value={newWorkspace.name}
              onChange={(e) => setNewWorkspace((p) => ({ ...p, name: e.target.value }))}
              placeholder="Enter workspace name"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
            <textarea
              rows={3}
              value={newWorkspace.description}
              onChange={(e) => setNewWorkspace((p) => ({ ...p, description: e.target.value }))}
              placeholder="Enter workspace description"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <button
            onClick={handleSubmit}
            disabled={!canCreate || saving}
            className={`bg-blue-600 text-white px-6 py-2 rounded-md transition-colors flex items-center gap-2 ${
              !canCreate || saving ? "opacity-60 cursor-not-allowed" : "hover:bg-blue-700"
            }`}
          >
            <Plus className="w-4 h-4" />
            {saving ? "Creating…" : "Create Workspace"}
          </button>

          {!canCreate && (
            <p className="text-xs text-gray-500">
              Only Owners and Admins can create workspaces.
            </p>
          )}
        </div>
      </div>

      {/* Existing Workspaces */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Building className="w-5 h-5" />
          Existing Workspaces
        </h3>

        {workspaces.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-gray-400 mb-4">
              <Building className="w-12 h-12 mx-auto" />
            </div>
            <h4 className="text-lg font-medium text-gray-900 mb-2">No workspaces created yet</h4>
            <p className="text-gray-600">Create your first workspace to get started.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {workspaces.map((ws) => (
              <div key={ws.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Building className="w-5 h-5 text-blue-600" />
                      <h4 className="font-semibold text-gray-900">{ws.name}</h4>
                    </div>
                    {ws.description && <p className="text-gray-600 text-sm mb-3">{ws.description}</p>}
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        <span>Created: {formatDate(ws.createdAt)}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        <span>{ws.membersCount ?? 0} members</span>
                      </div>
                    </div>
                  </div>
                  <div className="ml-4">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      Active
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
