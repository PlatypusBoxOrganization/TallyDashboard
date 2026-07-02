// src/components/PasswordResetManager.jsx
// Component for super admin to reset any user's password
import React, { useState, useEffect } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { isSuperAdmin } from '../services/permissionService';
import Modal from './Modal';

function PasswordResetManager({ userId, userName, onUpdate, onClose }) {
  const [isOpen, setIsOpen] = useState(true);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isCurrentUserSuperAdmin, setIsCurrentUserSuperAdmin] = useState(false);
  const [generatedPassword, setGeneratedPassword] = useState('');

  useEffect(() => {
    checkSuperAdminStatus();
  }, []);

  const checkSuperAdminStatus = async () => {
    const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
    const isSA = await isSuperAdmin(currentUser.username);
    setIsCurrentUserSuperAdmin(isSA);
    
    if (!isSA) {
      setError('Only super admin can reset passwords');
    }
  };

  async function hashPassword(password) {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(hashBuffer))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  }

  const generateRandomPassword = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%';
    let password = '';
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setNewPassword(password);
    setConfirmPassword(password);
    setGeneratedPassword(password);
    setShowPassword(true);
  };

  const validatePassword = () => {
    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters long');
      return false;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return false;
    }

    return true;
  };

  const handleSave = async () => {
    if (!isCurrentUserSuperAdmin) {
      setError('Only super admin can reset passwords');
      return;
    }

    setError('');

    if (!validatePassword()) {
      return;
    }

    try {
      setSaving(true);
      setSuccess('');

      const passwordHash = await hashPassword(newPassword);

      await updateDoc(doc(db, 'users', userId), {
        passwordHash: passwordHash,
        passwordResetAt: new Date().toISOString(),
        passwordResetBy: JSON.parse(localStorage.getItem('user') || '{}').username
      });

      setSuccess('Password reset successfully!');
      
      if (onUpdate) {
        onUpdate();
      }

      // Don't auto-close if password was generated (so admin can copy it)
      if (!generatedPassword) {
        setTimeout(() => {
          handleClose();
        }, 2000);
      }

    } catch (err) {
      console.error('Error resetting password:', err);
      setError(err.message || 'Failed to reset password');
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

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text).then(() => {
      alert('Password copied to clipboard!');
    }).catch(err => {
      console.error('Failed to copy:', err);
    });
  };

  if (!isCurrentUserSuperAdmin) {
    return null;
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={`Reset Password - ${userName}`}
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
            {generatedPassword && (
              <div className="mt-2 p-2 bg-white dark:bg-gray-800 rounded border border-green-300">
                <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                  New Password (save this now!):
                </div>
                <div className="flex items-center justify-between">
                  <code className="text-sm font-mono font-bold text-gray-900 dark:text-gray-100">
                    {generatedPassword}
                  </code>
                  <button
                    onClick={() => copyToClipboard(generatedPassword)}
                    className="ml-2 text-xs bg-indigo-500 hover:bg-indigo-600 text-white px-2 py-1 rounded"
                  >
                    Copy
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {!success && (
          <>
            {/* Warning */}
            <div className="mb-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded">
              <div className="flex items-start">
                <svg className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mt-0.5 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <p className="text-sm text-yellow-800 dark:text-yellow-200">
                  This will immediately change the user's password. They will need to use the new password to login.
                </p>
              </div>
            </div>

            {/* Generate Random Password Button */}
            <div className="mb-4">
              <button
                type="button"
                onClick={generateRandomPassword}
                className="btn w-full bg-blue-500 hover:bg-blue-600 text-white"
              >
                🎲 Generate Random Password
              </button>
            </div>

            <div className="relative flex items-center my-4">
              <div className="flex-grow border-t border-gray-300 dark:border-gray-600"></div>
              <span className="flex-shrink mx-3 text-sm text-gray-500">OR</span>
              <div className="flex-grow border-t border-gray-300 dark:border-gray-600"></div>
            </div>

            {/* Manual Password Entry */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  New Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => {
                      setNewPassword(e.target.value);
                      setGeneratedPassword('');
                    }}
                    className="form-input w-full pr-10"
                    placeholder="Enter new password"
                    minLength="6"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showPassword ? (
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Minimum 6 characters
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Confirm Password
                </label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="form-input w-full"
                  placeholder="Confirm new password"
                  minLength="6"
                />
              </div>

              {newPassword && confirmPassword && (
                <div className="text-sm">
                  {newPassword === confirmPassword ? (
                    <span className="text-green-600 dark:text-green-400">
                      ✓ Passwords match
                    </span>
                  ) : (
                    <span className="text-red-600 dark:text-red-400">
                      ✗ Passwords do not match
                    </span>
                  )}
                </div>
              )}
            </div>
          </>
        )}

        {/* Action Buttons */}
        <div className="mt-6 flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-600">
          <button
            onClick={handleClose}
            className="btn bg-gray-500 hover:bg-gray-600 text-white"
            disabled={saving}
          >
            {success ? 'Close' : 'Cancel'}
          </button>
          {!success && (
            <button
              onClick={handleSave}
              className="btn bg-indigo-500 hover:bg-indigo-600 text-white"
              disabled={saving || !newPassword || !confirmPassword || newPassword !== confirmPassword}
            >
              {saving ? 'Resetting...' : 'Reset Password'}
            </button>
          )}
        </div>
      </div>
    </Modal>
  );
}

export default PasswordResetManager;
