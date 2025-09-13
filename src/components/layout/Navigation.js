import React, { useEffect, useRef, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { signOut } from "firebase/auth";
import { auth } from "../../lib/firebase";
import { useWorkspace } from "../../context/WorkspaceContext";
import { Menu, X } from "lucide-react";

export default function Navigation({ currentUser }) {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);        // avatar dropdown (desktop)
  const [mobileOpen, setMobileOpen] = useState(false); // mobile hamburger panel
  const menuRef = useRef(null);                   // avatar dropdown ref
  const mobileRef = useRef(null);                 // mobile panel ref

  const { workspaces, activeWorkspaceId, setActiveWorkspaceId, activeWorkspace, loadingWorkspaces } = useWorkspace();

  const name = currentUser?.name || currentUser?.displayName || "";
  const email = currentUser?.email || "";
  const rolesNorm = Array.isArray(currentUser?.roles)
    ? currentUser.roles.map((r) => String(r).toLowerCase())
    : currentUser?.role
      ? [String(currentUser.role).toLowerCase()]
      : [];
  const rolePrimary = rolesNorm[0] || "";
  const isAdmin = rolesNorm.includes("admin");

  const photoURL = currentUser?.photoURL;
  const initials =
    (name || email).trim().split(/\s+/).slice(0, 2).map((s) => s[0]?.toUpperCase()).join("") || "U";

  // Close menus when clicking outside
  useEffect(() => {
    const onClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setOpen(false);
      if (mobileRef.current && !mobileRef.current.contains(e.target)) setMobileOpen(false);
    };
    const onKey = (e) => {
      if (e.key === "Escape") {
        setOpen(false);
        setMobileOpen(false);
      }
    };
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  // Guard: pick first workspace if none selected
  useEffect(() => {
    if (!loadingWorkspaces && !activeWorkspaceId && workspaces?.length > 0) {
      setActiveWorkspaceId(workspaces[0].id);
    }
  }, [loadingWorkspaces, activeWorkspaceId, workspaces, setActiveWorkspaceId]);

  const linkBase = "px-3 py-2 rounded-md text-sm font-medium";
  const active = "bg-blue-100 text-blue-700";
  const inactive = "text-gray-600 hover:text-gray-900 hover:bg-gray-100";

  const NavLinks = ({ onNavigate }) => (
    <>
      <NavLink to="/dashboard" onClick={onNavigate} className={({ isActive }) => `${linkBase} ${isActive ? active : inactive}`}>Dashboard</NavLink>
      <NavLink to="/content"   onClick={onNavigate} className={({ isActive }) => `${linkBase} ${isActive ? active : inactive}`}>Content</NavLink>
      <NavLink to="/audits"    onClick={onNavigate} className={({ isActive }) => `${linkBase} ${isActive ? active : inactive}`}>Audits</NavLink>
      <NavLink to="/seo-reports" onClick={onNavigate} className={({ isActive }) => `${linkBase} ${isActive ? active : inactive}`}>Reports</NavLink>
    </>
  );

  const WorkspaceSelect = (props) => (
    <div className={props.className || ""}>
      <label htmlFor="workspaceSelect" className="sr-only">Select Workspace</label>
      <select
        id="workspaceSelect"
        value={activeWorkspaceId || ""}
        onChange={(e) => setActiveWorkspaceId(e.target.value)}
        disabled={loadingWorkspaces || (workspaces?.length ?? 0) === 0}
        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-60"
        title={activeWorkspace?.name || "Select workspace"}
      >
        {loadingWorkspaces && <option>Loading…</option>}
        {!loadingWorkspaces && workspaces?.length === 0 && <option>No workspaces</option>}
        {!loadingWorkspaces && workspaces?.map((ws) => (
          <option key={ws.id} value={ws.id}>{ws.name || ws.id}</option>
        ))}
      </select>
    </div>
  );

  return (
    <header className="bg-white border-b border-gray-200 w-full">
      {/* Top bar */}
      <div className="px-6 py-4 flex items-center justify-between">
        {/* Left: Logo + desktop nav */}
        <div className="flex items-center gap-6">
          {/* Mobile: hamburger */}
          <button
            className="md:hidden -ml-2 p-2 rounded-md hover:bg-gray-100 focus:outline-none"
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
            aria-expanded={mobileOpen}
            onClick={() => setMobileOpen((o) => !o)}
          >
            {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>

          <NavLink to="/dashboard" className="flex items-center gap-3">
            <img src="/assets/hs-square-icon.png" alt="Company Logo" className="h-10 w-auto object-contain" />
            <h1 className="text-xl font-bold text-gray-900">Content Approval Platform</h1>
          </NavLink>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-2 ml-2">
            <NavLinks onNavigate={() => {}} />
          </nav>
        </div>

        {/* Right: workspace selector + avatar menu (desktop) */}
        <div className="hidden md:flex items-center gap-4 relative" ref={menuRef}>
          <WorkspaceSelect className="min-w-[220px]" />

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
            <div
              role="menu"
              className="absolute right-0 top-[54px] w-60 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden z-50"
            >
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

        {/* Right (mobile): avatar circle (no dropdown—actions in panel) */}
        <div className="md:hidden">
          {photoURL ? (
            <img src={photoURL} alt={name || email} className="h-8 w-8 rounded-full object-cover border border-gray-200" />
          ) : (
            <div className="h-8 w-8 rounded-full bg-gray-200 text-gray-700 flex items-center justify-center font-semibold border border-gray-300">
              {initials}
            </div>
          )}
        </div>
      </div>

      {/* Mobile slide-down panel */}
      {mobileOpen && (
        <div
          ref={mobileRef}
          className="md:hidden border-t border-gray-200 bg-white px-4 pb-4 pt-3 shadow-sm"
        >
          <nav className="flex flex-col gap-1">
            <NavLinks onNavigate={() => setMobileOpen(false)} />
          </nav>

          <div className="mt-3">
            <WorkspaceSelect />
          </div>

          <div className="mt-3 rounded-lg border border-gray-200 overflow-hidden">
            {rolePrimary && (
              <div className="px-3 py-2 bg-gray-50 border-b border-gray-200">
                <span className="px-2 py-0.5 rounded-full text-xs font-semibold text-purple-700 bg-purple-100">
                  {rolePrimary.charAt(0).toUpperCase() + rolePrimary.slice(1)}
                </span>
              </div>
            )}
            <button
              onClick={() => { setMobileOpen(false); navigate("/profile"); }}
              className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50"
            >
              Profile
              <div className="text-xs text-gray-500 truncate">{email}</div>
            </button>
            {isAdmin && (
              <>
                <div className="my-1 border-t border-gray-200" />
                <button onClick={() => { setMobileOpen(false); navigate("/users"); }} className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50">Manage Users</button>
                <button onClick={() => { setMobileOpen(false); navigate("/workspaces"); }} className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50">Manage Workspaces</button>
              </>
            )}
            <div className="my-1 border-t border-gray-200" />
            <button
              onClick={async () => { setMobileOpen(false); await signOut(auth); navigate("/login"); }}
              className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
            >
              Sign Out
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
