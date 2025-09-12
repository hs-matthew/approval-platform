// pages/Dashboard/Dashboard.js
import React, { useEffect, useState } from 'react';
import { auth } from '../../lib/firebase';
import { FileText, Clock, Check, X, Filter, Edit, Eye, MessageSquare } from 'lucide-react';

const Dashboard = ({ 
  submissions, 
  workspaces, 
  users,
  filterWorkspace,
  setFilterWorkspace,
  filterType,
  setFilterType,
  onSelectSubmission 
}) => {
  // ---- AUTH: listen for current user ----
  const [user, setUser] = useState(null);
  const [authReady, setAuthReady] = useState(false);

  useEffect(() => {
    const unsub = auth.onAuthStateChanged(u => {
      setUser(u);
      setAuthReady(true);
    });
    return () => unsub();
  }, []);

  // While we don't know yet
  if (!authReady) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <p className="text-gray-600">Loading…</p>
      </div>
    );
  }

  // Not signed in
  if (!user) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Content Dashboard</h2>
        <p className="text-gray-600 mb-4">You must be signed in to view submissions.</p>
        {/* Replace this with your real sign-in flow/route */}
        <a
          href="/login"
          className="inline-block bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
        >
          Go to Sign In
        </a>
      </div>
    );
  }

  // Utility functions
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'approved': return 'text-green-600 bg-green-100';
      case 'rejected': return 'text-red-600 bg-red-100';
      default: return 'text-yellow-600 bg-yellow-100';
    }
  };

  const getStatusIcon = (status) => {
    switch(status) {
      case 'approved': return <Check className="w-4 h-4" />;
      case 'rejected': return <X className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const getTypeIcon = (type) => {
    switch(type) {
      case 'blog_post': return <FileText className="w-4 h-4" />;
      case 'gbp_service': return <FileText className="w-4 h-4" />;
      default: return <FileText className="w-4 h-4" />;
    }
  };

  const getTypeLabel = (type) => {
    switch(type) {
      case 'blog_post': return 'Blog Post';
      case 'gbp_service': return 'GBP Service';
      default: return 'Content';
    }
  };

  const createSafePreview = (htmlContent, maxLength = 200) => {
    if (!htmlContent) return '';
    
    try {
      let decodedContent = htmlContent
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&amp;/g, '&')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/&nbsp;/g, ' ');
      
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = decodedContent;
      
      let textOnly = tempDiv.textContent || tempDiv.innerText || '';
      
      if (!textOnly || textOnly.trim().length === 0) {
        textOnly = decodedContent
          .replace(/<!--[\s\S]*?-->/g, '')
          .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
          .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
          .replace(/<[^>]*>/g, '')
          .replace(/\s+/g, ' ')
          .trim();
      }
      
      textOnly = textOnly.replace(/\s+/g, ' ').trim();
      
      return textOnly.substring(0, maxLength) + (textOnly.length > maxLength ? '...' : '');
    } catch (error) {
      console.error('Error in createSafePreview:', error);
      return 'Error loading preview';
    }
  };

  const getUserById = (id) => users.find(user => user.id === id);
  const getWorkspaceById = (id) => {
    return workspaces.find(ws => ws.id === id || ws.id === String(id) || String(ws.id) === String(id));
  };

  if (submissions.length === 0) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Content Dashboard</h2>
          <p className="text-gray-600">
            Manage and review content submissions across workspaces
            <span className="ml-2 text-gray-500">• Signed in as <strong>{user.email}</strong></span>
          </p>
        </div>
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <Edit className="w-12 h-12 mx-auto" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No submissions found</h3>
          <p className="text-gray-600">
            {filterWorkspace === 'all' && filterType === 'all'
              ? 'No content has been submitted yet.' 
              : 'No submissions found matching the selected filters.'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Content Dashboard</h2>
        <p className="text-gray-600">
          Manage and review content submissions across workspaces
          <span className="ml-2 text-gray-500">• Signed in as <strong>{user.email}</strong></span>
        </p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">Filters:</span>
          </div>
          
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600">Workspace:</label>
            <select
              value={filterWorkspace}
              onChange={(e) => setFilterWorkspace(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Workspaces</option>
              {workspaces.map(workspace => (
                <option key={workspace.id} value={workspace.id}>{workspace.name}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600">Type:</label>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Types</option>
              <option value="blog_post">Blog Posts</option>
              <option value="gbp_service">GBP Services</option>
            </select>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <FileText className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <div className="text-sm text-gray-600">Total</div>
              <div className="text-2xl font-bold text-gray-900">{submissions.length}</div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Clock className="w-5 h-5 text-yellow-600" />
            </div>
            <div>
              <div className="text-sm text-gray-600">Pending</div>
              <div className="text-2xl font-bold text-gray-900">
                {submissions.filter(s => s.status === 'pending').length}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <Check className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <div className="text-sm text-gray-600">Approved</div>
              <div className="text-2xl font-bold text-gray-900">
                {submissions.filter(s => s.status === 'approved').length}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 rounded-lg">
              <X className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <div className="text-sm text-gray-600">Rejected</div>
              <div className="text-2xl font-bold text-gray-900">
                {submissions.filter(s => s.status === 'rejected').length}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Submissions */}
      <div className="grid gap-6">
        {submissions.map((submission) => {
          const author = getUserById(submission.authorId);
          const workspace = getWorkspaceById(submission.workspaceId);
          
          return (
            <div key={submission.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    {getTypeIcon(submission.type)}
                    <h3 className="text-xl font-semibold text-gray-900">{submission.title}</h3>
                    <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs">
                      {getTypeLabel(submission.type)}
                    </span>
                    {submission.type === 'blog_post' && submission.image && <span className="text-blue-600">📷</span>}
                  </div>
                  <div className="text-sm text-gray-600 mb-2">
                    By {author ? author.name : 'Unknown'} • {workspace ? workspace.name : 'Unknown'} • Submitted {formatDate(submission.submittedAt)}
                  </div>
                  <div className="text-gray-700">
                    {submission.type === 'blog_post' ? (
                      <div>
                        {createSafePreview(submission.content, 200)}
                      </div>
                    ) : (
                      <div>{submission.description?.substring(0, 200)}...</div>
                    )}
                  </div>
                </div>
                
                <div className="ml-6 flex flex-col items-end gap-3">
                  <div className={`px-3 py-1 rounded-full text-sm font-medium flex items-center gap-2 ${getStatusColor(submission.status)}`}>
                    {getStatusIcon(submission.status)}
                    {submission.status.charAt(0).toUpperCase() + submission.status.slice(1)}
                  </div>
                  
                  <button
                    onClick={() => onSelectSubmission(submission)}
                    className="bg-gray-100 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-200 transition-colors flex items-center gap-2"
                  >
                    <Eye className="w-4 h-4" />
                    {submission.status === 'pending' ? 'Review' : 'View'}
                  </button>
                </div>
              </div>

              {submission.feedback && (
                <div className="mt-4 p-3 bg-gray-50 rounded-md">
                  <div className="text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                    <MessageSquare className="w-4 h-4" />
                    Feedback:
                  </div>
                  <p className="text-sm text-gray-600">{submission.feedback}</p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Dashboard;
