import React, { useEffect, useRef, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { signOut } from "firebase/auth";
import { auth } from "../../lib/firebase";
import { useWorkspace } from "../../context/WorkspaceContext";

export default function Navigation({ currentUser }) {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);

  const { workspaces, activeWorkspaceId, setActiveWorkspaceId, activeWorkspace } = useWorkspace();

  const name = currentUser?.name || currentUser?.displayName || "";
  const email = currentUser?.email || "";
  const rolesNorm = Array.isArray(currentUser?.roles)
    ? currentUser.roles.map((r) => String(r).toLowerCase())
    : currentUser?.role ? [String(currentUser.role).toLowerCase()] : [];
  const rolePrimary = rolesNorm[0] || "";
  const isAdmin = rolesNorm.includes("admin");

  const photoURL = currentUser?.photoURL;
  const initials =
    (name || email).trim().split(/\s+/).slice(0, 2).map((s) => s[0]?.toUpperCase()).join("") || "U";

  useEffect(() => {
    const onClick = (e) => { if (menuRef.current && !menuRef.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const linkBase = "px-3 py-2 rounded-md text-sm font-medium";
  const active = "bg-blue-100 text-blue-700";
  const inactive = "text-gray-600 hover:text-gray-900 hover:bg-gray-100";

  return (
    <header className="bg-white border-b border-gray-200 w-full">
      <div className="px-6 py-4 flex items-center justify-between">
        {/* Left: Logo + nav */}
        <div className="flex items-center gap-6">
          <NavLink to="/dashboard" className="flex items-center gap-3">
            <img src="/assets/hs-square-icon.png" alt="Company Logo" className="h-10 w-auto object-contain" />
            <h1 className="text-xl font-bold text-gray-900">Content Approval Platform</h1>
          </NavLink>

          <nav className="flex items-center gap-2 ml-2">
            <NavLink to="/dashboard" className={({ isActive }) => `${linkBase} ${isActive ? active : inactive}`}>Dashboard</NavLink>
            <NavLink to="/content"   className={({ isActive }) => `${linkBase} ${isActive ? active : inactive}`}>Content</NavLink>
            <NavLink to="/audits"    className={({ isActive }) => `${linkBase} ${isActive ? active : inactive}`}>Audits</NavLink>
            <NavLink to="/seo-reports" className={({ isActive }) => `${linkBase} ${isActive ? active : inactive}`}>Reports</NavLink>
          </nav>
        </div>

        {/* Right: Workspace selector + avatar menu */}
        <div className="flex items-center gap-4" ref={menuRef}>
          {/* Workspace dropdown (right-justified, before avatar) */}
          <div className="min-w-[220px]">
            <label htmlFor="workspaceSelect" className="sr-only">Select Workspace</label>
            <select
              id="workspaceSelect"
              value={activeWorkspaceId}
              onChange={(e) => setActiveWorkspaceId(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              title={activeWorkspace?.name || "All Workspaces"}
            >
              <option value="all">All Workspaces</option>
              {workspaces.map((ws) => (
                <option key={ws.id} value={ws.id}>{ws.name}</option>
              ))}
            </select>
          </div>

          {/* Avatar dropdown */}
          <button
            onClick={() => setOpen((o) => !o)}
            aria-haspopup="menu"
            aria-expanded={open}
            className="flex items-center gap-2 focus:outline-none"
            title={email}
          >
            {photoURL ? (
              <img src={photoURL} alt={name || email} className="h-9 w-9 rounded-full object-cover border border-gray-200" />
            ) : (
              <div className="h-9 w-9 rounded-full bg-gray-200 text-gray-700 flex items-center justify-center font-semibold border border-gray-300">
                {initials}
              </div>
            )}
          </button>

          {open && (
            <div role="menu" className="absolute right-6 top-[72px] w-60 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden z-50">
              {rolePrimary && (
                <div className="px-3 py-2 bg-gray-50 border-b border-gray-200">
                  <span className="px-2 py-0.5 rounded-full text-xs font-semibold text-purple-700 bg-purple-100">
                    {rolePrimary.charAt(0).toUpperCase() + rolePrimary.slice(1)}
                  </span>
                </div>
              )}
              <button onClick={() => { setOpen(false); navigate("/profile"); }} className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100">
                Profile
                <div className="text-xs text-gray-500 truncate">{email}</div>
              </button>
              {isAdmin && (
                <>
                  <div className="my-1 border-t border-gray-200" />
                  <button onClick={() => { setOpen(false); navigate("/users"); }} className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100">Manage Users</button>
                  <button onClick={() => { setOpen(false); navigate("/workspaces"); }} className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100">Manage Workspaces</button>
                </>
              )}
              <div className="my-1 border-t border-gray-200" />
              <button
                onClick={async () => { setOpen(false); await signOut(auth); navigate("/login"); }}
                className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
              >
                Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
