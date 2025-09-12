// components/layout/Navigation.js
import React from 'react';

const Navigation = ({ currentView, onViewChange, currentUser }) => (
  <div className="bg-white border-b border-gray-200 px-6 py-4">
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-6">
        <a href="#">
          <img
            src="/assets/hs-square-icon.png"
            alt="Company Logo"
            className="h-10 w-auto object-contain"
          />
        </a>
        <h1 className="text-xl font-bold text-gray-900">Content Approval Platform</h1>
        <nav className="flex gap-4">
          <button
            onClick={() => onViewChange('dashboard')}
            className={`px-3 py-2 rounded-md text-sm font-medium ${
              currentView === 'dashboard' ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Dashboard
          </button>
          <button
            onClick={() => onViewChange('submit')}
            className={`px-3 py-2 rounded-md text-sm font-medium ${
              currentView === 'submit' ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Submit Content
          </button>
          <button
            onClick={() => onViewChange('workspaces')}
            className={`px-3 py-2 rounded-md text-sm font-medium ${
              currentView === 'workspaces' ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Manage Workspaces
          </button>
          <button
            onClick={() => onViewChange('users')}
            className={`px-3 py-2 rounded-md text-sm font-medium ${
              currentView === 'users' ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Manage Users
          </button>
        </nav>
      </div>
      <div className="flex items-center gap-4">
        <div className="px-3 py-1 rounded-full text-xs font-medium text-purple-600 bg-purple-100">
          {currentUser.role.charAt(0).toUpperCase() + currentUser.role.slice(1)}
        </div>
        <div className="text-sm text-gray-600">{currentUser.name}</div>
      </div>
    </div>
  </div>
);

export default Navigation;
