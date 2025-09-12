// src/components/layout/Navigation.js
import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";

const Navigation = ({ currentUser }) => {
  const location = useLocation();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const linkClasses = (path) =>
    `px-3 py-2 rounded-md text-sm font-medium ${
      location.pathname === path
        ? "bg-blue-100 text-blue-700"
        : "text-gray-600 hover:text-gray-900"
    }`;

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        {/* Left side: logo + nav */}
        <div className="flex items-center gap-6">
          <Link to="/dashboard">
            <img
              src="/assets/hs-square-icon.png"
              alt="Company Logo"
              className="h-10 w-auto object-contain"
            />
          </Link>
          <h1 className="text-xl font-bold text-gray-900">
            Content Approval Platform
          </h1>

          <nav className="flex gap-4">
            <Link to="/dashboard" className={linkClasses("/dashboard")}>
              Dashboard
            </Link>
            <Link to="/content" className={linkClasses("/content")}>
              Content
            </Link>
            <Link to="/audits" className={linkClasses("/audits")}>
              Audits
            </Link>
            <Link to="/seo-reports" className={linkClasses("/seo-reports")}>
              SEO Reports
            </Link>
          </nav>
        </div>

        {/* Right side: avatar + dropdown */}
        <div className="relative">
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-2 focus:outline-none"
          >
            <img
              src={currentUser?.photoURL || "/assets/default-avatar.png"}
              alt="Avatar"
              className="w-8 h-8 rounded-full"
            />
          </button>

          {dropdownOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-md py-2 z-50">
              {/* Role badge */}
              <div className="px-4 py-2 text-xs font-medium text-purple-600 bg-purple-50 border-b border-gray-200">
                {currentUser?.role
                  ? currentUser.role.charAt(0).toUpperCase() +
                    currentUser.role.slice(1)
                  : "User"}
              </div>

              <Link
                to="/profile"
                className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              >
                Profile
              </Link>

              {currentUser?.role === "admin" && (
                <>
                  <Link
                    to="/users"
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    Manage Users
                  </Link>
                  <Link
                    to="/workspaces"
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    Manage Workspaces
                  </Link>
                </>
              )}

              <button
                onClick={() => {
                  // you’ll add sign-out logic here
                }}
                className="w-full text-left block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              >
                Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navigation;
