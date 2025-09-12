// components/layout/Navigation.js
import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { signOut } from "firebase/auth";
import { auth } from "../../lib/firebase";

export default function Navigation({ currentUser }) {
  const navigate = useNavigate();

  const base =
    "px-3 py-2 rounded-md text-sm font-medium hover:bg-gray-200";
  const active = "bg-blue-100 text-blue-700";
  const inactive = "text-gray-600 hover:text-gray-900";

  return (
    <div className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        {/* Left: Logo + title + nav */}
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

          <nav className="flex gap-2">
            <NavLink
              to="/dashboard"
              className={({ isActive }) =>
                `${base} ${isActive ? active : inactive}`
              }
            >
              Dashboard
            </NavLink>
            <NavLink
              to="/submit"
              className={({ isActive }) =>
                `${base} ${isActive ? active : inactive}`
              }
            >
              Submit Content
            </NavLink>
            <NavLink
              to="/workspaces"
              className={({ isActive }) =>
                `${base} ${isActive ? active : inactive}`
              }
            >
              Manage Workspaces
            </NavLink>
            <NavLink
              to="/users"
              className={({ isActive }) =>
                `${base} ${isActive ? active : inactive}`
              }
            >
              Manage Users
            </NavLink>
          </nav>
        </div>

        {/* Right: user info + signout */}
        <div className="flex items-center gap-4">
          {currentUser && currentUser.role && (
            <div className="px-3 py-1 rounded-full text-xs font-medium text-purple-600 bg-purple-100">
              {currentUser.role.charAt(0).toUpperCase() +
                currentUser.role.slice(1)}
            </div>
          )}
          {currentUser && (
            <div className="text-sm text-gray-600">{currentUser.name}</div>
          )}
          {currentUser ? (
            <button
              onClick={async () => {
                await signOut(auth);
                navigate("/login");
              }}
              className="px-3 py-1 rounded-md bg-gray-100 hover:bg-gray-200 text-sm"
            >
              Sign Out
            </button>
          ) : (
            <NavLink
              to="/login"
              className="px-3 py-1 rounded-md bg-blue-600 hover:bg-blue-700 text-white text-sm"
            >
              Sign In
            </NavLink>
          )}
        </div>
      </div>
    </div>
  );
}
