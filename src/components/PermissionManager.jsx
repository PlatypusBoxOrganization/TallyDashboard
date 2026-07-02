// src/components/PermissionManager.jsx
// Updated for permission collections system
import React, { useState, useEffect } from 'react';
import { 
  getUserPermissions, 
  updateUserPermissions,
  getPermissionsByCategory
} from '../services/permissionService';
import Modal from './Modal';

function PermissionManager({ userId, userName, onUpdate }) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedPermissions, setSelectedPermissions] = useState([]);
  const [originalPermissions, setOriginalPermissions] = useState([]);
  const [availablePermissions, setAvailablePermissions] = useState({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (isOpen) {
      loadPermissions();
    }
  }, [isOpen, userId]);

  const loadPermissions = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Get user's current permissions (array of IDs)
      const userPerms = await getUserPermissions(userId);
      setSelectedPermissions(userPerms);
      setOriginalPermissions(userPerms);
      
      // Get all available permissions grouped by category
      const permsByCategory = await getPermissionsByCategory();
      setAvailablePermissions(permsByCategory);
      
    } catch (err) {
      console.error('Error loading permissions:', err);
      setError('Failed to load permissions');
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
      // Deselect all in category
      setSelectedPermissions(prev => prev.filter(id => !categoryPermIds.includes(id)));
    } else {
      // Select all in category
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
    try {
      setSaving(true);
      setError('');
      setSuccess('');
      
      // Get current user from localStorage
      const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
      const currentUserId = currentUser.username;
      
      await updateUserPermissions(userId, selectedPermissions, currentUserId);
      
      setSuccess('Permissions updated successfully!');
      setOriginalPermissions(selectedPermissions);
      
      if (onUpdate) {
        onUpdate();
      }
      
      setTimeout(() => {
        setIsOpen(false);
        setSuccess('');
      }, 1500);
    } catch (err) {
      console.error('Error saving permissions:', err);
      setError(err.message || 'Failed to update permissions');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setSelectedPermissions(originalPermissions);
    setError('');
    setSuccess('');
    setIsOpen(false);
  };

  const hasChanges = () => {
    return JSON.stringify(selectedPermissions.sort()) !== JSON.stringify(originalPermissions.sort());
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="btn-sm bg-blue-500 hover:bg-blue-600 text-white w-full"
      >
        Manage Permissions
      </button>

      <Modal
        isOpen={isOpen}
        onClose={handleCancel}
        title={`Manage Permissions - ${userName}`}
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
              <p className="mt-2 text-gray-600">Loading permissions...</p>
            </div>
          ) : (
            <>
              <div className="mb-4">
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Selected: <span className="font-medium">{selectedPermissions.length}</span> permissions
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
                          className="flex items-start p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                        >
                          <input
                            type="checkbox"
                            checked={selectedPermissions.includes(permission.id)}
                            onChange={() => handlePermissionToggle(permission.id)}
                            className="form-checkbox h-5 w-5 text-indigo-500 rounded focus:ring-indigo-500 mt-0.5"
                          />
                          <div className="ml-3 flex-1">
                            <div className="flex items-center justify-between">
                              <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                {permission.name}
                              </div>
                              {selectedPermissions.includes(permission.id) ? (
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                                  Enabled
                                </span>
                              ) : (
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">
                                  Disabled
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                              {permission.description}
                            </div>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-600">
                <button
                  onClick={handleCancel}
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
    </>
  );
}

export default PermissionManager;
