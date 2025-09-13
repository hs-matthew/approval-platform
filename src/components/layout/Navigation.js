// src/components/layout/Navigation.js
import React, { useEffect, useRef, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { signOut } from "firebase/auth";
import { auth } from "../../lib/firebase";

export default function Navigation({ currentUser }) {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);

  // Close menu on outside click / Esc
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

  // Basic user display info
  const name = currentUser?.name || currentUser?.displayName || "";
  const email = currentUser?.email || "";
  const role = (currentUser?.role || (Array.isArray(currentUser?.roles) ? currentUser.roles[0] : "") || "")
    .toString()
    .toLowerCase();
  const isAdmin = role === "admin";
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
            {/* NavLink highlights on partial match, so /seo-reports/:id is active for /seo-reports */}
            <NavLink
              to="/dashboard"
              end
              className={({ isActive }) => `${linkBase} ${isActive ? linkActive : linkInactive}`}
            >
              Dashboard
            </NavLink>
            <NavLink
              to="/content"
              className={({ isActive }) => `${linkBase} ${isActive ? linkActive : linkInactive}`}
            >
              Content
            </NavLink>
            <NavLink
              to="/audits"
              className={({ isActive }) => `${linkBase} ${isActive ? linkActive : linkInactive}`}
            >
              Audits
            </NavLink>
            <NavLink
              to="/seo-reports"
              className={({ isActive }) => `${linkBase} ${isActive ? linkActive : linkInactive}`}
            >
              SEO Reports
            </NavLink>
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
              className="absolute right-0 top-full mt-2 w-64 bg-white rounded-xl shadow-xl ring-1 ring-black/5 z-[1000] overflow-hidden"
            >
              {/* Role badge */}
              {!!role && (
                <div className="px-4 py-2 text-sm font-semibold text-purple-700 bg-purple-50 border-b border-gray-200">
                  {role.charAt(0).toUpperCase() + role.slice(1)}
                </div>
              )}

              <button
                onClick={() => {
                  setOpen(false);
                  navigate("/profile");
                }}
                className="w-full text-left px-4 py-2.5 text-base text-gray-800 hover:bg-gray-50"
                role="menuitem"
              >
                Profile
              </button>

              {isAdmin && (
                <>
                  <button
                    onClick={() => {
                      setOpen(false);
                      navigate("/users");
                    }}
                    className="w-full text-left px-4 py-2.5 text-base text-gray-800 hover:bg-gray-50"
                    role="menuitem"
                  >
                    Manage Users
                  </button>
                  <button
                    onClick={() => {
                      setOpen(false);
                      navigate("/workspaces");
                    }}
                    className="w-full text-left px-4 py-2.5 text-base text-gray-800 hover:bg-gray-50"
                    role="menuitem"
                  >
                    Manage Workspaces
                  </button>
                </>
              )}

              <div className="my-1 h-px bg-gray-200" />

              <button
                onClick={async () => {
                  setOpen(false);
                  await signOut(auth);
                  navigate("/login");
                }}
                className="w-full text-left px-4 py-2.5 text-base text-red-600 hover:bg-red-50"
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
