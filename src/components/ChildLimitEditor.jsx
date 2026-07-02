// src/components/ChildLimitEditor.jsx
// Quick editor for super admin to change parent's child limit
import React, { useState, useEffect } from 'react';
import { updateChildLimit, isSuperAdmin } from '../services/permissionService';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import Modal from './Modal';

function ChildLimitEditor({ userId, userName, currentLimit, onUpdate, onClose }) {
  const [isOpen, setIsOpen] = useState(true);
  const [newLimit, setNewLimit] = useState(currentLimit || 5);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isCurrentUserSuperAdmin, setIsCurrentUserSuperAdmin] = useState(false);

  useEffect(() => {
    checkSuperAdminStatus();
  }, []);

  const checkSuperAdminStatus = async () => {
    const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
    const isSA = await isSuperAdmin(currentUser.username);
    setIsCurrentUserSuperAdmin(isSA);
    
    if (!isSA) {
      setError('Only super admin can change child limits');
    }
  };

  const handleSave = async () => {
    if (!isCurrentUserSuperAdmin) {
      setError('Only super admin can change child limits');
      return;
    }

    if (newLimit < 0 || newLimit > 999) {
      setError('Child limit must be between 0 and 999');
      return;
    }

    try {
      setSaving(true);
      setError('');
      setSuccess('');
      
      const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
      await updateChildLimit(userId, newLimit, currentUser.username);
      
      setSuccess(`Child limit updated to ${newLimit}!`);
      
      if (onUpdate) {
        onUpdate();
      }
      
      setTimeout(() => {
        handleClose();
      }, 1500);
    } catch (err) {
      console.error('Error updating child limit:', err);
      setError(err.message || 'Failed to update child limit');
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

  const handleIncrement = () => {
    if (newLimit < 999) {
      setNewLimit(prev => prev + 1);
    }
  };

  const handleDecrement = () => {
    if (newLimit > 0) {
      setNewLimit(prev => prev - 1);
    }
  };

  if (!isCurrentUserSuperAdmin) {
    return null;
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={`Edit Child Limit - ${userName}`}
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

        <div className="space-y-4">
          {/* Current Limit Display */}
          <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
              Current Child Limit
            </div>
            <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {currentLimit}
            </div>
          </div>

          {/* New Limit Input */}
          <div>
            <label className="block text-sm font-medium mb-2">
              New Child Limit
            </label>
            <div className="flex items-center space-x-3">
              <button
                type="button"
                onClick={handleDecrement}
                className="btn bg-gray-500 hover:bg-gray-600 text-white px-4"
                disabled={newLimit <= 0}
              >
                −
              </button>
              
              <input
                type="number"
                min="0"
                max="999"
                value={newLimit}
                onChange={(e) => setNewLimit(parseInt(e.target.value) || 0)}
                className="form-input w-32 text-center text-lg font-semibold"
              />
              
              <button
                type="button"
                onClick={handleIncrement}
                className="btn bg-gray-500 hover:bg-gray-600 text-white px-4"
                disabled={newLimit >= 999}
              >
                +
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Maximum number of children this parent can create (0-999)
            </p>
          </div>

          {/* Quick Presets */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Quick Presets
            </label>
            <div className="grid grid-cols-4 gap-2">
              {[5, 10, 20, 50].map(preset => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setNewLimit(preset)}
                  className={`btn-sm ${
                    newLimit === preset
                      ? 'bg-indigo-500 text-white'
                      : 'bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600'
                  }`}
                >
                  {preset}
                </button>
              ))}
            </div>
          </div>

          {/* Change Summary */}
          {newLimit !== currentLimit && (
            <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded border border-blue-200 dark:border-blue-800">
              <div className="text-sm text-blue-800 dark:text-blue-200">
                <strong>Change:</strong> {currentLimit} → {newLimit} 
                {newLimit > currentLimit ? (
                  <span className="text-green-600 dark:text-green-400 ml-2">
                    (+{newLimit - currentLimit})
                  </span>
                ) : (
                  <span className="text-red-600 dark:text-red-400 ml-2">
                    ({newLimit - currentLimit})
                  </span>
                )}
              </div>
            </div>
          )}
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
            disabled={saving || newLimit === currentLimit}
          >
            {saving ? 'Saving...' : 'Update Limit'}
          </button>
        </div>
      </div>
    </Modal>
  );
}

export default ChildLimitEditor;
