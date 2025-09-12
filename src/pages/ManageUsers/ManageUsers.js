import React, { useState } from 'react';
import { UserPlus, Users, Shield, Edit, Mail, AlertCircle, CheckCircle } from 'lucide-react';
  
const UserForm = ({ 
  users = [], 
  onAddUser = () => {}, 
  onCancel = null,
  className = "",
  showTitle = true 
}) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'writer'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});
  const [showSuccess, setShowSuccess] = useState(false);

  // Validation function
  const validateForm = () => {
    const errors = {};
    
    // Name validation
    if (!formData.name.trim()) {
      errors.name = 'Full name is required';
    } else if (formData.name.trim().length < 2) {
      errors.name = 'Name must be at least 2 characters long';
    } else if (formData.name.trim().length > 50) {
      errors.name = 'Name must be less than 50 characters';
    }
    
    // Email validation
    if (!formData.email.trim()) {
      errors.email = 'Email address is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Please enter a valid email address';
    } else if (users.find(user => user.email.toLowerCase() === formData.email.toLowerCase())) {
      errors.email = 'A user with this email already exists';
    }
    
    // Role validation
    if (!['writer', 'client', 'admin'].includes(formData.role)) {
      errors.role = 'Please select a valid role';
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    
    try {
      const userData = {
        ...formData,
        name: formData.name.trim(),
        email: formData.email.toLowerCase().trim(),
        createdAt: new Date().toISOString(),
        isActive: true,
        lastLogin: null,
        createdBy: 'system' // You can replace this with current user ID
      };
      
      await onAddUser(userData);
      
      // Success - clear form and show success message
      setFormData({ name: '', email: '', role: 'writer' });
      setValidationErrors({});
      setShowSuccess(true);
      
      // Hide success message after 3 seconds
      setTimeout(() => setShowSuccess(false), 3000);
      
    } catch (error) {
      console.error('Error creating user:', error);
      
      // Handle specific Firebase errors
      if (error.code === 'auth/email-already-in-use') {
        setValidationErrors({ email: 'This email is already registered' });
      } else if (error.code === 'auth/invalid-email') {
        setValidationErrors({ email: 'Invalid email format' });
      } else if (error.code === 'auth/weak-password') {
        setValidationErrors({ password: 'Password is too weak' });
      } else {
        // Generic error
        setValidationErrors({ 
          submit: 'Failed to create user. Please try again.' 
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle input changes with real-time validation clearing
  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear validation error for this field when user starts typing
    if (validationErrors[field]) {
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
    
    // Clear success message when user starts editing again
    if (showSuccess) {
      setShowSuccess(false);
    }
  };

  // Get role icon
  const getRoleIcon = (role) => {
    switch (role) {
      case 'admin':
        return <Shield className="w-4 h-4" />;
      case 'client':
        return <Users className="w-4 h-4" />;
      case 'writer':
        return <Edit className="w-4 h-4" />;
      default:
        return <Users className="w-4 h-4" />;
    }
  };

  // Get role description
  const getRoleDescription = (role) => {
    switch (role) {
      case 'admin':
        return 'Full access to all features and data';
      case 'client':
        return 'Can approve/reject content in their workspaces';
      case 'writer':
        return 'Can submit content to assigned workspaces';
      default:
        return '';
    }
  };

  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 p-6 ${className}`}>
      {showTitle && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-2 flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-blue-600" />
            Add New User
          </h3>
          <p className="text-sm text-gray-600">
            Create a new user account with appropriate role and permissions
          </p>
        </div>
      )}

      {/* Success Message */}
      {showSuccess && (
        <div className="mb-6 p-4 bg-green-50 border-2 border-green-300 rounded-lg flex items-center gap-3 shadow-md">
          <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0" />
          <div>
            <h4 className="text-base font-semibold text-green-800">🎉 User Created Successfully!</h4>
            <p className="text-sm text-green-700 mt-1">
              The new user has been added to the platform and can now access the system.
            </p>
          </div>
          <button 
            onClick={() => setShowSuccess(false)}
            className="ml-auto text-green-600 hover:text-green-800 p-1"
            aria-label="Close success message"
          >
            ✕
          </button>
        </div>
      )}

      {/* General Error Message */}
      {validationErrors.submit && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
          <div>
            <h4 className="text-sm font-medium text-red-800">Error</h4>
            <p className="text-sm text-red-600">{validationErrors.submit}</p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Full Name Field */}
        <div>
          <label htmlFor="user-name" className="block text-sm font-medium text-gray-700 mb-2">
            Full Name *
          </label>
          <input
            id="user-name"
            type="text"
            value={formData.name}
            onChange={(e) => handleInputChange('name', e.target.value)}
            placeholder="Enter the user's full name"
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${
              validationErrors.name 
                ? 'border-red-300 focus:ring-red-500' 
                : 'border-gray-300'
            }`}
            disabled={isSubmitting}
            maxLength={50}
          />
          {validationErrors.name && (
            <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
              <AlertCircle className="w-4 h-4" />
              {validationErrors.name}
            </p>
          )}
        </div>

        {/* Email Field */}
        <div>
          <label htmlFor="user-email" className="block text-sm font-medium text-gray-700 mb-2">
            Email Address *
          </label>
          <input
            id="user-email"
            type="email"
            value={formData.email}
            onChange={(e) => handleInputChange('email', e.target.value)}
            placeholder="Enter the user's email address"
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${
              validationErrors.email 
                ? 'border-red-300 focus:ring-red-500' 
                : 'border-gray-300'
            }`}
            disabled={isSubmitting}
          />
          {validationErrors.email && (
            <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
              <AlertCircle className="w-4 h-4" />
              {validationErrors.email}
            </p>
          )}
          <p className="mt-1 text-xs text-gray-500">
            This will be used for login and notifications
          </p>
        </div>

        {/* Role Selection */}
        <div>
          <label htmlFor="user-role" className="block text-sm font-medium text-gray-700 mb-2">
            User Role *
          </label>
          <select
            id="user-role"
            value={formData.role}
            onChange={(e) => handleInputChange('role', e.target.value)}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${
              validationErrors.role 
                ? 'border-red-300 focus:ring-red-500' 
                : 'border-gray-300'
            }`}
            disabled={isSubmitting}
          >
            <option value="writer">Writer</option>
            <option value="client">Client</option>
            <option value="admin">Admin</option>
          </select>
          
          {/* Role Description */}
          <div className="mt-2 p-3 bg-gray-50 rounded-md border border-gray-200">
            <div className="flex items-center gap-2 mb-1">
              {getRoleIcon(formData.role)}
              <span className="text-sm font-medium text-gray-900 capitalize">
                {formData.role}
              </span>
            </div>
            <p className="text-xs text-gray-600">
              {getRoleDescription(formData.role)}
            </p>
          </div>
          
          {validationErrors.role && (
            <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
              <AlertCircle className="w-4 h-4" />
              {validationErrors.role}
            </p>
          )}
        </div>

        {/* Form Actions */}
        <div className="flex items-center gap-3 pt-4 border-t border-gray-200">
          <button
            type="submit"
            disabled={isSubmitting}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-md text-white font-medium transition-all duration-200 ${
              isSubmitting 
                ? 'bg-gray-400 cursor-not-allowed' 
                : 'bg-blue-600 hover:bg-blue-700 focus:ring-4 focus:ring-blue-200'
            }`}
          >
            <UserPlus className="w-4 h-4" />
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Creating User...
              </>
            ) : (
              'Create User'
            )}
          </button>

          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              disabled={isSubmitting}
              className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 font-medium transition-colors"
            >
              Cancel
            </button>
          )}

          {/* Form Status Indicator */}
          <div className="flex items-center gap-2 text-xs text-gray-500 ml-auto">
            {Object.keys(validationErrors).length > 0 && (
              <span className="text-red-600">
                {Object.keys(validationErrors).length} error(s)
              </span>
            )}
            <span>* Required fields</span>
          </div>
        </div>
      </form>

      {/* Usage Tips */}
      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h4 className="text-sm font-medium text-blue-900 mb-2 flex items-center gap-2">
          <Mail className="w-4 h-4" />
          Next Steps
        </h4>
        <ul className="text-xs text-blue-800 space-y-1">
          <li>• The new user will receive an email with login instructions</li>
          <li>• Assign workspaces to writers and clients after creation</li>
          <li>• Users can update their profiles after first login</li>
        </ul>
      </div>
    </div>
  );
};

export default UserForm;
