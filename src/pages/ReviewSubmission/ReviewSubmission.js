// pages/ReviewSubmission/ReviewSubmission.js
import React from 'react';
import { ArrowLeft, Check, X, MessageSquare, FileText, MapPin, Calendar, User, Building } from 'lucide-react';

const ReviewSubmission = ({ 
  submission, 
  workspace, 
  author, 
  feedback, 
  onFeedbackChange, 
  onApprove, 
  onReject, 
  onBack 
}) => {
  if (!submission) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="text-center py-12">
          <h3 className="text-lg font-medium text-gray-900 mb-2">No submission selected</h3>
          <p className="text-gray-600">Please select a submission to review.</p>
        </div>
      </div>
    );
  }

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
      default: return <FileText className="w-4 h-4" />;
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

  const reviewStyles = `
    table { border-collapse: collapse; width: 100%; margin: 1rem 0; }
    th, td { border: 1px solid #d1d5db; padding: 0.5rem; text-align: left; }
    th { background-color: #f3f4f6; font-weight: 600; }
    ul { list-style-type: disc; margin-left: 1.5rem; margin: 1rem 0; }
    li { margin: 0.5rem 0; }
    h1, h2, h3 { margin: 1.5rem 0 1rem 0; font-weight: 600; }
    h1 { font-size: 2rem; }
    h2 { font-size: 1.5rem; }
    h3 { font-size: 1.25rem; }
    p { margin: 1rem 0; }
  `;

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="mb-6">
        <button 
          onClick={onBack}
          className="text-blue-600 hover:text-blue-800 flex items-center gap-2 mb-4 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </button>
        
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              {getTypeIcon(submission.type)}
              <h2 className="text-2xl font-bold text-gray-900">
                Review {getTypeLabel(submission.type)}
              </h2>
            </div>
            <div className="flex items-center gap-4 text-sm text-gray-600">
              <div className="flex items-center gap-1">
                <Building className="w-4 h-4" />
                <span>Workspace: {workspace ? workspace.name : 'Unknown'}</span>
              </div>
              <div className="flex items-center gap-1">
                <User className="w-4 h-4" />
                <span>By {author ? author.name : 'Unknown'}</span>
              </div>
              <div className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                <span>Submitted {formatDate(submission.submittedAt)}</span>
              </div>
            </div>
          </div>
          
          <div className={`px-3 py-1 rounded-full text-sm font-medium flex items-center gap-2 ${getStatusColor(submission.status)}`}>
            {getStatusIcon(submission.status)}
            {submission.status.charAt(0).toUpperCase() + submission.status.slice(1)}
          </div>
        </div>
      </div>

      {/* Content Preview */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <div className="mb-4">
          <h3 className="text-xl font-bold text-gray-900 mb-2">{submission.title}</h3>
        </div>
        
        {submission.type === 'blog_post' && (
          <>
            {/* Featured Image */}
            {submission.image && (
              <div className="mb-6">
                <img 
                  src={submission.image} 
                  alt="Featured" 
                  className="max-w-full h-64 object-cover rounded-md border border-gray-300"
                />
              </div>
            )}

            {/* Blog Content */}
            <div className="prose prose-lg max-w-none">
              <style dangerouslySetInnerHTML={{ __html: reviewStyles }} />
              <div 
                className="text-gray-800 leading-relaxed prose-headings:text-gray-900 prose-links:text-blue-600 prose-strong:text-gray-900"
                dangerouslySetInnerHTML={{ 
                  __html: submission.content
                    .replace(/&lt;/g, '<')
                    .replace(/&gt;/g, '>')
                    .replace(/&amp;/g, '&')
                    .replace(/&quot;/g, '"')
                    .replace(/&#39;/g, "'")
                    .replace(/&nbsp;/g, ' ')
                }}
                style={{
                  lineHeight: '1.7',
                  fontSize: '16px'
                }}
              />
            </div>
          </>
        )}

        {submission.type === 'gbp_service' && (
          <div className="space-y-4">
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">Business Information</h4>
              <p><strong>Business Name:</strong> {submission.businessName || 'Not specified'}</p>
              <p><strong>Category:</strong> {submission.serviceCategory || 'Not specified'}</p>
              {submission.phone && <p><strong>Phone:</strong> {submission.phone}</p>}
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">Service Description</h4>
              <p className="text-gray-700">{submission.description || 'No description provided'}</p>
            </div>
            {submission.pricing && (
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Pricing</h4>
                <p><strong>Pricing:</strong> {submission.pricing}</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Review Actions */}
      {submission.status === 'pending' && (
        <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
          <h4 className="text-lg font-semibold text-gray-900 mb-4">Review Decision</h4>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Feedback (Optional for approval, required for rejection)
            </label>
            <textarea
              value={feedback}
              onChange={(e) => onFeedbackChange(e.target.value)}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Provide feedback for the author..."
            />
          </div>

          <div className="flex gap-4">
            <button
              onClick={() => onApprove(submission.id)}
              className="bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700 transition-colors flex items-center gap-2"
            >
              <Check className="w-4 h-4" />
              Approve
            </button>
            <button
              onClick={() => onReject(submission.id)}
              className="bg-red-600 text-white px-6 py-2 rounded-md hover:bg-red-700 transition-colors flex items-center gap-2"
            >
              <X className="w-4 h-4" />
              Reject
            </button>
          </div>
        </div>
      )}

      {/* Existing Feedback */}
      {submission.feedback && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h5 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
            <MessageSquare className="w-4 h-4" />
            Reviewer Feedback
          </h5>
          <p className="text-blue-800">{submission.feedback}</p>
        </div>
      )}
    </div>
  );
};

export default ReviewSubmission;
