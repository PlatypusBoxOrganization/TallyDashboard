// src/components/ChangeMyPassword.jsx
// Component for any user to change their OWN password (requires current password)
import React, { useState } from 'react';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import Modal from './Modal';

function ChangeMyPassword({ onClose }) {
  const [isOpen, setIsOpen] = useState(true);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPasswords, setShowPasswords] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  async function hashPassword(password) {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(hashBuffer))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  }

  const handleSave = async () => {
    setError('');
    setSuccess('');

    if (!currentPassword || !newPassword || !confirmPassword) {
      setError('All fields are required');
      return;
    }

    if (newPassword.length < 6) {
      setError('New password must be at least 6 characters long');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('New passwords do not match');
      return;
    }

    try {
      setSaving(true);

      const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
      const username = currentUser.username;

      if (!username) {
        setError('User session not found. Please login again.');
        return;
      }

      // Verify current password
      const userDoc = await getDoc(doc(db, 'users', username));
      if (!userDoc.exists()) {
        setError('User not found');
        return;
      }

      const currentPasswordHash = await hashPassword(currentPassword);
      const storedHash = userDoc.data().passwordHash;

      if (currentPasswordHash !== storedHash) {
        setError('Current password is incorrect');
        return;
      }

      // Update to new password
      const newPasswordHash = await hashPassword(newPassword);
      await updateDoc(doc(db, 'users', username), {
        passwordHash: newPasswordHash,
        passwordChangedAt: new Date().toISOString()
      });

      setSuccess('Password changed successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');

      setTimeout(() => {
        handleClose();
      }, 2000);

    } catch (err) {
      console.error('Error changing password:', err);
      setError('Failed to change password. Please try again.');
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

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Change My Password"
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

        {!success && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                Current Password
              </label>
              <input
                type={showPasswords ? 'text' : 'password'}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="form-input w-full"
                placeholder="Enter current password"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                New Password
              </label>
              <input
                type={showPasswords ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="form-input w-full"
                placeholder="Enter new password"
                minLength="6"
              />
              <p className="text-xs text-gray-500 mt-1">
                Minimum 6 characters
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Confirm New Password
              </label>
              <input
                type={showPasswords ? 'text' : 'password'}
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

            <div className="flex items-center">
              <input
                type="checkbox"
                id="showPasswords"
                checked={showPasswords}
                onChange={(e) => setShowPasswords(e.target.checked)}
                className="form-checkbox h-4 w-4 text-indigo-500"
              />
              <label htmlFor="showPasswords" className="ml-2 text-sm text-gray-600 dark:text-gray-400">
                Show passwords
              </label>
            </div>
          </div>
        )}

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
              disabled={saving || !currentPassword || !newPassword || newPassword !== confirmPassword}
            >
              {saving ? 'Changing...' : 'Change Password'}
            </button>
          )}
        </div>
      </div>
    </Modal>
  );
}

export default ChangeMyPassword;
