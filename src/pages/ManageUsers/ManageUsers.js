// pages/ManageUsers/ManageUsers.js
import React from 'react';
import { Users, Calendar, Mail, Shield } from 'lucide-react';
import UserForm from './UserForm'; // ✅ CORRECTED: Import from same folder

const ManageUsers = ({ users, currentUser, onAddUser }) => {
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getRoleColor = (role) => {
    switch (role) {
      case 'admin':
        return 'bg-purple-100 text-purple-600';
      case 'client':
        return 'bg-green-100 text-green-600';
      case 'writer':
        return 'bg-blue-100 text-blue-600';
      default:
        return 'bg-gray-100 text-gray-600';
    }
  };

  const getRoleIcon = (role) => {
    switch (role) {
      case 'admin':
        return <Shield className="w-4 h-4" />;
      case 'client':
        return <Users className="w-4 h-4" />;
      case 'writer':
        return <Mail className="w-4 h-4" />;
      default:
        return <Users className="w-4 h-4" />;
    }
  };

  const getRoleStats = () => {
    return {
      admin: users.filter(u => u.role === 'admin').length,
      client: users.filter(u => u.role === 'client').length,
      writer: users.filter(u => u.role === 'writer').length
    };
  };

  const roleStats = getRoleStats();

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Manage Users</h2>
        <p className="text-gray-600">Create and manage user accounts with the improved form</p>
      </div>

      {/* User Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Users className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <div className="text-sm text-gray-600">Total Users</div>
              <div className="text-2xl font-bold text-gray-900">{users.length}</div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Shield className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <div className="text-sm text-gray-600">Admins</div>
              <div className="text-2xl font-bold text-gray-900">{roleStats.admin}</div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <Users className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <div className="text-sm text-gray-600">Clients</div>
              <div className="text-2xl font-bold text-gray-900">{roleStats.client}</div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Mail className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <div className="text-sm text-gray-600">Writers</div>
              <div className="text-2xl font-bold text-gray-900">{roleStats.writer}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column - Add New User Form */}
        <div>
          <UserForm 
            users={users}
            onAddUser={onAddUser}
            showTitle={true}
            className="mb-6"
          />
        </div>

        {/* Right Column - Existing Users List */}
        <div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Users className="w-5 h-5" />
              Existing Users ({users.length})
            </h3>
            
            {users.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-gray-400 mb-4">
                  <Users className="w-12 h-12 mx-auto" />
                </div>
                <h4 className="text-lg font-medium text-gray-900 mb-2">No users created yet</h4>
                <p className="text-gray-600">Create your first user to get started.</p>
              </div>
            ) : (
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {users.map((user) => (
                  <div key={user.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="flex-shrink-0">
                          <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                            <span className="text-sm font-medium text-gray-600">
                              {user.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                        </div>
                        
                        <div>
                          <h4 className="font-semibold text-gray-900">{user.name}</h4>
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Mail className="w-4 h-4" />
                            <span>{user.email}</span>
                          </div>
                          <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                            <Calendar className="w-3 h-3" />
                            <span>Created: {formatDate(user.createdAt)}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleColor(user.role)}`}>
                          {getRoleIcon(user.role)}
                          {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                        </span>
                        
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          {user.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Additional Info Panel */}
      {users.length > 0 && (
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <h4 className="font-semibold text-blue-900 mb-2">User Management</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Users can be assigned to workspaces after creation</li>
                <li>• Email notifications are sent for new accounts</li>
                <li>• Role permissions are applied immediately</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold text-blue-900 mb-2">Role Permissions</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• <strong>Admins:</strong> Full platform access</li>
                <li>• <strong>Clients:</strong> Approve content in their workspaces</li>
                <li>• <strong>Writers:</strong> Submit content to assigned workspaces</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold text-blue-900 mb-2">Current Status</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Total active users: {users.filter(u => u.isActive).length}</li>
                <li>• Most recent: {users[users.length - 1]?.name || 'None'}</li>
                <li>• System health: All operational ✅</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageUsers;
