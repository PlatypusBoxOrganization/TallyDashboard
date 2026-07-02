// src/components/SuperAdminUserEditor.jsx
// Component for super admin to edit any user
import React, { useState, useEffect } from 'react';
import { 
  getPermissionsByCategory,
  getUserPermissions,
  updateUserPermissions,
  updateUserRole,
  updateChildLimit,
  isSuperAdmin
} from '../services/permissionService';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import Modal from './Modal';

function SuperAdminUserEditor({ userId, userName, userRole, onUpdate, onClose }) {
  const [isOpen, setIsOpen] = useState(true);
  const [selectedPermissions, setSelectedPermissions] = useState([]);
  const [originalPermissions, setOriginalPermissions] = useState([]);
  const [availablePermissions, setAvailablePermissions] = useState({});
  const [currentRole, setCurrentRole] = useState(userRole || 'child');
  const [childLimit, setChildLimit] = useState(5);
  const [originalChildLimit, setOriginalChildLimit] = useState(5);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isCurrentUserSuperAdmin, setIsCurrentUserSuperAdmin] = useState(false);

  useEffect(() => {
    checkSuperAdminStatus();
    loadData();
  }, [userId]);

  const checkSuperAdminStatus = async () => {
    const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
    const isSA = await isSuperAdmin(currentUser.username);
    setIsCurrentUserSuperAdmin(isSA);
    
    if (!isSA) {
      setError('Only super admin can access this feature');
    }
  };

  const loadData = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Get user details
      const userDoc = await getDoc(doc(db, 'users', userId));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        setCurrentRole(userData.role || 'child');
        setChildLimit(userData.childLimit || 5);
        setOriginalChildLimit(userData.childLimit || 5);
      }
      
      // Get user's current permissions
      const userPerms = await getUserPermissions(userId);
      setSelectedPermissions(userPerms);
      setOriginalPermissions(userPerms);
      
      // Get all available permissions
      const permsByCategory = await getPermissionsByCategory();
      setAvailablePermissions(permsByCategory);
      
    } catch (err) {
      console.error('Error loading data:', err);
      setError('Failed to load user data');
    } finally {
      setLoading(false);
    }
  };

  const handlePermissionToggle = (permissionId) => {
    setSelectedPermissions(prev => {
      if (prev.includes(permissionId)) {
        return prev.filter(id => id !== permissionId);
      } else {
        return [...prev, permissionId];
      }
    });
  };

  const handleSelectAllInCategory = (category) => {
    const categoryPermIds = availablePermissions[category].map(p => p.id);
    const allSelected = categoryPermIds.every(id => selectedPermissions.includes(id));
    
    if (allSelected) {
      setSelectedPermissions(prev => prev.filter(id => !categoryPermIds.includes(id)));
    } else {
      setSelectedPermissions(prev => {
        const newPerms = [...prev];
        categoryPermIds.forEach(id => {
          if (!newPerms.includes(id)) {
            newPerms.push(id);
          }
        });
        return newPerms;
      });
    }
  };

  const handleSave = async () => {
    if (!isCurrentUserSuperAdmin) {
      setError('Only super admin can edit users');
      return;
    }

    try {
      setSaving(true);
      setError('');
      setSuccess('');
      
      const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
      const currentUserId = currentUser.username;
      
      // Update permissions if changed
      const permsChanged = JSON.stringify(selectedPermissions.sort()) !== 
                          JSON.stringify(originalPermissions.sort());
      if (permsChanged) {
        await updateUserPermissions(userId, selectedPermissions, currentUserId);
      }
      
      // Update role if changed
      if (currentRole !== userRole) {
        await updateUserRole(userId, currentRole, currentUserId);
      }
      
      // Update child limit if changed and user is parent
      if (currentRole === 'parent' && childLimit !== originalChildLimit) {
        await updateChildLimit(userId, childLimit, currentUserId);
      }
      
      setSuccess('User updated successfully!');
      setOriginalPermissions(selectedPermissions);
      setOriginalChildLimit(childLimit);
      
      if (onUpdate) {
        onUpdate();
      }
      
      setTimeout(() => {
        handleClose();
      }, 1500);
    } catch (err) {
      console.error('Error saving user:', err);
      setError(err.message || 'Failed to update user');
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    if (onClose) {
      onClose();
    }
  };

  const hasChanges = () => {
    const permsChanged = JSON.stringify(selectedPermissions.sort()) !== 
                        JSON.stringify(originalPermissions.sort());
    const roleChanged = currentRole !== userRole;
    const limitChanged = currentRole === 'parent' && childLimit !== originalChildLimit;
    
    return permsChanged || roleChanged || limitChanged;
  };

  if (!isCurrentUserSuperAdmin) {
    return null;
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={`Edit User - ${userName} (Super Admin)`}
    >
      <div className="px-5 py-4">
        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded text-sm">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded text-sm">
            {success}
          </div>
        )}

        {loading ? (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
            <p className="mt-2 text-gray-600">Loading user data...</p>
          </div>
        ) : (
          <>
            {/* Role Selection */}
            <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <label className="block text-sm font-medium mb-2">User Role</label>
              <select
                value={currentRole}
                onChange={(e) => setCurrentRole(e.target.value)}
                className="form-select w-full"
              >
                <option value="child">Child</option>
                <option value="parent">Parent</option>
                <option value="superadmin">Super Admin</option>
              </select>
              
              {/* Child Limit (only for parents) */}
              {currentRole === 'parent' && (
                <div className="mt-4">
                  <label className="block text-sm font-medium mb-2">
                    Child Limit
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="999"
                    value={childLimit}
                    onChange={(e) => setChildLimit(parseInt(e.target.value) || 0)}
                    className="form-input w-full"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Maximum number of children this parent can create
                  </p>
                </div>
              )}
            </div>

            {/* Permissions */}
            <div className="mb-4">
              <div className="flex justify-between items-center mb-3">
                <h4 className="font-medium text-gray-900 dark:text-gray-100">
                  Custom Permissions
                </h4>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Selected: <span className="font-medium">{selectedPermissions.length}</span>
                </div>
              </div>

              <div className="space-y-4 max-h-96 overflow-y-auto">
                {Object.entries(availablePermissions).map(([category, permissions]) => (
                  <div key={category} className="border border-gray-200 dark:border-gray-600 rounded-lg p-4">
                    <div className="flex justify-between items-center mb-3">
                      <h5 className="font-medium text-gray-900 dark:text-gray-100">
                        {category}
                      </h5>
                      <button
                        type="button"
                        onClick={() => handleSelectAllInCategory(category)}
                        className="text-xs text-indigo-600 hover:text-indigo-700 dark:text-indigo-400"
                      >
                        {permissions.every(p => selectedPermissions.includes(p.id)) ? 'Deselect All' : 'Select All'}
                      </button>
                    </div>
                    
                    <div className="space-y-2">
                      {permissions.map(permission => (
                        <label
                          key={permission.id}
                          className="flex items-start p-3 bg-gray-50 dark:bg-gray-700/50 rounded border border-gray-200 dark:border-gray-600 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
                        >
                          <input
                            type="checkbox"
                            checked={selectedPermissions.includes(permission.id)}
                            onChange={() => handlePermissionToggle(permission.id)}
                            className="form-checkbox h-5 w-5 text-indigo-500 mt-0.5"
                          />
                          <div className="ml-3 flex-1">
                            <div className="flex items-center justify-between">
                              <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                {permission.name}
                              </div>
                              {selectedPermissions.includes(permission.id) && (
                                <span className="text-xs px-2 py-0.5 bg-green-100 text-green-800 rounded">
                                  Enabled
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              {permission.description}
                            </div>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="mt-6 flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-600">
              <button
                onClick={handleClose}
                className="btn bg-gray-500 hover:bg-gray-600 text-white"
                disabled={saving}
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="btn bg-indigo-500 hover:bg-indigo-600 text-white"
                disabled={saving || !hasChanges()}
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
}

export default SuperAdminUserEditor;
