// src/components/ProfileManagement.jsx
import React from 'react';
import { useAuth } from '../AuthContext'; // Import useAuth hook
import FormInput from './FormInput'; // Import FormInput
import ActionButton from './ActionButton'; // Import ActionButton
// No need to import updateEmail, updatePassword, EmailAuthProvider, reauthenticateWithCredential here
// as they are handled by the passed-in handleChangeEmail/Password from App.jsx
import toast from 'react-hot-toast';

export default function ProfileManagement({
  // These props are still passed from App.jsx as they manage auth-related forms and handlers
  currentPassword, setCurrentPassword,
  newEmail, setNewEmail,
  newPassword, setNewPassword,
  confirmNewPassword, setConfirmNewPassword,
  profileMessage, setProfileMessage,
  profileError, setProfileError,
  isUpdatingEmail, setIsUpdatingEmail,
  isUpdatingPassword, setIsUpdatingPassword,
  resetProfileForms,
  handleChangeEmail, // Handlers passed from App.jsx
  handleChangePassword, // Handlers passed from App.jsx
}) {
  const { user } = useAuth(); // Consume user from AuthContext

  // The actual logic for handleChangeEmail and handleChangePassword is now in App.jsx
  // This component simply calls the passed-in prop functions.

  return (
    <div className="bg-white p-6 rounded-xl shadow-md border border-gray-200">
      <h2 className="text-2xl font-semibold text-gray-700 mb-6">Profile Management</h2>

      {profileMessage && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-4" role="alert">
          <span className="block sm:inline">{profileMessage}</span>
        </div>
      )}
      {profileError && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
          <span className="block sm:inline">{profileError}</span>
        </div>
      )}

      {/* Current User Info */}
      <div className="mb-8 p-4 border rounded-lg bg-gray-50">
        <h3 className="text-xl font-semibold text-gray-700 mb-3">Current User Information</h3>
        <p className="text-gray-800"><strong>Email:</strong> {user?.email}</p>
        <p className="text-gray-800"><strong>User ID:</strong> {user?.uid}</p>
      </div>

      {/* Change Email Form */}
      <div className="mb-8 p-4 border rounded-lg bg-gray-50">
        <h3 className="text-xl font-semibold text-gray-700 mb-4">Change Email</h3>
        <form onSubmit={handleChangeEmail} className="space-y-4"> {/* Call prop handler */}
          <FormInput
            id="current-password-email"
            label="Current Password"
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            required
            disabled={isUpdatingEmail}
          />
          <FormInput
            id="new-email"
            label="New Email"
            type="email"
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            required
            disabled={isUpdatingEmail}
          />
          <div className="flex justify-end space-x-2">
            <ActionButton
              type="submit"
              color="blue"
              disabled={isUpdatingEmail}
              className={`${isUpdatingEmail ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {isUpdatingEmail ? 'Updating Email...' : 'Update Email'}
            </ActionButton>
            <ActionButton type="button" onClick={resetProfileForms} color="gray">
              Cancel
            </ActionButton>
          </div>
        </form>
      </div>

      {/* Change Password Section */}
      <div className="p-4 border rounded-lg bg-gray-50">
        <h3 className="text-xl font-semibold text-gray-700 mb-4">Change Password</h3>
        <form onSubmit={handleChangePassword} className="space-y-4"> {/* Call prop handler */}
          <FormInput
            id="current-password-pass"
            label="Current Password"
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            required
            disabled={isUpdatingPassword}
          />
          <FormInput
            id="new-password"
            label="New Password"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
            disabled={isUpdatingPassword}
          />
          <FormInput
            id="confirm-new-password"
            label="Confirm New Password"
            type="password"
            value={confirmNewPassword}
            onChange={(e) => setConfirmNewPassword(e.target.value)}
            required
            disabled={isUpdatingPassword}
          />
          <div className="flex justify-end space-x-2">
            <ActionButton
              type="submit"
              color="blue"
              disabled={isUpdatingPassword}
              className={`${isUpdatingPassword ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {isUpdatingPassword ? 'Updating Password...' : 'Change Password'}
            </ActionButton>
            <ActionButton type="button" onClick={resetProfileForms} color="gray">
              Cancel
            </ActionButton>
          </div>
        </form>
      </div>
    </div>
  );
}
