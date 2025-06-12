// App.jsx
import React, { useState, Suspense } from 'react';
import { useAuth } from './AuthContext';
import { useData } from './DataContext';
import Login from './Login';
import ConfirmationModal from './ConfirmationModal';

// Lazily load components
const DashboardContent = React.lazy(() => import('./components/DashboardContent'));
const SalesManagement = React.lazy(() => import('./components/SalesManagement'));
const ExpensesManagement = React.lazy(() => import('./components/ExpensesManagement'));
const InventoryManagement = React.lazy(() => import('./components/InventoryManagement'));
const UserManagement = React.lazy(() => import('./components/UserManagement')); // Renamed from ProfileManagement

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

  if (loadingAuth) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (!user) {
    return <Login />;
  }
  
  // Define available tabs based on user role
  const availableTabs = {
    admin: ['dashboard', 'sales', 'expenses', 'inventory', 'users'],
    sales_manager: ['dashboard', 'sales', 'expenses', 'inventory'],
    expense_manager: ['dashboard', 'sales', 'expenses', 'inventory'],
    inventory_manager: ['dashboard', 'sales', 'expenses', 'inventory'],
    viewer: ['dashboard', 'sales', 'expenses', 'inventory']
  };

  const userTabs = availableTabs[user.role] || [];
  
  const LoadingSpinner = () => (
    <div className="flex justify-center items-center h-64">Loading...</div>
  );

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      <header className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white shadow-lg rounded-b-xl">
        <div className="container mx-auto px-4 py-6">
          <div className="flex justify-between items-center flex-wrap gap-4">
            <h1 className="text-3xl font-bold tracking-tight">Business Tracker</h1>
            <nav className="flex flex-wrap items-center space-x-2 sm:space-x-4">
              {userTabs.map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-2 rounded-md transition-colors duration-200 capitalize ${activeTab === tab ? 'bg-white text-blue-700 shadow-md' : 'hover:bg-blue-500'}`}
                >
                  {tab === 'users' ? 'User Management' : tab}
                </button>
              ))}
              <button onClick={logout} className="px-4 py-2 text-sm bg-red-500 text-white rounded-md hover:bg-red-600">Logout</button>
            </nav>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <Suspense fallback={<LoadingSpinner />}>
          {activeTab === 'dashboard' && <DashboardContent {...{salesData, expensesData, inventoryData, startDateFilter, endDateFilter}} />}
          {activeTab === 'sales' && <SalesManagement />}
          {activeTab === 'expenses' && <ExpensesManagement />}
          {activeTab === 'inventory' && <InventoryManagement />}
          {activeTab === 'users' && user.role === 'admin' && <UserManagement />}
        </Suspense>
      </main>

      <ConfirmationModal
        show={showConfirmModal}
        message="Are you sure you want to delete this record? This action cannot be undone."
        onConfirm={handleConfirmDelete}
        onCancel={closeConfirmModal}
      />
    </div>
  );
}
