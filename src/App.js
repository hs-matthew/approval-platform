import React, { useState } from 'react';
import Navigation from './components/layout/Navigation';
import Footer from './components/layout/Footer';
import Dashboard from './pages/Dashboard/Dashboard';
import SubmitContent from './pages/SubmitContent/SubmitContent';
import ManageWorkspaces from './pages/ManageWorkspaces/ManageWorkspaces';
import ManageUsers from './pages/ManageUsers/ManageUsers';
import ReviewSubmission from './pages/ReviewSubmission/ReviewSubmission';

// Custom hooks
import { useAuth } from './hooks/useAuth';
import { useFirestore } from './hooks/useFirestore';
import { useSubmissions } from './hooks/useSubmissions';
import FirebaseTest from './test';

function App() {
  // Early return for Firebase test
  return (
    <div>
      <FirebaseTest />
    </div>
  );
}

const ApprovalPlatform = () => {
  const { currentUser } = useAuth();
  const [currentView, setCurrentView] = useState('dashboard');
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [feedback, setFeedback] = useState('');

  // Data from custom hooks
  const { data: users, addItem: addUser } = useFirestore('users');
  const { data: workspaces, addItem: addWorkspace } = useFirestore('workspaces');
  const { 
    submissions, 
    addSubmission, 
    updateSubmission,
    filterWorkspace,
    setFilterWorkspace,
    filterType,
    setFilterType
  } = useSubmissions(workspaces);

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

  const renderCurrentView = () => {
    switch (currentView) {
      case 'submit':
        return (
          <SubmitContent 
            workspaces={workspaces}
            onSubmit={addSubmission}
          />
        );
      case 'workspaces':
        return (
          <ManageWorkspaces 
            workspaces={workspaces}
            onAddWorkspace={addWorkspace}
          />
        );
      case 'users':
        return (
          <ManageUsers 
            users={users}
            onAddUser={addUser}
          />
        );
      case 'review':
        return (
          <ReviewSubmission 
            submission={selectedSubmission}
            workspace={workspaces.find(w => w.id === selectedSubmission?.workspaceId)}
            author={users.find(u => u.id === selectedSubmission?.authorId)}
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
            filterWorkspace={filterWorkspace}
            setFilterWorkspace={setFilterWorkspace}
            filterType={filterType}
            setFilterType={setFilterType}
            onSelectSubmission={handleSelectSubmission}
          />
        );
    }
  };

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

export default ApprovalPlatform;
