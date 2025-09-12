// pages/ManageWorkspaces/ManageWorkspaces.js
import React, { useState } from 'react';
import { Building, Plus, Calendar, Users } from 'lucide-react';

const ManageWorkspaces = ({ workspaces, onAddWorkspace, currentUser }) => {
  const [newWorkspace, setNewWorkspace] = useState({
    name: '',
    description: ''
  });

  const handleSubmit = async () => {
    if (!newWorkspace.name.trim()) {
      alert('Please enter a workspace name.');
      return;
    }
    
    try {
      await onAddWorkspace({
        name: newWorkspace.name,
        description: newWorkspace.description,
        clientId: currentUser.id, // Assign to current user as client
        writers: [],
        createdAt: new Date().toISOString()
      });
      
      // Clear the form
      setNewWorkspace({ name: '', description: '' });
    } catch (error) {
      console.error('Error creating workspace:', error);
      alert('Error creating workspace. Please try again.');
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Manage Workspaces</h2>
        <p className="text-gray-600">Create and manage client workspaces</p>
      </div>

      {/* Add New Workspace Form */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Plus className="w-5 h-5" />
          Add New Workspace
        </h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Workspace Name *
            </label>
            <input
              type="text"
              value={newWorkspace.name}
              onChange={(e) => setNewWorkspace(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Enter workspace name"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              rows={3}
              value={newWorkspace.description}
              onChange={(e) => setNewWorkspace(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Enter workspace description"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <button
            onClick={handleSubmit}
            className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Create Workspace
          </button>
        </div>
      </div>

      {/* Existing Workspaces */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Building className="w-5 h-5" />
          Existing Workspaces
        </h3>
        
        {workspaces.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-gray-400 mb-4">
              <Building className="w-12 h-12 mx-auto" />
            </div>
            <h4 className="text-lg font-medium text-gray-900 mb-2">No workspaces created yet</h4>
            <p className="text-gray-600">Create your first workspace to get started with content management.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {workspaces.map((workspace) => (
              <div key={workspace.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Building className="w-5 h-5 text-blue-600" />
                      <h4 className="font-semibold text-gray-900">{workspace.name}</h4>
                    </div>
                    
                    {workspace.description && (
                      <p className="text-gray-600 text-sm mb-3">{workspace.description}</p>
                    )}
                    
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        <span>Created: {formatDate(workspace.createdAt)}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        <span>{workspace.writers?.length || 0} writers assigned</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="ml-4">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      Active
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Workspace Stats */}
      {workspaces.length > 0 && (
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Building className="w-5 h-5 text-blue-600" />
            <h4 className="font-medium text-blue-900">Workspace Summary</h4>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <span className="text-blue-700 font-medium">Total Workspaces:</span>
              <span className="text-blue-900 ml-2">{workspaces.length}</span>
            </div>
            <div>
              <span className="text-blue-700 font-medium">Active:</span>
              <span className="text-blue-900 ml-2">{workspaces.length}</span>
            </div>
            <div>
              <span className="text-blue-700 font-medium">Total Writers:</span>
              <span className="text-blue-900 ml-2">
                {workspaces.reduce((sum, ws) => sum + (ws.writers?.length || 0), 0)}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageWorkspaces;
