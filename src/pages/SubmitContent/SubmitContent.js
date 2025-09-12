// pages/SubmitContent/SubmitContent.js
import React, { useState, useRef } from 'react';
import { FileText, MapPin, Image, Bold, Italic, Underline, List, Link2, AlignLeft, AlignCenter, AlignRight, X } from 'lucide-react';
  
const SubmitContent = ({ workspaces, onSubmit, currentUser }) => {
  const [submissionType, setSubmissionType] = useState('blog_post');
  const [newPost, setNewPost] = useState({ 
    title: '', 
    content: '', 
    workspaceId: '', 
    image: null 
  });

  const fileInputRef = useRef(null);
  const editorRef = useRef(null);

  // Get accessible workspaces based on user role
  const getAccessibleWorkspaces = () => {
    if (currentUser.role === 'admin') return workspaces;
    if (currentUser.role === 'client') return workspaces.filter(ws => ws.clientId === currentUser.id);
    if (currentUser.role === 'writer') return workspaces.filter(ws => ws.writers?.includes(currentUser.id));
    return [];
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

  const handleSubmitPost = async () => {
    if (!newPost.title.trim() || !newPost.workspaceId || !newPost.content.trim()) {
      alert('Please fill in Workspace, Title, and Content.');
      return;
    }

    const submission = {
      type: 'blog_post',
      title: newPost.title,
      content: newPost.content,
      authorId: currentUser.id,
      workspaceId: newPost.workspaceId,
      submittedAt: new Date().toISOString(),
      status: 'pending',
      image: newPost.image || null
    };

    try {
      await onSubmit(submission);
      setNewPost({ title: '', content: '', workspaceId: '', image: null });
      // Clear editor content
      if (editorRef.current) {
        editorRef.current.innerHTML = '';
      }
    } catch (error) {
      console.error('Error submitting post:', error);
      alert('Error submitting post. Please try again.');
    }
  };

  const accessibleWorkspaces = getAccessibleWorkspaces();

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Submit New Content</h2>
        <p className="text-gray-600">Choose the type of content you want to submit for approval</p>
      </div>

      {/* Content Type Selector */}
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

      {/* Blog Post Form */}
      {submissionType === 'blog_post' && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Submit Blog Post</h3>
          
          {/* Workspace Selection */}
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

          {/* Title Input */}
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

          {/* Image Upload */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Featured Image (Optional)</label>
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
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

          {/* Rich Text Editor */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">Blog Post Content *</label>
            
            {/* Editor Toolbar */}
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

            {/* Editor Content Area */}
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

      {/* GBP Service Form */}
      {submissionType === 'gbp_service' && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">GBP Service</h3>
          <p className="text-gray-600">Google Business Profile service submission coming soon!</p>
        </div>
      )}
    </div>
  );
};

export default SubmitContent;
