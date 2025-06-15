// App.jsx
import React, { useState, Suspense } from 'react';
import { useAuth } from './AuthContext';
import { useData } from './DataContext';
import Login from './Login';
import ConfirmationModal from './ConfirmationModal';
import { useDetectOutsideClick } from './hooks/useDetectOutsideClick';

// Lazy load components
const DashboardContent = React.lazy(() => import('./components/DashboardContent'));
const SalesManagement = React.lazy(() => import('./components/SalesManagement'));
const ExpensesManagement = React.lazy(() => import('./components/ExpensesManagement'));
const InventoryManagement = React.lazy(() => import('./components/InventoryManagement'));
const UserManagement = React.lazy(() => import('./components/UserManagement'));

export default function App() {
  const { user, loadingAuth, logout } = useAuth();
  const {
    // --- FIX APPLIED HERE ---
    // Switched from 'filteredSales' and 'filteredExpenses' to the new,
    // already-filtered 'salesData' and 'expensesData' from the context.
    salesData, 
    expensesData, 
    // --- END OF FIX ---
    inventoryData,
    dateFilterPreset, setDateFilterPreset,
    startDateFilter, setStartDateFilter,
    endDateFilter, setEndDateFilter,
    showConfirmModal, openConfirmModal, closeConfirmModal, handleConfirmDelete,
    exportToCsv, exportToPdf,
  } = useData();

  const [activeTab, setActiveTab] = useState('dashboard');
  const [showExportDropdown, setShowExportDropdown, exportDropdownRef] = useDetectOutsideClick(false);

  if (loadingAuth) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (!user) {
    return <Login />;
  }
  
  const LoadingSpinner = () => (
    <div className="flex justify-center items-center h-64">Loading...</div>
  );

  const availableTabs = {
    admin: ['dashboard', 'sales', 'expenses', 'inventory', 'users'],
    sales_manager: ['dashboard', 'sales', 'expenses', 'inventory'],
    expense_manager: ['dashboard', 'sales', 'expenses', 'inventory'],
    inventory_manager: ['dashboard', 'sales', 'expenses', 'inventory'],
    viewer: ['dashboard', 'sales', 'expenses', 'inventory']
  };
  const userTabs = availableTabs[user.role] || [];


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
              <div className="relative" ref={exportDropdownRef}>
                <button
                  onClick={() => setShowExportDropdown(!showExportDropdown)}
                  className="px-4 py-2 rounded-md bg-blue-500 text-white hover:bg-blue-600 transition-colors duration-200"
                >
                  Export
                </button>
                {showExportDropdown && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-10">
                    <span className="block px-4 py-2 text-sm text-gray-700 font-semibold">Sales Data</span>
                    <button onClick={() => { exportToCsv('sales'); setShowExportDropdown(false); }} className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Export Sales CSV</button>
                    <button onClick={() => { exportToPdf('sales'); setShowExportDropdown(false); }} className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Export Sales PDF</button>
                    <span className="block px-4 py-2 text-sm text-gray-700 font-semibold mt-1">Expenses Data</span>
                    <button onClick={() => { exportToCsv('expenses'); setShowExportDropdown(false); }} className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Export Expenses CSV</button>
                    <button onClick={() => { exportToPdf('expenses'); setShowExportDropdown(false); }} className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Export Expenses PDF</button>
                    <span className="block px-4 py-2 text-sm text-gray-700 font-semibold mt-1">Inventory Data</span>
                    <button onClick={() => { exportToCsv('inventory'); setShowExportDropdown(false); }} className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Export Inventory CSV</button>
                    <button onClick={() => { exportToPdf('inventory'); setShowExportDropdown(false); }} className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Export Inventory PDF</button>
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
          {activeTab === 'users' && user.role === 'admin' && <UserManagement />}
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
