// src/DataContext.jsx
import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { db } from './firebase';
import {
  collection,
  query,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
  orderBy,
} from 'firebase/firestore';
import { useAuth } from './AuthContext';
import toast from 'react-hot-toast';
import { format, parseISO, startOfDay, endOfDay, subDays, startOfMonth, endOfMonth, startOfYear, endOfYear, subMonths } from 'date-fns';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

const DataContext = createContext(null);

export const DataProvider = ({ children }) => {
  const { user, loadingAuth } = useAuth();

  // Core Data States
  const [salesData, setSalesData] = useState([]);
  const [expensesData, setExpensesData] = useState([]);
  const [inventoryData, setInventoryData] = useState([]);
  const [rawInventoryData, setRawInventoryData] = useState([]);
  
  // UI and Form States
  const [dateFilterPreset, setDateFilterPreset] = useState('thisMonth');
  const [startDateFilter, setStartDateFilter] = useState('');
  const [endDateFilter, setEndDateFilter] = useState('');
  const [editingSaleId, setEditingSaleId] = useState(null);
  const [isSavingSale, setIsSavingSale] = useState(false);
  const [editingExpenseId, setEditingExpenseId] = useState(null);
  const [isSavingExpense, setIsSavingExpense] = useState(false);
  const [editingInventoryId, setEditingInventoryId] = useState(null);
  const [isSavingInventory, setIsSavingInventory] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [salesSearchTerm, setSalesSearchTerm] = useState('');
  const [expensesSearchTerm, setExpensesSearchTerm] = useState('');
  const [inventorySearchTerm, setInventorySearchTerm] = useState('');
  const [salesSortColumn, setSalesSortColumn] = useState('date');
  const [salesSortDirection, setSalesSortDirection] = useState('desc');
  const [expensesSortColumn, setExpensesSortColumn] = useState('date');
  const [expensesSortDirection, setExpensesSortDirection] = useState('desc');
  const [inventorySortColumn, setInventorySortColumn] = useState('itemName');
  const [inventorySortDirection, setInventorySortDirection] = useState('asc');
  const [showExportDropdown, setShowExportDropdown] = useState(false);

  const getCollectionPath = useCallback((collectionName) => {
    if (!user) return null;
    
    const appId = import.meta.env.VITE_FIREBASE_APP_ID;

    if (!appId) {
        console.error("CRITICAL: VITE_FIREBASE_APP_ID is not defined in the environment variables. The application cannot connect to the database.");
        toast.error("Configuration Error: App ID is missing.");
        return null;
    }
    
    return `artifacts/${appId}/users/${user.uid}/${collectionName}`;
  }, [user]);

  useEffect(() => {
    let start, end;
    const today = new Date();
    switch (dateFilterPreset) {
      case 'today':
        start = end = startOfDay(today);
        break;
      case 'last7days':
        start = startOfDay(subDays(today, 6));
        end = endOfDay(today);
        break;
      case 'lastMonth':
        const lastMonthDate = subMonths(today, 1);
        start = startOfMonth(lastMonthDate);
        end = endOfMonth(lastMonthDate);
        break;
      case 'thisYear':
        start = startOfYear(today);
        end = endOfDay(today);
        break;
      case 'thisMonth':
      default:
        start = startOfMonth(today);
        end = endOfDay(today);
        break;
      case 'custom':
        return; 
    }
    setStartDateFilter(format(start, 'yyyy-MM-dd'));
    setEndDateFilter(format(end, 'yyyy-MM-dd'));
  }, [dateFilterPreset]);

  useEffect(() => {
    if (!user || loadingAuth) return;

    const setupSubscription = (collectionName, orderByField, setData) => {
        const path = getCollectionPath(collectionName);
        if (!path) return () => {}; // Stop if path is null
        const q = query(collection(db, path), orderBy(orderByField, 'desc'));
        return onSnapshot(q, (snapshot) => {
            setData(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        }, (error) => toast.error(`Failed to load ${collectionName}.`));
    };

    const unsubSales = setupSubscription('sales', 'date', setSalesData);
    const unsubExpenses = setupSubscription('expenses', 'date', setExpensesData);
    const unsubInventory = setupSubscription('inventory', 'itemName', setInventoryData);
    
    const inventoryPath = getCollectionPath('inventory');
    let unsubRawInventory = () => {};
    if (inventoryPath) {
        unsubRawInventory = onSnapshot(query(collection(db, inventoryPath), orderBy('itemName')), (snapshot) => {
            setRawInventoryData(snapshot.docs.map(doc => ({id: doc.id, ...doc.data()})))
        });
    }

    // --- FIX APPLIED HERE ---
    // The cleanup function for the effect hook.
    // This now correctly includes unsubRawInventory to prevent resource leaks.
    return () => {
      unsubSales();
      unsubExpenses();
      unsubInventory();
      unsubRawInventory(); // This was the missing call
    };
    // --- END OF FIX ---
  }, [user, loadingAuth, getCollectionPath]);

  // Data modification functions are now correctly defined here
  const handleAddOrUpdateSale = async (formData) => {
    if (!user) return toast.error("Authentication required.");
    const path = getCollectionPath('sales');
    if (!path) return; // Stop if path is invalid
    setIsSavingSale(true);
    try {
      const saleToSave = { ...formData, userId: user.uid, updatedAt: serverTimestamp() };
      if (editingSaleId) {
        await updateDoc(doc(db, path, editingSaleId), saleToSave);
        toast.success('Sale updated successfully!');
      } else {
        saleToSave.createdAt = serverTimestamp();
        await addDoc(collection(db, path), saleToSave);
        toast.success('Sale added successfully!');
      }
      setEditingSaleId(null);
    } catch (error) {
      toast.error(`Failed to save sale: ${error.message}`);
    } finally {
      setIsSavingSale(false);
    }
  };

  const handleAddOrUpdateExpense = async (formData) => {
    if (!user) return toast.error("Authentication required.");
    const path = getCollectionPath('expenses');
    if (!path) return;
    setIsSavingExpense(true);
    try {
      const expenseToSave = { ...formData, userId: user.uid, updatedAt: serverTimestamp() };
      if (editingExpenseId) {
        await updateDoc(doc(db, path, editingExpenseId), expenseToSave);
        toast.success('Expense updated successfully!');
      } else {
        expenseToSave.createdAt = serverTimestamp();
        await addDoc(collection(db, path), expenseToSave);
        toast.success('Expense added successfully!');
      }
      setEditingExpenseId(null);
    } catch (error) {
      toast.error(`Failed to save expense: ${error.message}`);
    } finally {
      setIsSavingExpense(false);
    }
  };

  const handleAddOrUpdateInventory = async (formData) => {
    if (!user) return toast.error("Authentication required.");
    const path = getCollectionPath('inventory');
    if (!path) return;
    setIsSavingInventory(true);
    try {
      const inventoryToSave = { ...formData, userId: user.uid, updatedAt: serverTimestamp() };
      if (editingInventoryId) {
        await updateDoc(doc(db, path, editingInventoryId), inventoryToSave);
        toast.success('Inventory updated successfully!');
      } else {
        inventoryToSave.createdAt = serverTimestamp();
        inventoryToSave.qtyOut = 0;
        await addDoc(collection(db, path), inventoryToSave);
        toast.success('Inventory added successfully!');
      }
      setEditingInventoryId(null);
    } catch (error) {
      toast.error(`Failed to save inventory: ${error.message}`);
    } finally {
      setIsSavingInventory(false);
    }
  };
  
  const openConfirmModal = (id, type) => {
    setItemToDelete({ id, type });
    setShowConfirmModal(true);
  };

  const closeConfirmModal = () => {
    setShowConfirmModal(false);
    setItemToDelete(null);
  };

  const handleConfirmDelete = async () => {
    if (!user || !itemToDelete) return;
    const { id, type } = itemToDelete;
    const path = getCollectionPath(`${type}s`);
    if (!path) return;
    setIsDeleting(true);
    try {
      await deleteDoc(doc(db, path, id));
      toast.success(`${type.charAt(0).toUpperCase() + type.slice(1)} deleted successfully!`);
    } catch (error) {
      toast.error(`Failed to delete ${type}.`);
    } finally {
      closeConfirmModal();
      setIsDeleting(false);
    }
  };

  const filteredSales = useMemo(() => salesData.filter(s => {
    if (!s.date || !startDateFilter || !endDateFilter) return true;
    const saleDate = parseISO(s.date);
    return saleDate >= startOfDay(parseISO(startDateFilter)) && saleDate <= endOfDay(parseISO(endDateFilter));
  }), [salesData, startDateFilter, endDateFilter]);

  const filteredExpenses = useMemo(() => expensesData.filter(e => {
    if (!e.date || !startDateFilter || !endDateFilter) return true;
    const expenseDate = parseISO(e.date);
    return expenseDate >= startOfDay(parseISO(startDateFilter)) && expenseDate <= endOfDay(parseISO(endDateFilter));
  }), [expensesData, startDateFilter, endDateFilter]);

  const exportToCsv = (type) => {
    let data, headers;
    switch (type) {
      case 'sales': data = filteredSales; headers = ['date', 'item', 'qty', 'price', 'cost', 'customer']; break;
      case 'expenses': data = filteredExpenses; headers = ['date', 'item', 'amount', 'category']; break;
      case 'inventory': data = rawInventoryData.map(i => ({...i, currentStock: (i.qtyIn || 0) - (i.qtyOut || 0)})); headers = ['itemName', 'qtyIn', 'qtyOut', 'currentStock', 'costPrice']; break;
      default: toast.error("Invalid export type."); return;
    }
    if (data.length === 0) return toast.error("No data to export for the selected range.");

    const csvRows = [headers.join(','), ...data.map(row => headers.map(h => JSON.stringify(row[h] || '', (key, value) => value === null ? '' : value)).join(','))];
    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', `${type}_export.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportToPdf = (type) => {
    let data, headers;
    switch (type) {
        case 'sales': data = filteredSales; headers = ['date', 'item', 'qty', 'price', 'cost', 'customer']; break;
        case 'expenses': data = filteredExpenses; headers = ['date', 'item', 'amount', 'category']; break;
        case 'inventory': data = rawInventoryData.map(i => ({...i, currentStock: (i.qtyIn || 0) - (i.qtyOut || 0)})); headers = ['itemName', 'qtyIn', 'qtyOut', 'currentStock', 'costPrice']; break;
        default: toast.error("Invalid export type."); return;
    }
    if (data.length === 0) return toast.error("No data to export for the selected range.");

    const doc = new jsPDF();
    doc.text(`${type.charAt(0).toUpperCase() + type.slice(1)} Report`, 14, 15);
    doc.autoTable({ head: [headers], body: data.map(row => headers.map(h => row[h] || '')) });
    doc.save(`${type}_export.pdf`);
  };

  const contextValue = {
    salesData, expensesData, inventoryData, rawInventoryData,
    dateFilterPreset, setDateFilterPreset, startDateFilter, setStartDateFilter, endDateFilter, setEndDateFilter,
    editingSaleId, setEditingSaleId, isSavingSale, handleAddOrUpdateSale,
    editingExpenseId, setEditingExpenseId, isSavingExpense, handleAddOrUpdateExpense,
    editingInventoryId, setEditingInventoryId, isSavingInventory, handleAddOrUpdateInventory,
    showConfirmModal, openConfirmModal, closeConfirmModal, handleConfirmDelete, isDeleting,
    salesSearchTerm, setSalesSearchTerm, salesSortColumn, setSalesSortColumn, salesSortDirection, setSalesSortDirection,
    expensesSearchTerm, setExpensesSearchTerm, expensesSortColumn, setExpensesSortColumn, expensesSortDirection, setExpensesSortDirection,
    inventorySearchTerm, setInventorySearchTerm, inventorySortColumn, setInventorySortColumn, inventorySortDirection, setInventorySortDirection,
    showExportDropdown, setShowExportDropdown, exportToCsv, exportToPdf,
    filteredSales, filteredExpenses,
  };

  return (
    <DataContext.Provider value={contextValue}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (context === undefined) throw new Error('useData must be used within a DataProvider');
  return context;
};
