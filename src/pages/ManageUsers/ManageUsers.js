import React, { useState } from 'react';
import { collection, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../../firebase'; // Adjust path to your firebase config
import UserForm from './UserForm';

const ManageUsers = ({ users, onAddUser }) => {
  const [editingUser, setEditingUser] = useState(null);

  // Handle adding a new user (your existing function)
  const handleAddUser = async (userData) => {
    try {
      // Add to Firestore
      const docRef = await addDoc(collection(db, 'users'), userData);
      
      // Call the parent component's onAddUser to update the UI
      if (onAddUser) {
        onAddUser({ id: docRef.id, ...userData });
      }
      
      console.log('User added with ID:', docRef.id);
    } catch (error) {
      console.error('Error adding user:', error);
      throw error; // Let UserForm handle the error display
    }
  };

  // Handle editing a user
  const handleEditUser = (user) => {
    setEditingUser(user);
  };

  // Handle updating a user
  const handleUpdateUser = async (userId, userData) => {
    try {
      // Update in Firestore
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        ...userData,
        updatedAt: new Date().toISOString()
      });
      
      // Update local state - you'll need to implement this in your parent component
      // or reload the users list from Firebase
      
      console.log('User updated:', userId);
      
      // Exit edit mode
      setEditingUser(null);
      
      // Optional: Refresh the page or trigger a reload of users
      window.location.reload(); // Simple approach, or implement proper state management
      
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  };

  // Handle deleting a user
  const handleDeleteUser = async (userId) => {
    try {
      // Delete from Firestore
      await deleteDoc(doc(db, 'users', userId));
      
      console.log('User deleted:', userId);
      
      // Optional: Refresh the page or trigger a reload of users
      window.location.reload(); // Simple approach, or implement proper state management
      
    } catch (error) {
      console.error('Error deleting user:', error);
      throw error;
    }
  };

  // Handle canceling edit mode
  const handleCancelEdit = () => {
    setEditingUser(null);
  };

  return (
    <UserForm 
      users={users}
      onAddUser={handleAddUser}
      onUpdateUser={handleUpdateUser}
      onDeleteUser={handleDeleteUser}
      editingUser={editingUser}
      onCancel={editingUser ? handleCancelEdit : handleEditUser} // Pass handleEditUser for the edit button
    />
  );
};

export default ManageUsers;
