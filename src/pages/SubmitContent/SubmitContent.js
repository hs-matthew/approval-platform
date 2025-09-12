import React, { useState } from 'react';
import { FileText, MapPin } from 'lucide-react';
import BlogPostForm from './BlogPostForm';
import GBPServiceForm from './GBPServiceForm';

const SubmitContent = ({ workspaces, onSubmit }) => {
  const [submissionType, setSubmissionType] = useState('blog_post');

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Submit New Content</h2>
        <p className="text-gray-600">Choose the type of content you want to submit for approval</p>
      </div>

      {/* Content type selector */}
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

      {/* Form based on selected type */}
      {submissionType === 'blog_post' ? (
        <BlogPostForm workspaces={workspaces} onSubmit={onSubmit} />
      ) : (
        <GBPServiceForm workspaces={workspaces} onSubmit={onSubmit} />
      )}
    </div>
  );
};

export default SubmitContent;
