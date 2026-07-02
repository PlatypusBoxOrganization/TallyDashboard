// src/components/ChildUserForm.jsx
// Updated for permission collections system
import React, { useState, useEffect } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { canCreateChild, incrementChildCount } from '../services/roleService';
import { 
  getAllAvailablePermissions, 
  getRolePermissions,
  getPermissionsByCategory 
} from '../services/permissionService';

function ChildUserForm({ parentId, onSuccess, onCancel }) {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    username: '',
    password: '',
    mobileNumber: '',
    deviceId: ''
  });

  const [selectedPermissions, setSelectedPermissions] = useState([]);
  const [availablePermissions, setAvailablePermissions] = useState({});
  const [defaultChildPermissions, setDefaultChildPermissions] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingPermissions, setLoadingPermissions] = useState(true);
  const [usernameAvailable, setUsernameAvailable] = useState(null);
  const [canCreate, setCanCreate] = useState({ canCreate: false, currentCount: 0, limit: 0 });

  useEffect(() => {
    checkCreatePermission();
    loadPermissions();
  }, [parentId]);

  const checkCreatePermission = async () => {
    try {
      const result = await canCreateChild(parentId);
      setCanCreate(result);
      if (!result.canCreate) {
        setError(`Child limit reached (${result.currentCount}/${result.limit}). Cannot create more children.`);
      }
    } catch (err) {
      console.error('Error checking create permission:', err);
      setError('Failed to check child creation permission');
    }
  };

  const loadPermissions = async () => {
    try {
      setLoadingPermissions(true);
      
      // Get all available permissions grouped by category
      const permsByCategory = await getPermissionsByCategory();
      setAvailablePermissions(permsByCategory);
      
      // Get default permissions for child role
      const defaultPerms = await getRolePermissions('child');
      setDefaultChildPermissions(defaultPerms);
      setSelectedPermissions(defaultPerms); // Pre-select defaults
      
    } catch (err) {
      console.error('Error loading permissions:', err);
      setError('Failed to load permissions');
    } finally {
      setLoadingPermissions(false);
    }
  };

  const checkUsername = async (username) => {
    if (!username) {
      setUsernameAvailable(null);
      return;
    }

    try {
      const usernameCaps = username.trim().toUpperCase();
      const ref = doc(db, 'users', usernameCaps);
      const snap = await getDoc(ref);
      setUsernameAvailable(!snap.exists());
    } catch (err) {
      console.error('Error checking username:', err);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    if (name === 'username') {
      checkUsername(value);
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

  const handleResetToDefaults = () => {
    setSelectedPermissions(defaultChildPermissions);
  };

  async function hashPassword(password) {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(hashBuffer))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!canCreate.canCreate) {
      setError(`Child limit reached (${canCreate.currentCount}/${canCreate.limit})`);
      return;
    }

    if (!usernameAvailable) {
      setError('Username is not available');
      return;
    }

    if (selectedPermissions.length === 0) {
      setError('Please select at least one permission');
      return;
    }

    try {
      setLoading(true);
      const usernameCaps = formData.username.trim().toUpperCase();
      const userRef = doc(db, 'users', usernameCaps);

      // Double-check username availability
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        setError('Username already exists');
        return;
      }

      // Hash password
      const passwordHash = await hashPassword(formData.password);

      // Create child user
      await setDoc(userRef, {
        fullName: formData.fullName,
        email: formData.email,
        username: usernameCaps,
        mobileNumber: formData.mobileNumber || '',
        deviceId: formData.deviceId || '',
        passwordHash,
        createdAt: new Date().toISOString(),
        status: 'active',
        role: 'child',
        parentId: parentId,
        customPermissions: selectedPermissions, // Array of permission IDs
        createdBy: parentId,
        expirationDate: null
      });

      // Increment parent's child count
      await incrementChildCount(parentId);

      setSuccess('Child user created successfully!');
      
      // Reset form
      setFormData({
        fullName: '',
        email: '',
        username: '',
        password: '',
        mobileNumber: '',
        deviceId: ''
      });
      setSelectedPermissions(defaultChildPermissions);
      setUsernameAvailable(null);

      // Call success callback
      if (onSuccess) {
        setTimeout(() => {
          onSuccess();
        }, 1500);
      }

    } catch (err) {
      console.error('Error creating child user:', err);
      setError(err.message || 'Failed to create child user');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 shadow-lg rounded-sm border border-gray-200 dark:border-gray-700 p-6">
      <div className="mb-4">
        <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100">
          Create Child User
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
          Children: {canCreate.currentCount} / {canCreate.limit}
        </p>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded">
          {success}
        </div>
      )}

      {!canCreate.canCreate && !success ? (
        <div className="text-center py-4">
          <button
            onClick={onCancel}
            className="btn bg-gray-500 hover:bg-gray-600 text-white"
          >
            Close
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit}>
          {/* User Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {/* Full Name */}
            <div>
              <label className="block text-sm font-medium mb-1">
                Full Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="fullName"
                value={formData.fullName}
                onChange={handleChange}
                className="form-input w-full"
                required
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium mb-1">
                Email <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="form-input w-full"
                required
              />
            </div>

            {/* Username */}
            <div>
              <label className="block text-sm font-medium mb-1">
                Username <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleChange}
                className="form-input w-full"
                required
              />
              {formData.username && (
                <div className="text-sm mt-1">
                  {usernameAvailable === null ? null : usernameAvailable ? (
                    <span className="text-green-600">✓ Username available</span>
                  ) : (
                    <span className="text-red-600">✗ Username taken</span>
                  )}
                </div>
              )}
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium mb-1">
                Password <span className="text-red-500">*</span>
              </label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className="form-input w-full"
                required
                minLength="6"
              />
            </div>

            {/* Mobile Number */}
            <div>
              <label className="block text-sm font-medium mb-1">
                Mobile Number
              </label>
              <input
                type="tel"
                name="mobileNumber"
                value={formData.mobileNumber}
                onChange={handleChange}
                className="form-input w-full"
              />
            </div>

            {/* Device ID */}
            <div>
              <label className="block text-sm font-medium mb-1">
                Device ID (Optional)
              </label>
              <input
                type="text"
                name="deviceId"
                value={formData.deviceId}
                onChange={handleChange}
                className="form-input w-full"
              />
            </div>
          </div>

          {/* Permissions Section */}
          <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
            <div className="flex justify-between items-center mb-4">
              <h4 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
                Permissions
              </h4>
              <button
                type="button"
                onClick={handleResetToDefaults}
                className="text-sm text-indigo-600 hover:text-indigo-700 dark:text-indigo-400"
              >
                Reset to Defaults
              </button>
            </div>

            {loadingPermissions ? (
              <div className="text-center py-4">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
                <p className="mt-2 text-gray-600">Loading permissions...</p>
              </div>
            ) : (
              <div className="space-y-4">
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
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
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
                          <div className="ml-3">
                            <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                              {permission.name}
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
            )}

            <div className="mt-3 text-sm text-gray-600 dark:text-gray-400">
              Selected: {selectedPermissions.length} permission{selectedPermissions.length !== 1 ? 's' : ''}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 mt-6">
            <button
              type="button"
              onClick={onCancel}
              className="btn bg-gray-500 hover:bg-gray-600 text-white"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn bg-indigo-500 hover:bg-indigo-600 text-white"
              disabled={loading || !usernameAvailable || selectedPermissions.length === 0}
            >
              {loading ? 'Creating...' : 'Create Child User'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

export default ChildUserForm;
