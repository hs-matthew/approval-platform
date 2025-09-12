import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { signOut } from "firebase/auth";
import { auth } from "../../lib/firebase";

export default function Navigation({ currentUser }) {
  const navigate = useNavigate();

  const linkBase =
    "px-3 py-2 rounded-md text-sm font-medium hover:bg-gray-200";
  const active =
    "bg-gray-200 text-gray-900";
  const inactive =
    "text-gray-700";

  return (
    <header className="bg-white border-b border-gray-200">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="font-semibold">Approval Platform</span>
          <nav className="flex items-center gap-1">
            <NavLink
              to="/dashboard"
              className={({ isActive }) =>
                `${linkBase} ${isActive ? active : inactive}`
              }
            >
              Dashboard
            </NavLink>
            <NavLink
              to="/submit"
              className={({ isActive }) =>
                `${linkBase} ${isActive ? active : inactive}`
              }
            >
              Submit
            </NavLink>
            <NavLink
              to="/workspaces"
              className={({ isActive }) =>
                `${linkBase} ${isActive ? active : inactive}`
              }
            >
              Workspaces
            </NavLink>
            <NavLink
              to="/users"
              className={({ isActive }) =>
                `${linkBase} ${isActive ? active : inactive}`
              }
            >
              Users
            </NavLink>
          </nav>
        </div>

        <div className="flex items-center gap-3">
          {currentUser && (
            <span className="text-sm text-gray-600 hidden sm:inline">
              {currentUser.email}
            </span>
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
    </header>
  );
}
