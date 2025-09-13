// src/pages/Users/Users.js
import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useFirestore } from "../../hooks/useFirestore";
import { db } from "../../lib/firebase";
import { doc, deleteDoc } from "firebase/firestore";
import { Plus, Pencil, Trash2, Search } from "lucide-react";

/* ---------- helpers ---------- */
const cap = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : "");

// Extract workspace ids regardless of shape
const getWorkspaceIds = (u) => {
  if (Array.isArray(u?.workspaceIds)) return u.workspaceIds;
  if (u?.memberships && typeof u.memberships === "object") return Object.keys(u.memberships);
  return [];
};

// Map ids -> display names (fallback to id)
const getWorkspaceNames = (u, allWorkspaces = []) => {
  const byId = new Map(allWorkspaces.map((w) => [w.id, w.name || w.id]));
  return getWorkspaceIds(u).map((id) => byId.get(id) ?? id);
};

// Render a date safely (supports Firestore Timestamp, ISO, Date); not required, but handy
const fmtDate = (d) => {
  const asDate =
    d && typeof d?.toDate === "function" ? d.toDate()
    : typeof d === "string" ? new Date(d)
    : d instanceof Date ? d
    : null;
  return asDate ? asDate.toLocaleString() : "—";
};

function RoleBadge({ role }) {
  const r = (role || "").toLowerCase();
  const map = {
    owner: "bg-slate-100 text-slate-800",
    admin: "bg-purple-100 text-purple-700",
    staff: "bg-blue-100 text-blue-700",
    client: "bg-green-100 text-green-700",
    collaborator: "bg-amber-100 text-amber-800",
  };
  return (
    <span className={`px-2 py-0.5 rounded text-xs font-semibold ${map[r] || "bg-gray-100 text-gray-700"}`}>
      {r ? r.charAt(0).toUpperCase() + r.slice(1) : "—"}
    </span>
  );
}

export default function Users() {
  const navigate = useNavigate();

  // Load users and workspaces so we can show workspace names
  const { data: users = [], loading: loadingUsers } = useFirestore("users");
  const { data: workspaces = [], loading: loadingWorkspaces } = useFirestore("workspaces");

  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return users;

    return users.filter((u) => {
      const name = (u.name || "").toLowerCase();
      const email = (u.email || "").toLowerCase();
      const role = (u.role || "").toLowerCase();
      const wsNames = getWorkspaceNames(u, workspaces).join(" ").toLowerCase();
      const wsIds = getWorkspaceIds(u).join(" ").toLowerCase();

      return (
        name.includes(needle) ||
        email.includes(needle) ||
        role.includes(needle) ||
        wsNames.includes(needle) ||
        wsIds.includes(needle)
      );
    });
  }, [users, workspaces, q]);

  async function handleDelete(id, email) {
    if (!id) {
      alert("Missing user id.");
      return;
    }
    if (!window.confirm(`Delete user "${email || id}"?`)) return;
    try {
      await deleteDoc(doc(db, "users", id));
      // NOTE: This removes the user doc only. Handle related cleanup (memberships/auth) elsewhere if needed.
    } catch (e) {
      console.error(e);
      alert("Failed to delete. Check console.");
    }
  }

  const loading = loadingUsers || loadingWorkspaces;

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-semibold">Users</h1>
        <button
          className="inline-flex items-center gap-2 px-3 py-2 rounded-md bg-blue-600 text-white text-sm hover:bg-blue-700"
          onClick={() => navigate("/users/new")}
        >
          <Plus className="w-4 h-4" /> Add User
        </button>
      </div>

      <div className="flex items-center gap-3 mb-4">
        <div className="relative w-full max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search name, email, role, workspace…"
            className="w-full pl-9 pr-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <span className="text-xs text-gray-500">{filtered.length} user(s)</span>
      </div>

      <div className="bg-white border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr className="text-left">
              <th className="px-4 py-2">Name</th>
              <th className="px-4 py-2">Email</th>
              <th className="px-4 py-2">Role</th>
              <th className="px-4 py-2">Workspaces</th>
              <th className="px-4 py-2 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-gray-500">Loading…</td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-gray-500">No users found.</td>
              </tr>
            ) : (
              filtered.map((u) => {
                const wsNames = getWorkspaceNames(u, workspaces); // array of strings
                return (
                  <tr key={u.id || u.email} className="border-b last:border-none">
                    <td className="px-4 py-2">
                      <div className="font-medium text-gray-900">{u.name || "—"}</div>
                      <div className="text-xs text-gray-500">{u.id || ""}</div>
                    </td>
                    <td className="px-4 py-2">{u.email || "—"}</td>
                    <td className="px-4 py-2"><RoleBadge role={u.role} /></td>
                    <td className="px-4 py-2">
                      {wsNames.length === 0 ? (
                        <span className="text-gray-500">—</span>
                      ) : (
                        <div className="flex flex-wrap gap-1">
                          {wsNames.map((name, idx) => (
                            <span
                              key={`${u.id || u.email}-ws-${idx}`}
                              className="px-2 py-0.5 rounded bg-gray-100 text-gray-700 text-xs"
                            >
                              {name}
                            </span>
                          ))}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-2">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          className="p-2 rounded hover:bg-gray-100"
                          title="Edit"
                          onClick={() => navigate(`/users/${u.id || u.email}/edit`)}
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          className="p-2 rounded hover:bg-red-50 text-red-600"
                          title="Delete"
                          onClick={() => handleDelete(u.id || u.email, u.email)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
