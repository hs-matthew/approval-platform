// src/components/layout/Navigation.js
import React, { useEffect, useRef, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { signOut } from "firebase/auth";
import { auth } from "../../lib/firebase";
import { Menu, X } from "lucide-react";

export default function Navigation({ currentUser }) {
  const navigate = useNavigate();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const userMenuRef = useRef(null);
  const mobileRef = useRef(null);

  // ----- user info -----
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
    (name || email)
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((s) => s[0]?.toUpperCase())
      .join("") || "U";

  // ----- close popovers on outside click / Esc -----
  useEffect(() => {
    const onClick = (e) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setUserMenuOpen(false);
      }
      if (mobileRef.current && !mobileRef.current.contains(e.target)) {
        // only close if click is outside header when menu is open
        if (!e.target.closest("header")) setMobileOpen(false);
      }
    };
    const onKey = (e) => {
      if (e.key === "Escape") {
        setUserMenuOpen(false);
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

  const linkBase = "px-3 py-2 rounded-md text-sm font-medium";
  const active = "bg-blue-100 text-blue-700";
  const inactive = "text-gray-600 hover:text-gray-900 hover:bg-gray-100";

  const NavLinks = ({ onClick }) => (
    <>
      <NavLink to="/dashboard" end className={({ isActive }) => `${linkBase} ${isActive ? active : inactive}`} onClick={onClick}>
        Dashboard
      </NavLink>
      <NavLink to="/content" className={({ isActive }) => `${linkBase} ${isActive ? active : inactive}`} onClick={onClick}>
        Content
      </NavLink>
      <NavLink to="/audits" className={({ isActive }) => `${linkBase} ${isActive ? active : inactive}`} onClick={onClick}>
        Audits
      </NavLink>
      <NavLink to="/seo-reports" className={({ isActive }) => `${linkBase} ${isActive ? active : inactive}`} onClick={onClick}>
        SEO Reports
      </NavLink>
    </>
  );

  return (
    <header className="bg-white border-b border-gray-200 w-full">
      <div className="px-6 py-4 flex items-center justify-between">
        {/* Left: logo + desktop nav */}
        <div className="flex items-center gap-3">
          <NavLink to="/dashboard" className="flex items-center gap-3">
            <img src="/assets/hs-square-icon.png" alt="Company Logo" className="h-10 w-auto object-contain" />
            <h1 className="text-xl font-bold text-gray-900">Content Approval Platform</h1>
          </NavLink>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-2 ml-4">
            <NavLinks />
          </nav>
        </div>

        {/* Right: desktop avatar + mobile hamburger */}
        <div className="flex items-center gap-3">
          {/* Mobile hamburger (hidden on md+) */}
          <button
            className="md:hidden inline-flex items-center justify-center h-10 w-10 rounded-md hover:bg-gray-100"
            aria-label="Open menu"
            onClick={() => setMobileOpen((s) => !s)}
          >
            {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>

          {/* Avatar (desktop only) */}
          <div className="relative hidden md:block" ref={userMenuRef}>
            <button
              onClick={() => setUserMenuOpen((o) => !o)}
              aria-haspopup="menu"
              aria-expanded={userMenuOpen}
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

            {userMenuOpen && (
              <div
                role="menu"
                className="absolute right-0 mt-2 w-60 bg-white border border-gray-200 rounded-lg shadow-xl ring-1 ring-black/5 overflow-hidden z-[1000]"
              >
                {rolePrimary && (
                  <div className="px-3 py-2 bg-gray-50 border-b border-gray-200">
                    <span className="px-2 py-0.5 rounded-full text-xs font-semibold text-purple-700 bg-purple-100">
                      {rolePrimary.charAt(0).toUpperCase() + rolePrimary.slice(1)}
                    </span>
                  </div>
                )}

                <button
                  role="menuitem"
                  tabIndex={0}
                  onClick={() => {
                    setUserMenuOpen(false);
                    navigate("/profile");
                  }}
                  className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100"
                >
                  Profile
                  <div className="text-xs text-gray-500 truncate">{email}</div>
                </button>

                {isAdmin && (
                  <>
                    <div className="my-1 border-t border-gray-200" />
                    <button
                      role="menuitem"
                      tabIndex={0}
                      onClick={() => {
                        setUserMenuOpen(false);
                        navigate("/users");
                      }}
                      className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100"
                    >
                      Manage Users
                    </button>
                    <button
                      role="menuitem"
                      tabIndex={0}
                      onClick={() => {
                        setUserMenuOpen(false);
                        navigate("/workspaces");
                      }}
                      className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100"
                    >
                      Manage Workspaces
                    </button>
                  </>
                )}

                <div className="my-1 border-t border-gray-200" />
                <button
                  role="menuitem"
                  tabIndex={0}
                  onClick={async () => {
                    setUserMenuOpen(false);
                    await signOut(auth);
                    navigate("/login");
                  }}
                  className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                >
                  Sign Out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile slide-down panel (shown on sm, hidden on md+) */}
      {mobileOpen && (
        <div ref={mobileRef} className="md:hidden border-t border-gray-200 bg-white">
          <div className="px-4 py-3 flex flex-col gap-2">
            {/* Primary links */}
            <NavLinks onClick={() => setMobileOpen(false)} />

            <div className="h-px bg-gray-200 my-2" />

            {/* Profile summary */}
            <div className="flex items-center gap-3 px-1 py-2">
              {photoURL ? (
                <img src={photoURL} alt={name || email} className="h-9 w-9 rounded-full object-cover border border-gray-200" />
              ) : (
                <div className="h-9 w-9 rounded-full bg-gray-200 text-gray-700 flex items-center justify-center font-semibold border border-gray-300">
                  {initials}
                </div>
              )}
              <div>
                <div className="text-sm font-semibold text-gray-900">{name || "Profile"}</div>
                <div className="text-xs text-gray-500">{email}</div>
              </div>
              {rolePrimary && (
                <span className="ml-auto px-2 py-0.5 rounded-full text-xs font-semibold text-purple-700 bg-purple-100">
                  {rolePrimary.charAt(0).toUpperCase() + rolePrimary.slice(1)}
                </span>
              )}
            </div>

            {/* Admin-only links */}
            {isAdmin && (
              <>
                <button
                  onClick={() => {
                    setMobileOpen(false);
                    navigate("/users");
                  }}
                  className="w-full text-left px-3 py-2 rounded-md text-sm text-gray-800 hover:bg-gray-100"
                >
                  Manage Users
                </button>
                <button
                  onClick={() => {
                    setMobileOpen(false);
                    navigate("/workspaces");
                  }}
                  className="w-full text-left px-3 py-2 rounded-md text-sm text-gray-800 hover:bg-gray-100"
                >
                  Manage Workspaces
                </button>
              </>
            )}

            <button
              onClick={async () => {
                setMobileOpen(false);
                await signOut(auth);
                navigate("/login");
              }}
              className="w-full text-left px-3 py-2 rounded-md text-sm text-red-600 hover:bg-red-50"
            >
              Sign Out
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
