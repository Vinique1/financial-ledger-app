// App.jsx
import React, { useState, Suspense } from 'react';
import { useAuth } from './AuthContext';
import { useData } from './DataContext';
import { EmailAuthProvider, reauthenticateWithCredential, updateEmail, updatePassword } from 'firebase/auth';
import Login from './Login';
import ConfirmationModal from './ConfirmationModal';
import toast from 'react-hot-toast';

// Corrected paths for lazy loading components from the 'src' directory
const DashboardContent = React.lazy(() => import('./components/DashboardContent'));
const SalesManagement = React.lazy(() => import('./components/SalesManagement'));
const ExpensesManagement = React.lazy(() => import('./components/ExpensesManagement'));
const ProfileManagement = React.lazy(() => import('./components/ProfileManagement'));
const InventoryManagement = React.lazy(() => import('./components/InventoryManagement'));


export default function App() {
  const { user, loadingAuth, logout } = useAuth();
  const {
    salesData, expensesData, inventoryData,
    dateFilterPreset, setDateFilterPreset,
    startDateFilter, setStartDateFilter,
    endDateFilter, setEndDateFilter,
    showConfirmModal, openConfirmModal, closeConfirmModal, handleConfirmDelete,
    showExportDropdown, setShowExportDropdown, exportToCsv, exportToPdf,
  } = useData();

  const [activeTab, setActiveTab] = useState('dashboard');

  // Profile Management state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [profileMessage, setProfileMessage] = useState(null);
  const [profileError, setProfileError] = useState(null);
  const [isUpdatingEmail, setIsUpdatingEmail] = useState(false);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  const resetProfileForms = () => {
    setCurrentPassword('');
    setNewEmail('');
    setNewPassword('');
    setConfirmNewPassword('');
    setProfileMessage(null);
    setProfileError(null);
    toast.dismiss();
  };

  const handleChangeEmail = async (e) => {
    e.preventDefault();
    if (!user) {
      setProfileError('No user logged in.');
      toast.error('No user logged in to update email.');
      return;
    }
    setIsUpdatingEmail(true);
    setProfileMessage(null);
    setProfileError(null);

    try {
      const credential = EmailAuthProvider.credential(user.email, currentPassword);
      await reauthenticateWithCredential(user, credential);
      await updateEmail(user, newEmail);
      setProfileMessage('Email updated successfully!');
      toast.success('Email updated successfully!');
      resetProfileForms();
    } catch (error) {
      console.error('Error updating email:', error);
      const errorMessage = error.message.includes('auth/wrong-password') ? 'Incorrect current password.' : 'Failed to update email. Please check your credentials.';
      setProfileError(`Error updating email: ${errorMessage}`);
      toast.error(errorMessage);
    } finally {
      setIsUpdatingEmail(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (!user) {
      setProfileError('No user logged in.');
      toast.error('No user logged in to change password.');
      return;
    }
    if (newPassword !== confirmNewPassword) {
      const errorMessage = 'New password and confirmation do not match.';
      setProfileError(errorMessage);
      toast.error(errorMessage);
      return;
    }
    setIsUpdatingPassword(true);
    setProfileMessage(null);
    setProfileError(null);

    try {
      const credential = EmailAuthProvider.credential(user.email, currentPassword);
      await reauthenticateWithCredential(user, credential);
      await updatePassword(user, newPassword);
      setProfileMessage('Password updated successfully!');
      toast.success('Password updated successfully!');
      resetProfileForms();
    } catch (error) {
      console.error('Error updating password:', error);
      const errorMessage = error.message.includes('auth/wrong-password') ? 'Incorrect current password.' : 'Failed to change password. Please check your credentials.';
      setProfileError(`Error updating password: ${errorMessage}`);
      toast.error(errorMessage);
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  if (loadingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 text-xl text-gray-600">
        <svg className="animate-spin h-8 w-8 text-blue-500 mr-3" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        Loading authentication...
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  const LoadingSpinner = () => (
    <div className="flex justify-center items-center h-64 text-gray-500">
      <svg className="animate-spin h-8 w-8 text-blue-500 mr-3" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
      Loading...
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      <header className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white shadow-lg rounded-b-xl">
        <div className="container mx-auto px-4 py-6">
          <div className="flex justify-between items-center flex-wrap gap-4">
            <h1 className="text-3xl font-bold tracking-tight">Business Tracker</h1>
            <nav className="flex flex-wrap items-center space-x-2 sm:space-x-4">
              {['dashboard', 'sales', 'expenses', 'inventory', 'profile'].map(tab => (
                  <button
                      key={tab}
                      onClick={() => {
                          setActiveTab(tab);
                          if (tab === 'profile') resetProfileForms();
                      }}
                      className={`px-4 py-2 rounded-md transition-colors duration-200 capitalize ${activeTab === tab ? 'bg-white text-blue-700 shadow-md' : 'hover:bg-blue-500'}`}
                  >
                      {tab}
                  </button>
              ))}
              <div className="relative">
                <button
                  onClick={() => setShowExportDropdown(!showExportDropdown)}
                  className="px-4 py-2 rounded-md bg-blue-500 text-white hover:bg-blue-600 transition-colors duration-200"
                >
                  Export
                </button>
                {showExportDropdown && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-10">
                    <span className="block px-4 py-2 text-sm text-gray-700 font-semibold">Sales Data</span>
                    <button onClick={() => exportToCsv('sales')} className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Export Sales CSV</button>
                    <button onClick={() => exportToPdf('sales')} className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Export Sales PDF</button>
                    <span className="block px-4 py-2 text-sm text-gray-700 font-semibold mt-1">Expenses Data</span>
                    <button onClick={() => exportToCsv('expenses')} className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Export Expenses CSV</button>
                    <button onClick={() => exportToPdf('expenses')} className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Export Expenses PDF</button>
                    <span className="block px-4 py-2 text-sm text-gray-700 font-semibold mt-1">Inventory Data</span>
                    <button onClick={() => exportToCsv('inventory')} className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Export Inventory CSV</button>
                    <button onClick={() => exportToPdf('inventory')} className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Export Inventory PDF</button>
                  </div>
                )}
              </div>
              <button
                onClick={logout}
                className="px-4 py-2 text-sm bg-red-500 text-white rounded-md hover:bg-red-600"
              >
                Logout
              </button>
            </nav>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {(activeTab === 'dashboard' || activeTab === 'sales' || activeTab === 'expenses') && (
          <div className="mb-8 flex flex-col sm:flex-row justify-end items-center gap-4">
            <div className="flex items-center space-x-2">
              <label htmlFor="dateFilterPreset" className="text-sm font-medium text-gray-700">Filter by:</label>
              <select
                id="dateFilterPreset"
                className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                value={dateFilterPreset}
                onChange={(e) => setDateFilterPreset(e.target.value)}
              >
                <option value="custom">Custom Range</option>
                <option value="today">Today</option>
                <option value="last7days">Last 7 Days</option>
                <option value="thisMonth">This Month</option>
                <option value="lastMonth">Last Month</option>
                <option value="thisYear">This Year</option>
              </select>
            </div>
            {dateFilterPreset === 'custom' && (
              <>
                <div className="flex items-center space-x-2">
                  <label htmlFor="start-date-filter" className="text-sm font-medium text-gray-700">From:</label>
                  <input
                    type="date"
                    id="start-date-filter"
                    value={startDateFilter}
                    onChange={(e) => setStartDateFilter(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <label htmlFor="end-date-filter" className="text-sm font-medium text-gray-700">To:</label>
                  <input
                    type="date"
                    id="end-date-filter"
                    value={endDateFilter}
                    onChange={(e) => setEndDateFilter(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </>
            )}
          </div>
        )}

        <Suspense fallback={<LoadingSpinner />}>
          {activeTab === 'dashboard' && (
            <DashboardContent
              salesData={salesData}
              expensesData={expensesData}
              inventoryData={inventoryData}
              startDateFilter={startDateFilter}
              endDateFilter={endDateFilter}
            />
          )}
          {activeTab === 'sales' && <SalesManagement />}
          {activeTab === 'expenses' && <ExpensesManagement />}
          {activeTab === 'inventory' && <InventoryManagement />}
          {activeTab === 'profile' && (
            <ProfileManagement
              currentPassword={currentPassword}
              setCurrentPassword={setCurrentPassword}
              newEmail={newEmail}
              setNewEmail={setNewEmail}
              newPassword={newPassword}
              setNewPassword={setNewPassword}
              confirmNewPassword={confirmNewPassword}
              setConfirmNewPassword={setConfirmNewPassword}
              profileMessage={profileMessage}
              profileError={profileError}
              isUpdatingEmail={isUpdatingEmail}
              isUpdatingPassword={isUpdatingPassword}
              resetProfileForms={resetProfileForms}
              handleChangeEmail={handleChangeEmail}
              handleChangePassword={handleChangePassword}
            />
          )}
        </Suspense>
      </main>

      <footer className="bg-white border-t border-gray-200 mt-12 rounded-t-xl">
        <div className="container mx-auto px-4 py-6">
          <p className="text-center text-gray-500 text-sm">
            Business Tracker © {new Date().getFullYear()} | All Rights Reserved
          </p>
        </div>
      </footer>

      <ConfirmationModal
        show={showConfirmModal}
        message="Are you sure you want to delete this record? This action cannot be undone."
        onConfirm={handleConfirmDelete}
        onCancel={closeConfirmModal}
      />
    </div>
  );
}
