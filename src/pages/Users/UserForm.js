// src/pages/Users/UserForm.js
import React, { useMemo, useState } from "react";
import { UserPlus, Users, Shield, Edit, Mail, AlertCircle, CheckCircle, Building2, CheckSquare } from "lucide-react";

const ROLES = ["owner", "admin", "staff", "client", "collaborator"]; // global roles
const PERM_KEYS = ["content", "audits", "reports"];                  // per-workspace, only for collaborators

const UserForm = ({
  users = [],
  workspaces = [],          // [{id, name}]
  onAddUser = () => {},
  onCancel = null,
  className = "",
  showTitle = true,
  initialValues = null
}) => {
  const [formData, setFormData] = useState(() =>
    initialValues ?? {
      name: "",
      email: "",
      role: "collaborator",   // default to collaborator
      workspaceIds: [],       // MULTI-select of workspaces
      // per-workspace permission template for collaborators
      collaboratorPerms: { content: true, audits: false, reports: false }
    }
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});
  const [showSuccess, setShowSuccess] = useState(false);

  const workspacesById = useMemo(() => {
    const m = {};
    (workspaces || []).forEach(w => { m[w.id] = w; });
    return m;
  }, [workspaces]);

  // helpers
  const handleInput = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (validationErrors[field]) {
      const next = { ...validationErrors }; delete next[field]; setValidationErrors(next);
    }
    if (showSuccess) setShowSuccess(false);
  };

  const toggleWorkspace = (wid) => {
    setFormData(prev => {
      const set = new Set(prev.workspaceIds);
      set.has(wid) ? set.delete(wid) : set.add(wid);
      return { ...prev, workspaceIds: Array.from(set) };
    });
  };

  const togglePerm = (key) => {
    setFormData(prev => ({
      ...prev,
      collaboratorPerms: { ...prev.collaboratorPerms, [key]: !prev.collaboratorPerms[key] }
    }));
  };

  // validation
  const validate = () => {
    const e = {};
    const name = (formData.name || "").trim();
    const email = (formData.email || "").trim().toLowerCase();

    if (!name) e.name = "Full name is required";
    else if (name.length < 2) e.name = "Name must be at least 2 characters";
    else if (name.length > 50) e.name = "Name must be < 50 characters";

    if (!email) e.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email = "Enter a valid email";
    else if (users.find(u => (u.email || "").toLowerCase() === email)) e.email = "A user with this email already exists";

    if (!ROLES.includes(formData.role)) e.role = "Select a valid role";

    // must pick at least one workspace for all roles except owner/admin (your choice)
    const requiresWorkspace = !["owner", "admin"].includes(formData.role);
    if (requiresWorkspace && formData.workspaceIds.length === 0) {
      e.workspaceIds = "Select at least one workspace";
    }

    setValidationErrors(e);
    return Object.keys(e).length === 0;
  };

  // submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      const payload = {
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        role: formData.role,                 // global role
        workspaceIds: formData.workspaceIds, // array (can be empty for owner/admin)
        // send collaborator perms only if applicable
        collaboratorPerms: formData.role === "collaborator" ? formData.collaboratorPerms : null,
        createdAt: new Date().toISOString(),
        isActive: true,
        lastLogin: null,
        createdBy: "system"
      };

      await onAddUser(payload);

      // reset
      setFormData({
        name: "",
        email: "",
        role: "collaborator",
        workspaceIds: [],
        collaboratorPerms: { content: true, audits: false, reports: false }
      });
      setValidationErrors({});
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (err) {
      console.error(err);
      setValidationErrors({ submit: "Failed to create user. Please try again." });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 p-6 ${className}`}>
      {showTitle && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-2 flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-blue-600" />
            Add New User
          </h3>
          <p className="text-sm text-gray-600">Create a user, assign workspaces, and set permissions (for collaborators).</p>
        </div>
      )}

      {showSuccess && (
        <div className="mb-6 p-4 bg-green-50 border-2 border-green-300 rounded-lg flex items-center gap-3 shadow-md">
          <CheckCircle className="w-6 h-6 text-green-600" />
          <div>
            <h4 className="text-base font-semibold text-green-800">User created!</h4>
            <p className="text-sm text-green-700">An invite record has been created for this email.</p>
          </div>
          <button onClick={() => setShowSuccess(false)} className="ml-auto text-green-700 p-1">✕</button>
        </div>
      )}

      {validationErrors.submit && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-600" />
          <div>
            <h4 className="text-sm font-medium text-red-800">Error</h4>
            <p className="text-sm text-red-600">{validationErrors.submit}</p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Full Name *</label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => handleInput("name", e.target.value)}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
              validationErrors.name ? "border-red-300 focus:ring-red-500" : "border-gray-300 focus:ring-blue-500"
            }`}
            maxLength={50}
            disabled={isSubmitting}
            placeholder="Jane Smith"
          />
          {validationErrors.name && <p className="mt-1 text-sm text-red-600">{validationErrors.name}</p>}
        </div>

        {/* Email */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Email Address *</label>
          <input
            type="email"
            value={formData.email}
            onChange={(e) => handleInput("email", e.target.value)}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
              validationErrors.email ? "border-red-300 focus:ring-red-500" : "border-gray-300 focus:ring-blue-500"
            }`}
            disabled={isSubmitting}
            placeholder="user@company.com"
          />
          {validationErrors.email && <p className="mt-1 text-sm text-red-600">{validationErrors.email}</p>}
        </div>

        {/* Global Role */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">User Role *</label>
          <select
            value={formData.role}
            onChange={(e) => handleInput("role", e.target.value)}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
              validationErrors.role ? "border-red-300 focus:ring-red-500" : "border-gray-300 focus:ring-blue-500"
            }`}
            disabled={isSubmitting}
          >
            {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
          <p className="text-xs text-gray-500 mt-2">
            <strong>owner</strong> (all permissions, incl. account deletion) · <strong>admin</strong> (all app features) ·{" "}
            <strong>staff</strong> (internal team) · <strong>client</strong> (approve/view) ·{" "}
            <strong>collaborator</strong> (granular per-workspace).
          </p>
        </div>

        {/* Workspace selection (multi) */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
            <Building2 className="w-4 h-4" /> Assign Workspaces{["owner","admin"].includes(formData.role) ? " (optional)" : " *"}
          </label>

          {workspaces.length === 0 ? (
            <p className="text-sm text-gray-500">No workspaces found.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {workspaces.map(ws => {
                const checked = formData.workspaceIds.includes(ws.id);
                return (
                  <label key={ws.id} className={`flex items-center gap-2 border rounded-md px-3 py-2 cursor-pointer ${checked ? "bg-blue-50 border-blue-300" : "bg-white border-gray-300"}`}>
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleWorkspace(ws.id)}
                      disabled={isSubmitting}
                    />
                    <span className="text-sm">{ws.name || ws.id}</span>
                  </label>
                );
              })}
            </div>
          )}

          {validationErrors.workspaceIds && <p className="mt-1 text-sm text-red-600">{validationErrors.workspaceIds}</p>}
        </div>

        {/* Collaborator permissions (only shows if role === collaborator) */}
        {formData.role === "collaborator" && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
              <CheckSquare className="w-4 h-4" /> Permissions (for selected workspaces)
            </label>
            <div className="flex flex-wrap gap-3">
              {PERM_KEYS.map(key => (
                <label key={key} className="inline-flex items-center gap-2 border rounded px-3 py-1.5">
                  <input
                    type="checkbox"
                    checked={!!formData.collaboratorPerms[key]}
                    onChange={() => togglePerm(key)}
                    disabled={isSubmitting}
                  />
                  <span className="text-sm capitalize">{key}</span>
                </label>
              ))}
            </div>
            <p className="text-xs text-gray-500 mt-2">
              These apply to each assigned workspace for this collaborator.
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-3 pt-4 border-t border-gray-200">
          <button
            type="submit"
            disabled={isSubmitting}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-md text-white font-medium transition-all ${
              isSubmitting ? "bg-gray-400" : "bg-blue-600 hover:bg-blue-700"
            }`}
          >
            <UserPlus className="w-4 h-4" />
            {isSubmitting ? "Creating…" : "Create User"}
          </button>
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              disabled={isSubmitting}
              className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 font-medium"
            >
              Cancel
            </button>
          )}
          <div className="ml-auto text-xs text-gray-500">
            {Object.keys(validationErrors).length > 0 && <span className="text-red-600 mr-2">{Object.keys(validationErrors).length} error(s)</span>}
            <span>* Required fields</span>
          </div>
        </div>
      </form>

      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h4 className="text-sm font-medium text-blue-900 mb-2 flex items-center gap-2">
          <Mail className="w-4 h-4" /> Next Steps
        </h4>
        <ul className="text-xs text-blue-800 space-y-1">
          <li>• An invite record will be created for the email</li>
          <li>• On first login, the account will be linked to the selected workspaces</li>
          <li>• Collaborator permissions apply per assigned workspace</li>
        </ul>
      </div>
    </div>
  );
};

export default UserForm;
