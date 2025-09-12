import React from 'react';
import { FileText, Clock, Check, X, Filter } from 'lucide-react';
import SubmissionCard from './SubmissionCard';
import StatsCards from './StatsCards';
import FiltersBar from './FiltersBar';

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
  const filteredSubmissions = submissions;
  const accessibleWorkspaces = workspaces; // This would come from useSubmissions

  if (filteredSubmissions.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-400 mb-4">
          <FileText className="w-12 h-12 mx-auto" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No submissions found</h3>
        <p className="text-gray-600">
          {filterWorkspace === 'all' && filterType === 'all'
            ? 'No content has been submitted yet.' 
            : 'No submissions found matching the selected filters.'}
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Content Dashboard</h2>
        <p className="text-gray-600">Manage and review content submissions across workspaces</p>
      </div>

      <FiltersBar 
        filterWorkspace={filterWorkspace}
        setFilterWorkspace={setFilterWorkspace}
        filterType={filterType}
        setFilterType={setFilterType}
        workspaces={accessibleWorkspaces}
      />

      <StatsCards submissions={filteredSubmissions} />

      <div className="grid gap-6">
        {filteredSubmissions.map((submission) => (
          <SubmissionCard 
            key={submission.id}
            submission={submission}
            workspace={workspaces.find(w => w.id === submission.workspaceId)}
            author={users.find(u => u.id === submission.authorId)}
            onSelect={() => onSelectSubmission(submission)}
          />
        ))}
      </div>
    </div>
  );
};

export default Dashboard;
