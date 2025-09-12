import React, { useState } from 'react';
import Navigation from './components/layout/Navigation';
import Footer from './components/layout/Footer';
import Dashboard from './pages/Dashboard/Dashboard';
import SubmitContent from './pages/SubmitContent/SubmitContent';
import ManageWorkspaces from './pages/ManageWorkspaces/ManageWorkspaces';
import ManageUsers from './pages/ManageUsers/ManageUsers';
import UserForm from './pages/ManageUsers/UserForm'; // ✅ ADDED: Import UserForm from ManageUsers folder
import ReviewSubmission from './pages/ReviewSubmission/ReviewSubmission';

// Custom hooks
import { useAuth } from './hooks/useAuth';
import { useFirestore } from './hooks/useFirestore';
import { useSubmissions } from './hooks/useSubmissions';

// Uncomment this line for Firebase testing
// import FirebaseTest from './test';

function App() {
  // ✅ FIXED: Return the actual ApprovalPlatform instead of FirebaseTest
  return <ApprovalPlatform />;
  
  // 🔧 For Firebase testing only - comment out the line above and uncomment below
  // return <FirebaseTest />;
}

const ApprovalPlatform = () => {
  const { currentUser } = useAuth();
  const [currentView, setCurrentView] = useState('dashboard');
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [feedback, setFeedback] = useState('');

  // Data from custom hooks
  const { data: users, addItem: addUser, loading: usersLoading } = useFirestore('users');
  const { data: workspaces, addItem: addWorkspace, loading: workspacesLoading } = useFirestore('workspaces');
  const { 
    submissions, 
    addSubmission, 
    updateSubmission,
    filterWorkspace,
    setFilterWorkspace,
    filterType,
    setFilterType,
    loading: submissionsLoading
  } = useSubmissions(workspaces);

  // Loading state while data is being fetched
  const isLoading = usersLoading || workspacesLoading || submissionsLoading;

  const handleSelectSubmission = (submission) => {
    setSelectedSubmission(submission);
    setCurrentView('review');
    setFeedback('');
  };

  const handleApprove = (id) => {
    updateSubmission(id, { 
      status: 'approved', 
      feedback, 
      approvedAt: new Date().toISOString() 
    });
    setFeedback('');
    setCurrentView('dashboard');
  };

  const handleReject = (id) => {
    if (!feedback.trim()) {
      alert('Please provide feedback when rejecting a submission.');
      return;
    }
    updateSubmission(id, { 
      status: 'rejected', 
      feedback, 
      rejectedAt: new Date().toISOString() 
    });
    setFeedback('');
    setCurrentView('dashboard');
  };

  // Enhanced user management with better error handling
  const handleAddUser = async (userData) => {
    try {
      console.log('App.js - Adding user:', userData);
      const result = await addUser(userData);
      console.log('App.js - User added successfully:', result);
      return result;
    } catch (error) {
      console.error('App.js - Error adding user:', error);
      
      // Re-throw the error so UserForm can handle it with proper user feedback
      throw error;
    }
  };

  const renderCurrentView = () => {
    // Show loading state while data is being fetched
    if (isLoading) {
      return (
        <div className="max-w-4xl mx-auto p-6">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Loading...</h3>
            <p className="text-gray-600">Fetching data from Firebase...</p>
          </div>
        </div>
      );
    }

    switch (currentView) {
      case 'submit':
        return (
          <SubmitContent 
            workspaces={workspaces}
            currentUser={currentUser} // ✅ FIXED: Pass currentUser explicitly
            onSubmit={addSubmission}
          />
        );
      case 'workspaces':
        return (
          <ManageWorkspaces 
            workspaces={workspaces}
            currentUser={currentUser} // ✅ FIXED: Pass currentUser for workspace creation
            onAddWorkspace={addWorkspace}
          />
        );

// In App.js, add this right before your renderCurrentView():
console.log('🔍 USERS ARRAY DETAILS:');
console.log('- users variable:', users);
console.log('- users type:', typeof users);
console.log('- users is array:', Array.isArray(users));
console.log('- users actual data:', JSON.stringify(users, null, 2));
        
      case 'users':
        return (
          <ManageUsers 
            users={users} // ✅ FIXED: Make sure users array is properly passed
            currentUser={currentUser} // ✅ FIXED: Pass currentUser for context
            onAddUser={handleAddUser} // ✅ ENHANCED: Use enhanced handler with better error handling
          />
        );
      case 'review':
        return (
          <ReviewSubmission 
            submission={selectedSubmission}
            workspace={workspaces.find(w => w.id === selectedSubmission?.workspaceId)}
            author={users.find(u => u.id === selectedSubmission?.authorId)}
            currentUser={currentUser} // ✅ FIXED: Pass currentUser for review permissions
            feedback={feedback}
            onFeedbackChange={setFeedback}
            onApprove={handleApprove}
            onReject={handleReject}
            onBack={() => setCurrentView('dashboard')}
          />
        );
      default:
        return (
          <Dashboard 
            submissions={submissions}
            workspaces={workspaces}
            users={users}
            currentUser={currentUser} // ✅ FIXED: Pass currentUser for role-based filtering
            filterWorkspace={filterWorkspace}
            setFilterWorkspace={setFilterWorkspace}
            filterType={filterType}
            setFilterType={setFilterType}
            onSelectSubmission={handleSelectSubmission}
          />
        );
    }
  };

  // Debug logging (remove in production)
  console.log('App.js - Current data state:', {
    currentUser,
    usersCount: users?.length || 0,
    workspacesCount: workspaces?.length || 0,
    submissionsCount: submissions?.length || 0,
    currentView,
    isLoading
  });

  return (
    <div className="min-h-screen bg-gray-100">
      <Navigation 
        currentView={currentView}
        onViewChange={setCurrentView}
        currentUser={currentUser}
      />
      {renderCurrentView()}
      <Footer />
    </div>
  );
};

export default App;
