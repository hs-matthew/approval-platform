import React, { useState, useRef } from 'react';
import { Check, X, MessageSquare, Edit, Eye, Clock, Image, Bold, Italic, Underline, List, Link2, AlignLeft, AlignCenter, AlignRight, Users, Building, UserPlus, Filter, MapPin, Star, Phone, Globe, Calendar, FileText } from 'lucide-react';
import { db } from './firebase';
import { collection, addDoc, onSnapshot } from 'firebase/firestore';

const ApprovalPlatform = () => {
  console.log('Firebase connected:', db);
  const [currentUser] = useState({
    id: 1,
    name: "Admin User",
    email: "admin@company.com",
    role: "admin"
  });

  const [workspaces, setWorkspaces] = useState([
    {
      id: 1,
      name: "TechCorp Solutions",
      description: "Technology blog content for TechCorp",
      clientId: 2,
      writers: [3, 4],
      createdAt: "2024-03-01T10:00:00Z"
    },
    {
      id: 2,
      name: "Health & Wellness Co",
      description: "Health and wellness content", 
      clientId: 5,
      writers: [4],
      createdAt: "2024-03-05T14:30:00Z"
    }
  ]);

  const [users, setUsers] = useState([
    { id: 1, name: "Admin User", email: "admin@company.com", role: "admin" },
    { id: 2, name: "John Smith", email: "john@techcorp.com", role: "client" },
    { id: 3, name: "Sarah Johnson", email: "sarah@writer.com", role: "writer" },
    { id: 4, name: "Mike Davis", email: "mike@writer.com", role: "writer" },
    { id: 5, name: "Lisa Chen", email: "lisa@wellness.com", role: "client" }
  ]);

  const [submissions, setSubmissions] = useState([
    {
      id: 1,
      type: "blog_post",
      title: "Getting Started with React Hooks",
      content: "<p>React Hooks have revolutionized how we write React components.</p>",
      authorId: 3,
      workspaceId: 1,
      submittedAt: "2024-03-15T10:30:00Z",
      status: "pending",
      image: null
    },
    {
      id: 2,
      type: "gbp_service",
      title: "Emergency Plumbing Services",
      businessName: "QuickFix Plumbing",
      serviceCategory: "Emergency Services",
      description: "24/7 emergency plumbing services for residential and commercial properties.",
      serviceAreas: ["Downtown", "Midtown"],
      pricing: "$150 - $300 per hour",
      availability: "24/7",
      phone: "(555) 123-4567",
      website: "https://quickfixplumbing.com",
      specialOffers: "10% off first-time customers",
      authorId: 3,
      workspaceId: 2,
      submittedAt: "2024-03-13T16:45:00Z",
      status: "pending",
      images: []
    }
  ]);

  const [currentView, setCurrentView] = useState('dashboard');
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [feedback, setFeedback] = useState('');
  const [filterWorkspace, setFilterWorkspace] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [submissionType, setSubmissionType] = useState('blog_post');
  
  const [newPost, setNewPost] = useState({ 
    title: '', 
    content: '', 
    workspaceId: '', 
    image: null 
  });

  const fileInputRef = useRef(null);
  const editorRef = useRef(null);

  const getUserById = (id) => users.find(user => user.id === id);
  const getWorkspaceById = (id) => workspaces.find(ws => ws.id === id);
  
  const getAccessibleWorkspaces = () => {
    if (currentUser.role === 'admin') return workspaces;
    if (currentUser.role === 'client') return workspaces.filter(ws => ws.clientId === currentUser.id);
    if (currentUser.role === 'writer') return workspaces.filter(ws => ws.writers.includes(currentUser.id));
    return [];
  };

  const getFilteredSubmissions = () => {
    let filtered = submissions;
    
    if (currentUser.role === 'client') {
      const userWorkspaces = workspaces.filter(ws => ws.clientId === currentUser.id);
      filtered = filtered.filter(sub => userWorkspaces.some(ws => ws.id === sub.workspaceId));
    } else if (currentUser.role === 'writer') {
      const userWorkspaces = workspaces.filter(ws => ws.writers.includes(currentUser.id));
      filtered = filtered.filter(sub => userWorkspaces.some(ws => ws.id === sub.workspaceId) || sub.authorId === currentUser.id);
    }
    
    if (filterWorkspace !== 'all') {
      filtered = filtered.filter(sub => sub.workspaceId === parseInt(filterWorkspace));
    }

    if (filterType !== 'all') {
      filtered = filtered.filter(sub => sub.type === filterType);
    }
    
    return filtered;
  };

  const handleApprove = (id) => {
    setSubmissions(prev => prev.map(sub => 
      sub.id === id 
        ? { ...sub, status: 'approved', feedback, approvedAt: new Date().toISOString() }
        : sub
    ));
    setFeedback('');
    setCurrentView('dashboard');
  };

  const handleReject = (id) => {
    if (!feedback.trim()) {
      alert('Please provide feedback when rejecting a submission.');
      return;
    }
    setSubmissions(prev => prev.map(sub => 
      sub.id === id 
        ? { ...sub, status: 'rejected', feedback, rejectedAt: new Date().toISOString() }
        : sub
    ));
    setFeedback('');
    setCurrentView('dashboard');
  };

const handleSubmitPost = async () => {
  if (!newPost.title.trim() || !newPost.workspaceId || !newPost.content.trim()) {
    alert('Please fill in Workspace, Title, and Content.');
    return;
  }

  console.log('Trying to save...');

  const nextId =
    submissions.length ? Math.max(...submissions.map(s => s.id)) + 1 : 1;

  const submission = {
    id: nextId,
    type: 'blog_post',
    title: newPost.title,
    content: newPost.content,
    authorId: currentUser.id,
    workspaceId: parseInt(newPost.workspaceId, 10),
    submittedAt: new Date().toISOString(),
    status: 'pending',
    image: newPost.image || null
  };

  try {
    // Optional: write something to Firestore too
    await addDoc(collection(db, 'test'), {
      message: 'Hello Firebase!',
      timestamp: new Date()
    });
    console.log('Success!');
  } catch (error) {
    console.error('Error:', error);
    // You might still want to proceed locally even if the write fails
  }

  setSubmissions(prev => [submission, ...prev]);
  setNewPost({ title: '', content: '', workspaceId: '', image: null });
  setCurrentView('dashboard');
};


  const handleImageUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setNewPost(prev => ({ ...prev, image: e.target.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleEditorCommand = (command, value = null) => {
    document.execCommand(command, false, value);
    if (editorRef.current) {
      editorRef.current.focus();
    }
  };

  const handleContentChange = () => {
    if (editorRef.current) {
      setNewPost(prev => ({ ...prev, content: editorRef.current.innerHTML }));
    }
  };

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
      case 'gbp_service': return <MapPin className="w-4 h-4" />;
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

const Navigation = () => (
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
              onClick={() => setCurrentView('dashboard')}
              className={`px-3 py-2 rounded-md text-sm font-medium ${
                currentView === 'dashboard' ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Dashboard
            </button>
            <button
              onClick={() => setCurrentView('submit')}
              className={`px-3 py-2 rounded-md text-sm font-medium ${
                currentView === 'submit' ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Submit Content
            </button>
          </nav>
        </div>
        <div className="flex items-center gap-4">
          <div className="px-3 py-1 rounded-full text-xs font-medium text-purple-600 bg-purple-100">
            Admin
          </div>
          <div className="text-sm text-gray-600">{currentUser.name}</div>
        </div>
      </div>
        <Footer />
    </div>
  );

  if (currentView === 'submit') {
    const accessibleWorkspaces = getAccessibleWorkspaces();
    
    return (
      <div className="min-h-screen bg-gray-100">
        <Navigation />
        <div className="max-w-4xl mx-auto p-6">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Submit New Content</h2>
            <p className="text-gray-600">Choose the type of content you want to submit for approval</p>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Content Type</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button
                onClick={() => setSubmissionType('blog_post')}
                className={`p-4 rounded-lg border-2 transition-colors ${
                  submissionType === 'blog_post' 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center gap-3">
                  <FileText className="w-6 h-6 text-blue-600" />
                  <div className="text-left">
                    <h4 className="font-medium text-gray-900">Blog Post</h4>
                    <p className="text-sm text-gray-600">Submit articles and blog content</p>
                  </div>
                </div>
              </button>
              <button
                onClick={() => setSubmissionType('gbp_service')}
                className={`p-4 rounded-lg border-2 transition-colors ${
                  submissionType === 'gbp_service' 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center gap-3">
                  <MapPin className="w-6 h-6 text-green-600" />
                  <div className="text-left">
                    <h4 className="font-medium text-gray-900">GBP Service</h4>
                    <p className="text-sm text-gray-600">Submit Google Business Profile services</p>
                  </div>
                </div>
              </button>
            </div>
          </div>

          {submissionType === 'blog_post' && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Submit Blog Post</h3>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Workspace *</label>
                <select
                  value={newPost.workspaceId}
                  onChange={(e) => setNewPost(prev => ({ ...prev, workspaceId: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select a workspace</option>
                  {accessibleWorkspaces.map(workspace => (
                    <option key={workspace.id} value={workspace.id}>{workspace.name}</option>
                  ))}
                </select>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Blog Post Title *</label>
                <input
                  type="text"
                  value={newPost.title}
                  onChange={(e) => setNewPost(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter blog post title"
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Featured Image (Optional)</label>
                <div className="flex items-center gap-4">
                  <button
                    type="button"
                    onClick={() => {
                      if (fileInputRef.current) {
                        fileInputRef.current.click();
                      }
                    }}
                    className="bg-white border border-gray-300 rounded-md px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 flex items-center gap-2"
                  >
                    <Image className="w-4 h-4" />
                    Choose Image
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                  {newPost.image && (
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-green-600">Image uploaded</span>
                      <button
                        onClick={() => setNewPost(prev => ({ ...prev, image: null }))}
                        className="text-red-600 hover:text-red-800"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
                {newPost.image && (
                  <div className="mt-3">
                    <img 
                      src={newPost.image} 
                      alt="Preview" 
                      className="max-w-full h-48 object-cover rounded-md border border-gray-300"
                    />
                  </div>
                )}
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Blog Post Content *</label>
                
                <div className="border border-gray-300 rounded-t-md bg-white p-2 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => handleEditorCommand('bold')}
                    className="p-2 hover:bg-gray-100 rounded border border-transparent hover:border-gray-300"
                    title="Bold"
                  >
                    <Bold className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleEditorCommand('italic')}
                    className="p-2 hover:bg-gray-100 rounded border border-transparent hover:border-gray-300"
                    title="Italic"
                  >
                    <Italic className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleEditorCommand('underline')}
                    className="p-2 hover:bg-gray-100 rounded border border-transparent hover:border-gray-300"
                    title="Underline"
                  >
                    <Underline className="w-4 h-4" />
                  </button>
                  <div className="w-px h-8 bg-gray-300 mx-1"></div>
                  <button
                    type="button"
                    onClick={() => handleEditorCommand('justifyLeft')}
                    className="p-2 hover:bg-gray-100 rounded border border-transparent hover:border-gray-300"
                    title="Align Left"
                  >
                    <AlignLeft className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleEditorCommand('justifyCenter')}
                    className="p-2 hover:bg-gray-100 rounded border border-transparent hover:border-gray-300"
                    title="Align Center"
                  >
                    <AlignCenter className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleEditorCommand('justifyRight')}
                    className="p-2 hover:bg-gray-100 rounded border border-transparent hover:border-gray-300"
                    title="Align Right"
                  >
                    <AlignRight className="w-4 h-4" />
                  </button>
                  <div className="w-px h-8 bg-gray-300 mx-1"></div>
                  <button
                    type="button"
                    onClick={() => handleEditorCommand('insertUnorderedList')}
                    className="p-2 hover:bg-gray-100 rounded border border-transparent hover:border-gray-300"
                    title="Bullet List"
                  >
                    <List className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const url = prompt('Enter link URL:');
                      if (url) handleEditorCommand('createLink', url);
                    }}
                    className="p-2 hover:bg-gray-100 rounded border border-transparent hover:border-gray-300"
                    title="Insert Link"
                  >
                    <Link2 className="w-4 h-4" />
                  </button>
                </div>

                <div
                  ref={editorRef}
                  contentEditable
                  className="w-full min-h-64 px-3 py-2 border border-gray-300 border-t-0 rounded-b-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  style={{ minHeight: '200px' }}
                  onInput={handleContentChange}
                  suppressContentEditableWarning={true}
                />
                <div className="text-xs text-gray-500 mt-1">
                  Use the toolbar above to format your text.
                </div>
              </div>

              <button
                onClick={handleSubmitPost}
                className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition-colors"
              >
                Submit Blog Post
              </button>
            </div>
          )}

          {submissionType === 'gbp_service' && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">GBP Service</h3>
              <p className="text-gray-600">Google Business Profile service submission coming soon!</p>
            </div>
          )}
        </div>
           <Footer />
      </div>
    );
  }

  if (currentView === 'review' && selectedSubmission) {
    const author = getUserById(selectedSubmission.authorId);
    const workspace = getWorkspaceById(selectedSubmission.workspaceId);
    
    return (
      <div className="min-h-screen bg-gray-100">
        <Navigation />
        <div className="max-w-4xl mx-auto p-6">
          <div className="mb-6">
            <button 
              onClick={() => setCurrentView('dashboard')}
              className="text-blue-600 hover:text-blue-800 flex items-center gap-2 mb-4"
            >
              ← Back to Dashboard
            </button>
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  {getTypeIcon(selectedSubmission.type)}
                  <h2 className="text-2xl font-bold text-gray-900">Review {getTypeLabel(selectedSubmission.type)}</h2>
                </div>
                <div className="text-sm text-gray-600">
                  Workspace: {workspace ? workspace.name : 'Unknown'}
                </div>
              </div>
              <div className={`px-3 py-1 rounded-full text-sm font-medium flex items-center gap-2 ${getStatusColor(selectedSubmission.status)}`}>
                {getStatusIcon(selectedSubmission.status)}
                {selectedSubmission.status.charAt(0).toUpperCase() + selectedSubmission.status.slice(1)}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
            <div className="mb-4">
              <h3 className="text-xl font-bold text-gray-900 mb-2">{selectedSubmission.title}</h3>
              <div className="text-sm text-gray-600">
                By {author ? author.name : 'Unknown'} • Submitted {formatDate(selectedSubmission.submittedAt)}
              </div>
            </div>
            
            {selectedSubmission.type === 'blog_post' && (
              <>
                {selectedSubmission.image && (
                  <div className="mb-6">
                    <img 
                      src={selectedSubmission.image} 
                      alt="Featured" 
                      className="max-w-full h-64 object-cover rounded-md border border-gray-300"
                    />
                  </div>
                )}
                
                <div className="prose max-w-none">
                  <div 
                    className="text-gray-800 leading-relaxed"
                    dangerouslySetInnerHTML={{ __html: selectedSubmission.content }}
                  />
                </div>
              </>
            )}

            {selectedSubmission.type === 'gbp_service' && (
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Business Information</h4>
                  <p><strong>Business Name:</strong> {selectedSubmission.businessName}</p>
                  <p><strong>Category:</strong> {selectedSubmission.serviceCategory}</p>
                  {selectedSubmission.phone && <p><strong>Phone:</strong> {selectedSubmission.phone}</p>}
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Service Description</h4>
                  <p className="text-gray-700">{selectedSubmission.description}</p>
                </div>
                {selectedSubmission.pricing && (
                  <p><strong>Pricing:</strong> {selectedSubmission.pricing}</p>
                )}
              </div>
            )}
          </div>

          {selectedSubmission.status === 'pending' && (
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h4 className="text-lg font-semibold text-gray-900 mb-4">Review Decision</h4>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Feedback (Optional for approval, required for rejection)
                </label>
                <textarea
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Provide feedback for the author..."
                />
              </div>

              <div className="flex gap-4">
                <button
                  onClick={() => handleApprove(selectedSubmission.id)}
                  className="bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700 transition-colors flex items-center gap-2"
                >
                  <Check className="w-4 h-4" />
                  Approve
                </button>
                <button
                  onClick={() => handleReject(selectedSubmission.id)}
                  className="bg-red-600 text-white px-6 py-2 rounded-md hover:bg-red-700 transition-colors flex items-center gap-2"
                >
                  <X className="w-4 h-4" />
                  Reject
                </button>
              </div>
            </div>
          )}

          {selectedSubmission.feedback && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
              <h5 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
                <MessageSquare className="w-4 h-4" />
                Reviewer Feedback
              </h5>
              <p className="text-blue-800">{selectedSubmission.feedback}</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  const filteredSubmissions = getFilteredSubmissions();
  const accessibleWorkspaces = getAccessibleWorkspaces();

  return (
    <div className="min-h-screen bg-gray-100">
      <Navigation />
      <div className="max-w-6xl mx-auto p-6">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Content Dashboard</h2>
          <p className="text-gray-600">Manage and review content submissions across workspaces</p>
        </div>

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
                {accessibleWorkspaces.map(workspace => (
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

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <FileText className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <div className="text-sm text-gray-600">Total</div>
                <div className="text-2xl font-bold text-gray-900">{filteredSubmissions.length}</div>
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
                  {filteredSubmissions.filter(s => s.status === 'pending').length}
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
                  {filteredSubmissions.filter(s => s.status === 'approved').length}
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
                  {filteredSubmissions.filter(s => s.status === 'rejected').length}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-6">
          {filteredSubmissions.map((submission) => {
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
                      {submission.type === 'gbp_service' && submission.images && submission.images.length > 0 && (
                        <span className="text-blue-600">📷 {submission.images.length}</span>
                      )}
                    </div>
                    <div className="text-sm text-gray-600 mb-2">
                      By {author ? author.name : 'Unknown'} • {workspace ? workspace.name : 'Unknown'} • Submitted {formatDate(submission.submittedAt)}
                      {submission.type === 'gbp_service' && (
                        <span className="ml-2 text-green-600">• {submission.businessName}</span>
                      )}
                    </div>
                    <div className="text-gray-700">
                      {submission.type === 'blog_post' ? (
                        <div 
                          dangerouslySetInnerHTML={{ 
                            __html: submission.content.replace(/<[^>]*>/g, '').substring(0, 200) + '...' 
                          }} 
                        />
                      ) : (
                        <div>{submission.description.substring(0, 200)}...</div>
                      )}
                    </div>
                  </div>
                  
                  <div className="ml-6 flex flex-col items-end gap-3">
                    <div className={`px-3 py-1 rounded-full text-sm font-medium flex items-center gap-2 ${getStatusColor(submission.status)}`}>
                      {getStatusIcon(submission.status)}
                      {submission.status.charAt(0).toUpperCase() + submission.status.slice(1)}
                    </div>
                    
                    <button
                      onClick={() => {
                        setSelectedSubmission(submission);
                        setCurrentView('review');
                        setFeedback('');
                      }}
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

        {filteredSubmissions.length === 0 && (
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
        )}
      </div>
         <Footer />
    </div>
  );
};

// Add this Footer component before the ApprovalPlatform component
const Footer = () => (
  <footer className="bg-gray-800 text-white py-8 mt-auto">
    <div className="max-w-6xl mx-auto px-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div>
          <h3 className="text-lg font-semibold mb-4">Content Approval Platform</h3>
          <p className="text-gray-300 text-sm">
            Streamline your content approval workflow with our powerful platform.
          </p>
        </div>
        <div>
          <h4 className="text-md font-semibold mb-4">Features</h4>
          <ul className="text-gray-300 text-sm space-y-2">
            <li>• Blog Post Management</li>
            <li>• GBP Service Listings</li>
            <li>• User Role Management</li>
            <li>• Real-time Collaboration</li>
          </ul>
        </div>
        <div>
          <h4 className="text-md font-semibold mb-4">Support</h4>
          <ul className="text-gray-300 text-sm space-y-2">
            <li>• Documentation</li>
            <li>• Help Center</li>
            <li>• Contact Support</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-gray-700 mt-8 pt-8 text-center">
        <p className="text-gray-400 text-sm">
          © {new Date().getFullYear()} Headspace Media, LLC. All rights reserved.
        </p>
      </div>
    </div>
  </footer>
);
export default ApprovalPlatform;
