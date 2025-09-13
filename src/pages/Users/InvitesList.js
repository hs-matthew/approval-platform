// src/pages/Invites/InvitesList.js
import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useFirestore } from "../../hooks/useFirestore";
import { db } from "../../lib/firebase";
import {
  doc,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";
import { Search, Plus, MailQuestion, RefreshCw, XCircle } from "lucide-react";

/* ---------- helpers ---------- */
const cap = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : "");

const fmtDate = (d) => {
  const asDate =
    d && typeof d?.toDate === "function" ? d.toDate()
    : typeof d === "string" ? new Date(d)
    : d instanceof Date ? d
    : null;
  return asDate ? asDate.toLocaleString() : "—";
};

// Extract workspace ids regardless of shape
const getWorkspaceIds = (inv) => {
  if (Array.isArray(inv?.workspaceIds)) return inv.workspaceIds;
  if (inv?.memberships && typeof inv.memberships === "object") return Object.keys(inv.memberships);
  return [];
};

// Map ids -> display names (fallback to id)
const getWorkspaceNames = (inv, allWorkspaces = []) => {
  const byId = new Map(allWorkspaces.map((w) => [w.id, w.name || w.id]));
  return getWorkspaceIds(inv).map((id) => byId.get(id) ?? id);
};

function StatusBadge({ status }) {
  const s = (status || "pending").toLowerCase();
  const map = {
    pending: "bg-amber-100 text-amber-800",
    accepted: "bg-green-100 text-green-700",
    cancelled: "bg-gray-100 text-gray-700",
    expired: "bg-red-100 text-red-700",
    failed: "bg-rose-100 text-rose-700",
  };
  return (
    <span className={`px-2 py-0.5 rounded text-xs font-semibold ${map[s] || "bg-gray-100 text-gray-700"}`}>
      {cap(s)}
    </span>
  );
}

export default function InvitesList() {
  const navigate = useNavigate();

  // Collections
  const { data: invites = [], loading: loadingInvites, reload: reloadInvites } = useFirestore("invites");
  const { data: workspaces = [], loading: loadingWorkspaces } = useFirestore("workspaces");

  const [q, setQ] = useState("");
  const [showPendingOnly, setShowPendingOnly] = useState(true);
  const loading = loadingInvites || loadingWorkspaces;

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    let list = invites;
    if (showPendingOnly) list = list.filter((i) => (i.status || "pending").toLowerCase() === "pending");

    if (!needle) return list;

    return list.filter((i) => {
      const email = (i.email || "").toLowerCase();
      const name = (i.name || "").toLowerCase();
      const role = (i.role || "").toLowerCase();
      const status = (i.status || "pending").toLowerCase();
      const wsNames = getWorkspaceNames(i, workspaces).join(" ").toLowerCase();
      const wsIds = getWorkspaceIds(i).join(" ").toLowerCase();
      return (
        email.includes(needle) ||
        name.includes(needle) ||
        role.includes(needle) ||
        status.includes(needle) ||
        wsNames.includes(needle) ||
        wsIds.includes(needle)
      );
    });
  }, [invites, workspaces, q, showPendingOnly]);

  async function handleResend(inv) {
    try {
      // Optional: call your resend API to send the email again
      // Adjust path/body to your backend. If you don't have one, comment fetch out and rely on Firestore stamp.
      await fetch("/api/invites/resend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: inv.id }),
      }).catch(() => {}); // swallow if you haven't wired the API yet

      // Mark re-send locally in Firestore
      const ref = doc(db, "invites", inv.id);
      await updateDoc(ref, {
        status: "pending",
        resentAt: serverTimestamp(),
        resendCount: (inv.resendCount || 0) + 1,
      });
      await reloadInvites();
      alert(`Resent invite to ${inv.email}`);
    } catch (e) {
      console.error(e);
      alert("Failed to resend invite. Check console.");
    }
  }

  async function handleCancel(inv) {
    if (!window.confirm(`Cancel invite for "${inv.email}"?`)) return;
    try {
      const ref = doc(db, "invites", inv.id);
      await updateDoc(ref, {
        status: "cancelled",
        cancelledAt: serverTimestamp(),
      });
      await reloadInvites();
    } catch (e) {
      console.error(e);
      alert("Failed to cancel invite. Check console.");
    }
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-semibold inline-flex items-center gap-2">
           <MailQuestion className="w-5 h-5" />
           Invites
          </h1>
          <button
            className="text-sm text-blue-600 hover:underline"
            onClick={() => navigate("/users")}
          >
            ← Back to Users
          </button>
        </div>
        <button
          className="inline-flex items-center gap-2 px-3 py-2 rounded-md bg-blue-600 text-white text-sm hover:bg-blue-700"
          onClick={() => navigate("/users/new")}
        >
          <Plus className="w-4 h-4" /> Add User
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="relative w-full max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search email, name, role, workspace…"
            className="w-full pl-9 pr-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={showPendingOnly}
            onChange={(e) => setShowPendingOnly(e.target.checked)}
          />
          Show pending only
        </label>
        <span className="text-xs text-gray-500">{filtered.length} invite(s)</span>
        <button
          className="ml-auto inline-flex items-center gap-2 px-3 py-2 rounded-md border text-sm hover:bg-gray-50"
          onClick={() => reloadInvites()}
          title="Reload"
        >
          <RefreshCw className="w-4 h-4" />
          Reload
        </button>
      </div>

      <div className="bg-white border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr className="text-left">
              <th className="px-4 py-2">Email</th>
              <th className="px-4 py-2">Name</th>
              <th className="px-4 py-2">Role</th>
              <th className="px-4 py-2">Workspaces</th>
              <th className="px-4 py-2">Status</th>
              <th className="px-4 py-2">Sent</th>
              <th className="px-4 py-2">Expires</th>
              <th className="px-4 py-2 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={8} className="px-4 py-6 text-center text-gray-500">Loading…</td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-6 text-center text-gray-500">No invites found.</td>
              </tr>
            ) : (
              filtered.map((inv) => {
                const wsNames = getWorkspaceNames(inv, workspaces);
                const status = (inv.status || "pending").toLowerCase();

                return (
                  <tr key={inv.id || inv.email} className="border-b last:border-none">
                    <td className="px-4 py-2">
                      <div className="font-medium text-gray-900">{inv.email || "—"}</div>
                      <div className="text-xs text-gray-500">{inv.id || ""}</div>
                    </td>
                    <td className="px-4 py-2">{inv.name || "—"}</td>
                    <td className="px-4 py-2">{cap(inv.role) || "—"}</td>
                    <td className="px-4 py-2">
                      {wsNames.length === 0 ? (
                        <span className="text-gray-500">—</span>
                      ) : (
                        <div className="flex flex-wrap gap-1">
                          {wsNames.map((name, idx) => (
                            <span key={`${inv.id || inv.email}-ws-${idx}`} className="px-2 py-0.5 rounded bg-gray-100 text-gray-700 text-xs">
                              {name}
                            </span>
                          ))}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-2">
                      <StatusBadge status={status} />
                    </td>
                    <td className="px-4 py-2">{fmtDate(inv.sentAt || inv.createdAt)}</td>
                    <td className="px-4 py-2">{fmtDate(inv.expiresAt)}</td>
                    <td className="px-4 py-2">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          className="p-2 rounded hover:bg-gray-100"
                          title="Resend"
                          disabled={status !== "pending"}
                          onClick={() => handleResend(inv)}
                        >
                          <RefreshCw className="w-4 h-4" />
                        </button>
                        <button
                          className="p-2 rounded hover:bg-red-50 text-red-600"
                          title="Cancel"
                          disabled={status !== "pending"}
                          onClick={() => handleCancel(inv)}
                        >
                          <XCircle className="w-4 h-4" />
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
