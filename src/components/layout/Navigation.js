// src/components/layout/Navigation.js
import React, { useEffect, useRef, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { signOut } from "firebase/auth";
import { auth } from "../../lib/firebase";

export default function Navigation({ currentUser }) {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);

  // Close on outside click / Esc
  useEffect(() => {
    const onClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setOpen(false);
    };
    const onKey = (e) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  const name = currentUser?.name || currentUser?.displayName || "";
  const email = currentUser?.email || "admin@company.com"; // fallback to match mock
  const roleRaw =
    currentUser?.role ||
    (Array.isArray(currentUser?.roles) ? currentUser.roles[0] : "") ||
    "admin";
  const role =
    typeof roleRaw === "string" ? roleRaw.toLowerCase() : String(roleRaw).toLowerCase();
  const isAdmin = role === "admin";

  // Avatar / initials
  const initials =
    (name || email)
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((s) => s[0]?.toUpperCase())
      .join("") || "U";

  // Link styles
  const linkBase = "px-3 py-2 rounded-md text-sm font-medium";
  const linkActive = "bg-blue-100 text-blue-700";
  const linkInactive = "text-gray-600 hover:text-gray-900 hover:bg-gray-100";

  return (
    <header className="bg-white border-b border-gray-200 w-full">
      <div className="px-6 py-4 flex items-center justify-between">
        {/* Left: logo + nav */}
        <div className="flex items-center gap-6">
          <NavLink to="/dashboard" className="flex items-center gap-3">
            <img
              src="/assets/hs-square-icon.png"
              alt="Company Logo"
              className="h-10 w-auto object-contain"
            />
            <h1 className="text-xl font-bold text-gray-900">
              Content Approval Platform
            </h1>
          </NavLink>

        <nav className="flex items-center gap-2 ml-2">
            <NavLink to="/dashboard" end className={({ isActive }) => `${linkBase} ${isActive ? linkActive : linkInactive}`}>Dashboard</NavLink>
            <NavLink to="/content" className={({ isActive }) => `${linkBase} ${isActive ? linkActive : linkInactive}`}>Content</NavLink>
            <NavLink to="/audits" className={({ isActive }) => `${linkBase} ${isActive ? linkActive : linkInactive}`}>Audits</NavLink>
            <NavLink to="/seo-reports" className={({ isActive }) => `${linkBase} ${isActive ? linkActive : linkInactive}`}>SEO Reports</NavLink>
          </nav>
        </div>

        {/* Right: avatar + dropdown */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setOpen((o) => !o)}
            aria-haspopup="menu"
            aria-expanded={open}
            className="flex items-center gap-2 focus:outline-none"
            title={email}
          >
            {currentUser?.photoURL ? (
              <img
                src={currentUser.photoURL}
                alt={name || email}
                className="h-9 w-9 rounded-full object-cover border border-gray-200"
              />
            ) : (
              <div className="h-9 w-9 rounded-full bg-gray-200 text-gray-700 flex items-center justify-center font-semibold border border-gray-300">
                {initials}
              </div>
            )}
          </button>

          {open && (
            <div
              role="menu"
              className="absolute right-0 top-full mt-2 w-72 bg-white rounded-2xl shadow-xl ring-1 ring-black/5 z-[1000] overflow-hidden"
            >
              {/* Role pill header */}
              <div className="px-4 py-3 border-b border-gray-200">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold text-purple-700 bg-purple-100">
                  {role.charAt(0).toUpperCase() + role.slice(1)}
                </span>
              </div>

              {/* Profile row with email subtext */}
              <button
                onClick={() => {
                  setOpen(false);
                  navigate("/profile");
                }}
                className="w-full text-left px-4 py-3.5 hover:bg-gray-50"
                role="menuitem"
              >
                <div className="text-[15px] font-semibold text-gray-900">Profile</div>
                <div className="text-sm text-gray-500">{email}</div>
              </button>

              {/* Divider */}
              <div className="h-px bg-gray-200"></div>

              {/* Admin-only */}
              {isAdmin && (
                <>
                  <button
                    onClick={() => {
                      setOpen(false);
                      navigate("/users");
                    }}
                    className="w-full text-left px-4 py-3.5 hover:bg-gray-50"
                    role="menuitem"
                  >
                    <div className="text-[15px] font-semibold text-gray-900">Manage Users</div>
                  </button>

                  <button
                    onClick={() => {
                      setOpen(false);
                      navigate("/workspaces");
                    }}
                    className="w-full text-left px-4 py-3.5 hover:bg-gray-50"
                    role="menuitem"
                  >
                    <div className="text-[15px] font-semibold text-gray-900">Manage Workspaces</div>
                  </button>

                  {/* Divider */}
                  <div className="h-px bg-gray-200"></div>
                </>
              )}

              {/* Sign out */}
              <button
                onClick={async () => {
                  setOpen(false);
                  await signOut(auth);
                  navigate("/login");
                }}
                className="w-full text-left px-4 py-3.5 text-red-600 hover:bg-red-50 font-semibold"
                role="menuitem"
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
