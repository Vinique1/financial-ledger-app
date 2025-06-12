// src/components/UserManagement.jsx
import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, getDocs, doc, updateDoc } from 'firebase/firestore';
import toast from 'react-hot-toast';
import ActionButton from './ActionButton';

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingUserId, setEditingUserId] = useState(null);
  const [selectedRole, setSelectedRole] = useState('');

  const roles = ['admin', 'sales_manager', 'expense_manager', 'inventory_manager', 'viewer'];

  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);
      try {
        const usersSnapshot = await getDocs(collection(db, 'user_profiles'));
        const usersList = usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setUsers(usersList);
      } catch (error) {
        console.error("Error fetching users:", error);
        toast.error("Failed to load user profiles.");
      }
      setLoading(false);
    };

    fetchUsers();
  }, []);

  const handleRoleChange = async (userId) => {
    if (!selectedRole) {
      toast.error("Please select a role.");
      return;
    }
    
    const userDocRef = doc(db, 'user_profiles', userId);
    try {
      await updateDoc(userDocRef, { role: selectedRole });
      toast.success("User role updated successfully. The user may need to re-login to see changes.");
      // Optimistically update local state
      setUsers(users.map(u => u.id === userId ? { ...u, role: selectedRole } : u));
      setEditingUserId(null);
      setSelectedRole('');
    } catch (error) {
      console.error("Error updating role:", error);
      toast.error("Failed to update user role.");
    }
  };

  if (loading) return <div>Loading users...</div>;

  return (
    <div className="bg-white p-6 rounded-xl shadow-md border border-gray-200">
      <h2 className="text-2xl font-bold text-gray-700 mb-4">User Management</h2>
      <table className="min-w-full bg-white">
        <thead>
          <tr>
            <th className="p-3 text-left">Email</th>
            <th className="p-3 text-left">Role</th>
            <th className="p-3 text-center">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {users.map(user => (
            <tr key={user.id}>
              <td className="p-3">{user.email}</td>
              <td className="p-3">
                {editingUserId === user.id ? (
                  <select
                    value={selectedRole}
                    onChange={(e) => setSelectedRole(e.target.value)}
                    className="p-2 border rounded"
                  >
                    {roles.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                ) : (
                  user.role
                )}
              </td>
              <td className="p-3 text-center space-x-2">
                {editingUserId === user.id ? (
                  <>
                    <ActionButton color="green" onClick={() => handleRoleChange(user.id)}>Save</ActionButton>
                    <ActionButton color="gray" onClick={() => setEditingUserId(null)}>Cancel</ActionButton>
                  </>
                ) : (
                  <ActionButton color="blue" onClick={() => {
                    setEditingUserId(user.id);
                    setSelectedRole(user.role);
                  }}>
                    Change Role
                  </ActionButton>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

