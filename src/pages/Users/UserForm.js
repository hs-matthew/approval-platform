// src/pages/Users/UserForm.js
import React, { useMemo, useState } from "react";
import {
  UserPlus,
  Users,
  Shield,
  Edit,
  Mail,
  AlertCircle,
  CheckCircle,
  CheckSquare,
  Building2,
  Info,
} from "lucide-react";

/* =========================
   Searchable Chips Multi-Select (top-level, reusable)
   ========================= */
function WorkspaceMultiSelect({
  options = [],            // [{ id, name }]
  value = [],              // array of ids
  onChange = () => {},
  disabled = false,
  placeholder = "Search workspaces…",
  label = "Assign Workspaces",
  required = false,
  error = ""
}) {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const [activeIndex, setActiveIndex] = React.useState(-1);

  const idToName = React.useMemo(() => {
    const m = new Map();
    for (const o of options) m.set(o.id, o.name || o.id);
    return m;
  }, [options]);

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options.filter(o => !value.includes(o.id));
    return options.filter(
      o =>
        !value.includes(o.id) &&
        (o.name?.toLowerCase().includes(q) || o.id.toLowerCase().includes(q))
    );
  }, [options, value, query]);

  const add = (id) => {
    if (disabled) return;
    if (!value.includes(id)) onChange([...value, id]);
    setQuery("");
    setActiveIndex(-1);
  };

  const remove = (id) => {
    if (disabled) return;
    onChange(value.filter(v => v !== id));
  };

  const onKeyDown = (e) => {
    if (!open && (e.key === "ArrowDown" || e.key === "Enter")) {
      setOpen(true);
      return;
    }
    if (!open) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, filtered.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const pick = filtered[activeIndex] || filtered[0];
      if (pick) add(pick.id);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  };

  // Close when clicking outside
  const containerRef = React.useRef(null);
  React.useEffect(() => {
    const onClick = (e) => {
      if (!containerRef.current) return;
      if (!containerRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  return (
    <div className="relative" ref={containerRef}>
      <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
        <Building2 className="w-4 h-4" />
        {label}{required ? " *" : " (optional)"}
      </label>

      {/* Selected chips */}
      {value.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-2">
          {value.map((id) => (
            <span
              key={id}
              className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-xs bg-blue-50 text-blue-800 border border-blue-200"
            >
              {idToName.get(id) || id}
              <button
                type="button"
                onClick={() => remove(id)}
                disabled={disabled}
                className="hover:text-blue-900"
                aria-label={`Remove ${idToName.get(id) || id}`}
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Input */}
      <div
        className={`w-full flex items-center gap-2 px-3 py-2 border rounded-md focus-within:ring-2 ${
          error ? "border-red-300 ring-red-500" : "border-gray-300 ring-blue-500"
        } ${disabled ? "bg-gray-50 opacity-75" : ""}`}
        onClick={() => !disabled && setOpen(true)}
      >
        <input
          type="text"
          value={query}
          onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
          onKeyDown={onKeyDown}
          disabled={disabled}
          placeholder={placeholder}
          className="w-full outline-none bg-transparent text-sm"
        />
        <button
          type="button"
          onClick={() => !disabled && setOpen((o) => !o)}
          className="text-gray-600"
          aria-label="Toggle workspace list"
        >
          ▾
        </button>
      </div>
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}

      {/* Dropdown */}
      {open && (
        <div className="absolute z-10 mt-1 w-full max-h-60 overflow-auto rounded-md border border-gray-200 bg-white shadow-lg">
          {filtered.length === 0 ? (
            <div className="px-3 py-2 text-sm text-gray-500">No matches</div>
          ) : (
            <ul role="listbox" className="py-1">
              {filtered.map((o, idx) => (
                <li
                  key={o.id}
                  role="option"
                  aria-selected={idx === activeIndex}
                  onMouseEnter={() => setActiveIndex(idx)}
                  onMouseLeave={() => setActiveIndex(-1)}
                  onClick={() => add(o.id)}
                  className={`px-3 py-2 cursor-pointer text-sm ${
                    idx === activeIndex ? "bg-blue-50" : "hover:bg-gray-50"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-gray-900">{o.name || o.id}</span>
                    <span className="text-xs text-gray-500">{o.id}</span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

/* =========================
   Constants / helpers
   ========================= */
// NOTE: Owner is intentionally NOT selectable in the UI (DB-managed only).
const ROLES = ["admin", "staff", "client", "collaborator"];
const PERM_KEYS = ["content", "audits", "reports"];
const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);

/* =========================
   User Form
   ========================= */
const UserForm = ({
  users = [],
  workspaces = [],          // [{id, name}]
  onAddUser = () => {},
  onCancel = null,
  className = "",
  showTitle = true,
  initialValues = null,
  allowEmailEdit = false
}) => {

  // Helper to safely shape form data (create & edit)
  const normalize = (vals) => {
    const ws = Array.isArray(vals?.workspaceIds) ? vals.workspaceIds.map(String) : [];
    return {
      name: vals?.name ?? "",
      email: vals?.email ?? "",
      role: vals?.role ?? "collaborator", // if "owner" comes from DB, we’ll lock the selector
      workspaceIds: ws,
      collaboratorPerms: vals?.collaboratorPerms ?? { content: true, audits: false, reports: false },
    };
  };

  // Initialize form state (handles both create and edit)
  const [formData, setFormData] = useState(() =>
    initialValues ? normalize(initialValues) : normalize(null)
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});
  const [showSuccess, setShowSuccess] = useState(false);

  // Are we editing an existing user?
  const isEdit = Boolean(initialValues && (initialValues.id || initialValues.email));
  const roleNow = (formData.role || "").toLowerCase();
  const isOwner = roleNow === "owner";
  const hideWorkspaces = isOwner || roleNow === "admin"; // 👈 Hide for Admin (and Owner view)

  // Keep the form in sync if parent updates initialValues
  React.useEffect(() => {
    if (initialValues) setFormData(normalize(initialValues));
  }, [initialValues]);

  // quiet lints; list is passed in
  useMemo(() => workspaces, [workspaces]);

  const getRoleIcon = (role) => {
    switch (role) {
      case "owner": return <Shield className="w-4 h-4" />;
      case "admin": return <Shield className="w-4 h-4" />;
      case "staff": return <Users className="w-4 h-4" />;
      case "client": return <Users className="w-4 h-4" />;
      case "collaborator": return <Edit className="w-4 h-4" />;
      default: return <Users className="w-4 h-4" />;
    }
  };
  const getRoleDescription = (role) => {
    switch (role) {
      case "owner": return "All permissions, including account deletion. Managed in the database.";
      case "admin": return "Full administrative features across the app.";
      case "staff": return "Internal team access for assigned workspaces.";
      case "client": return "View/approve items in assigned workspaces.";
      case "collaborator": return "Granular permissions for assigned workspaces.";
      default: return "";
    }
  };

  const handleInput = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (validationErrors[field]) {
      const next = { ...validationErrors }; delete next[field]; setValidationErrors(next);
    }
    if (showSuccess) setShowSuccess(false);
  };

  const togglePerm = (key) => {
    setFormData((prev) => ({
      ...prev,
      collaboratorPerms: { ...prev.collaboratorPerms, [key]: !prev.collaboratorPerms[key] },
    }));
  };

  const validate = () => {
    const e = {};
    const name = (formData.name || "").trim();
    const email = (formData.email || "").trim().toLowerCase();

    if (!name) e.name = "Full name is required";
    else if (name.length < 2) e.name = "Name must be at least 2 characters";
    else if (name.length > 50) e.name = "Name must be < 50 characters";

    if (!email) {
      e.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      e.email = "Enter a valid email";
    } else {
      const shouldCheckDup =
        !isEdit ||
        (allowEmailEdit && email !== (initialValues?.email || "").toLowerCase());
      if (shouldCheckDup) {
        const duplicate = users.some(
          (u) => (u.email || "").toLowerCase() === email && u.id !== initialValues?.id
        );
        if (duplicate) e.email = "A user with this email already exists";
      }
    }

    // Role must be one of admin/staff/client/collaborator (Owner not selectable here, but allowed for viewing)
    const allowed = ["admin", "staff", "client", "collaborator", "owner"];
    if (!allowed.includes((formData.role || "").toLowerCase())) e.role = "Select a valid role";

    // Workspace requirement:
    // Admin may have 0; Staff/Client/Collaborator must have ≥1. Owner is DB-managed; no enforcement here.
    const requiresWorkspace = ["staff", "client", "collaborator"].includes(roleNow);
    if (requiresWorkspace && formData.workspaceIds.length === 0) {
      e.workspaceIds = "Select at least one workspace for this role.";
    }

    setValidationErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setIsSubmitting(true);
    try {
      const payload = {
        ...(initialValues || {}),
        name: formData.name.trim(),
        email: (
          isEdit && !allowEmailEdit
            ? (initialValues?.email || "")
            : formData.email
        ).trim().toLowerCase(),
        // If this user is Owner (from DB), keep role as "owner" but UI cannot change it.
        role: isOwner ? "owner" : formData.role,
        workspaceIds: (formData.workspaceIds || []).map(String),
        collaboratorPerms:
          (isOwner || roleNow !== "collaborator")
            ? null
            : formData.collaboratorPerms,
        createdAt: initialValues?.createdAt ?? new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isActive: initialValues?.isActive ?? true,
        lastLogin: initialValues?.lastLogin ?? null,
        createdBy: initialValues?.createdBy ?? "system",
        id: initialValues?.id ?? undefined,
      };

      await onAddUser(payload);

      if (isEdit) {
        setValidationErrors({});
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 2500);
      } else {
        setFormData(normalize(null));
        setValidationErrors({});
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 3000);
      }
    } catch (err) {
      console.error(err);
      setValidationErrors({ submit: "Failed to save user. Please try again." });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 p-6 ${className}`}>
      {showTitle && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-2 flex items-center gap-2">
            {isEdit ? <Edit className="w-5 h-5 text-blue-600" /> : <UserPlus className="w-5 h-5 text-blue-600" />}
            {isEdit ? "Edit User" : "Send Invite"}
          </h3>
          <p className="text-sm text-gray-600">
            {isEdit
              ? "Update user details, workspaces, and (if collaborator) permissions."
              : "Create a user, assign workspaces, and (if collaborator) set permissions."}
          </p>
        </div>
      )}

      {showSuccess && (
        <div className="mb-6 p-4 bg-green-50 border-2 border-green-300 rounded-lg flex items-center gap-3 shadow-md">
          <CheckCircle className="w-6 h-6 text-green-600" />
          <div>
            <h4 className="text-base font-semibold text-green-800">
              {isEdit ? "User updated!" : "User created!"}
            </h4>
            <p className="text-sm text-green-700">
              {isEdit ? "Changes have been saved." : "An invite record has been created for this email."}
            </p>
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
            } ${isEdit && !allowEmailEdit ? "bg-gray-50 cursor-not-allowed" : ""}`}
            disabled={isEdit && !allowEmailEdit || isSubmitting}
            placeholder="user@company.com"
          />
          {isEdit && !allowEmailEdit && (
            <p className="mt-1 text-xs text-gray-500">
              Email is locked after account creation to prevent duplicates. Contact an admin if it must change.
            </p>
          )}
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
            } ${isOwner ? "bg-gray-50 cursor-not-allowed" : ""}`}
            disabled={isSubmitting || isOwner}
          >
            {/* If role is Owner (from DB), show it but disable changing */}
            {isOwner ? (
              <option value="owner">Owner (DB-managed)</option>
            ) : (
              ROLES.map((r) => (
                <option key={r} value={r}>{cap(r)}</option>
              ))
            )}
          </select>
          <div className="mt-2 p-3 bg-gray-50 rounded-md border border-gray-200">
            <div className="flex items-center gap-2 mb-1">
              {getRoleIcon(formData.role)}
              <span className="text-sm font-medium text-gray-900">{cap(formData.role)}</span>
            </div>
            <p className="text-xs text-gray-600">{getRoleDescription(formData.role)}</p>
            {isOwner && (
              <p className="mt-2 text-xs text-gray-500 flex items-center gap-1">
                <Info className="w-3 h-3" />
                Owner is assigned manually in the database and cannot be changed here.
              </p>
            )}
          </div>
          {validationErrors.role && <p className="mt-1 text-sm text-red-600">{validationErrors.role}</p>}
        </div>

        {/* Workspaces (searchable multi-select with chips) */}
        {!hideWorkspaces && (
          <div>
            <WorkspaceMultiSelect
              options={workspaces}
              value={formData.workspaceIds}
              onChange={(ids) => handleInput("workspaceIds", ids)}
              disabled={isSubmitting}
              label="Assign Workspaces"
              required={["staff", "client", "collaborator"].includes(roleNow)}
              error={validationErrors.workspaceIds || ""}
              placeholder="Type to search…"
            />
            <p className="text-xs text-gray-500 mt-2">
              Start typing to filter. Press Enter to add the highlighted item. Click × on a chip to remove.
            </p>
          </div>
        )}

        {/* Collaborator permissions (checkboxes) */}
        {roleNow === "collaborator" && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
              <CheckSquare className="w-4 h-4" /> Permissions (for selected workspaces)
            </label>
            <div className="flex flex-wrap gap-3">
              {PERM_KEYS.map((key) => (
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
            <p className="text-xs text-gray-500 mt-2">These apply to each assigned workspace.</p>
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
            {isSubmitting ? (isEdit ? "Saving…" : "Creating…") : (isEdit ? "Save Changes" : "Create User")}
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
            {Object.keys(validationErrors).length > 0 && (
              <span className="text-red-600 mr-2">{Object.keys(validationErrors).length} error(s)</span>
            )}
            <span>* Required fields</span>
          </div>
        </div>
      </form>

      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h4 className="text-sm font-medium text-blue-900 mb-2 flex items-center gap-2">
          <Mail className="w-4 h-4" /> Next Steps
        </h4>
        <ul className="text-xs text-blue-800 space-y-1">
          {isEdit ? (
            <>
              <li>• Changes take effect immediately</li>
              <li>• Workspace assignments and collaborator permissions were updated</li>
            </>
          ) : (
            <>
              <li>• An invite record will be created for this email</li>
              <li>• On first login, the account will be linked to the selected workspaces</li>
            </>
          )}
          <li>• Collaborator permissions apply per assigned workspace</li>
        </ul>
      </div>
    </div>
  );
};

export default UserForm;
