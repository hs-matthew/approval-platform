import { useState } from 'react';
import { useFirestore } from './useFirestore';
import { useAuth } from './useAuth';

export const useSubmissions = (workspaces) => {
  const { currentUser } = useAuth();
  const { data: submissions, loading, addItem: addSubmission } = useFirestore('submissions');
  const [filterWorkspace, setFilterWorkspace] = useState('all');
  const [filterType, setFilterType] = useState('all');

  const getAccessibleWorkspaces = () => {
    if (currentUser.role === 'admin') return workspaces;
    if (currentUser.role === 'client') return workspaces.filter(ws => ws.clientId === currentUser.id);
    if (currentUser.role === 'writer') return workspaces.filter(ws => ws.writers?.includes(currentUser.id));
    return [];
  };

  const getFilteredSubmissions = () => {
    let filtered = submissions;
    
    // Role-based filtering
    if (currentUser.role === 'client') {
      const userWorkspaces = workspaces.filter(ws => ws.clientId === currentUser.id);
      filtered = filtered.filter(sub => userWorkspaces.some(ws => ws.id === sub.workspaceId));
    } else if (currentUser.role === 'writer') {
      const userWorkspaces = workspaces.filter(ws => ws.writers?.includes(currentUser.id));
      filtered = filtered.filter(sub => 
        userWorkspaces.some(ws => ws.id === sub.workspaceId) || sub.authorId === currentUser.id
      );
    }
    
    // Workspace filter
    if (filterWorkspace !== 'all') {
      filtered = filtered.filter(sub => String(sub.workspaceId) === String(filterWorkspace));
    }

    // Type filter
    if (filterType !== 'all') {
      filtered = filtered.filter(sub => sub.type === filterType);
    }
    
    return filtered;
  };

  const updateSubmission = (id, updates) => {
    // This would typically update Firebase, but for now just local state
    // setSubmissions(prev => prev.map(sub => 
    //   sub.id === id ? { ...sub, ...updates } : sub
    // ));
  };

  return {
    submissions: getFilteredSubmissions(),
    loading,
    addSubmission,
    updateSubmission,
    getAccessibleWorkspaces,
    filterWorkspace,
    setFilterWorkspace,
    filterType,
    setFilterType
  };
};
