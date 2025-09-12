import { useState } from 'react';

export const useAuth = () => {
  const [currentUser] = useState({
    id: 1,
    name: "Admin User",
    email: "admin@company.com",
    role: "admin"
  });

  return {
    currentUser,
    isAdmin: currentUser.role === 'admin',
    isClient: currentUser.role === 'client',
    isWriter: currentUser.role === 'writer'
  };
};
