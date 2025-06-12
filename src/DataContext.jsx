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
  increment as incrementField,
  serverTimestamp,
  writeBatch,
  where,
  getDocs
} from 'firebase/firestore';
import { useAuth } from './AuthContext';
import toast from 'react-hot-toast';
import { format, parseISO, startOfDay, endOfDay, subDays, startOfMonth, endOfMonth, startOfYear, endOfYear, subMonths } from 'date-fns';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

const DataContext = createContext(null);

export const DataProvider = ({ children }) => {
  const { user, loadingAuth } = useAuth();

  const [salesData, setSalesData] = useState([]);
  const [expensesData, setExpensesData] = useState([]);
  const [inventoryData, setInventoryData] = useState([]);
  
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
  const [salesSortColumn, setSalesSortColumn] = useState('date');
  const [salesSortDirection, setSalesSortDirection] = useState('desc');
  const [expensesSearchTerm, setExpensesSearchTerm] = useState('');
  const [expensesSortColumn, setExpensesSortColumn] = useState('date');
  const [expensesSortDirection, setExpensesSortDirection] = useState('desc');
  const [inventorySearchTerm, setInventorySearchTerm] = useState('');
  const [inventorySortColumn, setInventorySortColumn] = useState('itemName');
  const [inventorySortDirection, setInventorySortDirection] = useState('asc');
  const [showExportDropdown, setShowExportDropdown] = useState(false);

  const getCollectionPath = useCallback((collectionName) => {
    if (!user) return null;
    const appId = import.meta.env.VITE_FIREBASE_APP_ID || 'financial-ledger-5cc34';
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
    if (!user || loadingAuth) {
      setSalesData([]);
      setExpensesData([]);
      setInventoryData([]);
      return;
    }

    const setupSubscription = (collectionName, setData) => {
        const path = getCollectionPath(collectionName);
        if (!path) return () => {};

        const q = query(collection(db, path));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const data = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
            }));
            setData(data);
        }, (error) => {
            console.error(`Error fetching ${collectionName} data:`, error);
            toast.error(`Failed to load ${collectionName} data.`);
        });
        return unsubscribe;
    };

    const unsubSales = setupSubscription('sales', setSalesData);
    const unsubExpenses = setupSubscription('expenses', setExpensesData);
    const unsubInventory = setupSubscription('inventory', setInventoryData);

    return () => {
      unsubSales();
      unsubExpenses();
      unsubInventory();
    };
  }, [user, loadingAuth, getCollectionPath]);

  const handleAddOrUpdateSale = async (formData, oldSaleData) => {
    if (!user) return toast.error("Authentication required.");
    setIsSavingSale(true);
    const batch = writeBatch(db);

    try {
        const saleToSave = {
            ...formData,
            qty: parseFloat(formData.qty) || 0,
            cost: parseFloat(formData.cost) || 0,
            price: parseFloat(formData.price) || 0,
            userId: user.uid,
            updatedAt: serverTimestamp(),
        };

        const inventoryRef = doc(db, getCollectionPath('inventory'), formData.item);
        
        if (editingSaleId) {
            // UPDATE
            const saleRef = doc(db, getCollectionPath('sales'), editingSaleId);
            batch.update(saleRef, saleToSave);

            const qtyDifference = saleToSave.qty - oldSaleData.qty;
            if (qtyDifference !== 0) {
                batch.update(inventoryRef, { qtyOut: incrementField(qtyDifference) });
            }
            toast.success('Sale updated successfully!');
        } else {
            // CREATE
            saleToSave.createdAt = serverTimestamp();
            const saleRef = doc(collection(db, getCollectionPath('sales')));
            batch.set(saleRef, saleToSave);
            batch.update(inventoryRef, { qtyOut: incrementField(saleToSave.qty) });
            toast.success('Sale added successfully!');
        }

        await batch.commit();
        setEditingSaleId(null);
    } catch (error) {
        console.error("Error saving sale:", error);
        toast.error(`Failed to save sale: ${error.message}`);
    } finally {
        setIsSavingSale(false);
    }
};

  const handleAddOrUpdateExpense = async (formData) => {
    if (!user) return toast.error("Authentication required.");
    setIsSavingExpense(true);
    try {
      const expenseToSave = {
        ...formData,
        amount: parseFloat(formData.amount),
        userId: user.uid,
        updatedAt: serverTimestamp(),
      };
      if (editingExpenseId) {
        const expenseDocRef = doc(db, getCollectionPath('expenses'), editingExpenseId);
        await updateDoc(expenseDocRef, expenseToSave);
        toast.success('Expense updated successfully!');
      } else {
        expenseToSave.createdAt = serverTimestamp();
        const expensesColRef = collection(db, getCollectionPath('expenses'));
        await addDoc(expensesColRef, expenseToSave);
        toast.success('Expense added successfully!');
      }
      setEditingExpenseId(null);
    } catch (error) {
      console.error("Error saving expense:", error);
      toast.error(`Failed to save expense: ${error.message}`);
    } finally {
      setIsSavingExpense(false);
    }
  };

  const handleAddOrUpdateInventory = async (formData) => {
    if (!user) return toast.error("Authentication required.");
    setIsSavingInventory(true);
    try {
        const inventoryToSave = {
            ...formData,
            qtyIn: parseInt(formData.qtyIn, 10) || 0,
            costPrice: parseFloat(formData.costPrice) || 0,
            salePrice: parseFloat(formData.salePrice) || 0,
            userId: user.uid,
            updatedAt: serverTimestamp(),
        };

        // Use itemName as the document ID
        const inventoryDocRef = doc(db, getCollectionPath('inventory'), formData.itemName);

        if (editingInventoryId) {
            await updateDoc(inventoryDocRef, inventoryToSave);
            toast.success('Inventory updated successfully!');
        } else {
            inventoryToSave.createdAt = serverTimestamp();
            inventoryToSave.qtyOut = 0; // Initialize qtyOut for new items
            await addDoc(collection(db, getCollectionPath('inventory')), inventoryToSave);
            toast.success('Inventory added successfully!');
        }
        setEditingInventoryId(null);
    } catch (error) {
        console.error("Error saving inventory:", error);
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
    if (!user || !itemToDelete) return toast.error("Deletion request is invalid.");
    
    const { id, type } = itemToDelete;
    const collectionName = `${type}s`; // 'sale' -> 'sales'
    
    setIsDeleting(true);
    try {
        const docRef = doc(db, getCollectionPath(collectionName), id);
        await deleteDoc(docRef);
        toast.success(`${type.charAt(0).toUpperCase() + type.slice(1)} deleted successfully!`);
    } catch (error) {
        console.error(`Error deleting ${type}:`, error);
        toast.error(`Failed to delete ${type}: ${error.message}`);
    } finally {
        closeConfirmModal();
        setIsDeleting(false);
    }
  };

  const exportToCsvOrPdf = (type, formatType) => {
    let data;
    let headers;
    let filename = `${type}_export_${new Date().toISOString().split('T')[0]}`;
    let title = `${type.charAt(0).toUpperCase() + type.slice(1)} Data`;

    switch(type) {
        case 'sales':
            data = salesData;
            headers = ['date', 'item', 'qty', 'price', 'cost', 'customer'];
            break;
        case 'expenses':
            data = expensesData;
            headers = ['date', 'item', 'amount', 'category'];
            break;
        case 'inventory':
            data = inventoryData.map(i => ({...i, currentStock: i.qtyIn - i.qtyOut}));
            headers = ['itemName', 'qtyIn', 'qtyOut', 'currentStock', 'costPrice', 'salePrice'];
            break;
        default:
            toast.error("Invalid data type for export.");
            return;
    }
    
    const filteredData = data.map(row => {
        let newRow = {};
        headers.forEach(header => {
            newRow[header] = row[header] !== undefined ? row[header] : '';
        });
        return newRow;
    });

    if (formatType === 'csv') {
        const csvRows = [
            headers.join(','),
            ...filteredData.map(row =>
                headers.map(header => {
                    const val = row[header];
                    if (typeof val === 'string' && val.includes(',')) return `"${val.replace(/"/g, '""')}"`;
                    return val;
                }).join(',')
            )
        ];
        const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.setAttribute('download', `${filename}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success('Data exported to CSV!');
    } else { // pdf
        const doc = new jsPDF();
        doc.text(title, 14, 16);
        doc.autoTable({
            head: [headers],
            body: filteredData.map(row => headers.map(header => row[header])),
            startY: 20,
            styles: { fontSize: 8, cellPadding: 2 },
            headStyles: { fillColor: [22, 160, 133], textColor: 255 },
        });
        doc.save(`${filename}.pdf`);
        toast.success('Data exported to PDF!');
    }
  };
  
  const filteredSales = useMemo(() => {
    return salesData
      .filter(sale => {
        const saleDate = new Date(sale.date);
        const start = startDateFilter ? new Date(startDateFilter) : null;
        const end = endDateFilter ? new Date(endDateFilter) : null;
        if (start && saleDate < start) return false;
        if (end && saleDate > end) return false;
        return (sale.item && sale.item.toLowerCase().includes(salesSearchTerm.toLowerCase())) || (sale.customer && sale.customer.toLowerCase().includes(salesSearchTerm.toLowerCase()));
      })
  }, [salesData, startDateFilter, endDateFilter, salesSearchTerm]);

  const filteredExpenses = useMemo(() => {
    return expensesData
        .filter(expense => {
            const expenseDate = new Date(expense.date);
            const start = startDateFilter ? new Date(startDateFilter) : null;
            const end = endDateFilter ? new Date(endDateFilter) : null;
            if (start && expenseDate < start) return false;
            if (end && expenseDate > end) return false;
            return (expense.item && expense.item.toLowerCase().includes(expensesSearchTerm.toLowerCase())) || (expense.category && expense.category.toLowerCase().includes(expensesSearchTerm.toLowerCase()));
        })
  }, [expensesData, startDateFilter, endDateFilter, expensesSearchTerm]);
  
  const filteredInventory = useMemo(() => {
      return inventoryData.filter(item => 
          item.itemName && item.itemName.toLowerCase().includes(inventorySearchTerm.toLowerCase())
      );
  }, [inventoryData, inventorySearchTerm]);


  const contextValue = {
    salesData: filteredSales, 
    expensesData: filteredExpenses, 
    inventoryData: filteredInventory,
    rawInventoryData: inventoryData,
    dateFilterPreset, setDateFilterPreset,
    startDateFilter, setStartDateFilter,
    endDateFilter, setEndDateFilter,
    salesSearchTerm, setSalesSearchTerm, salesSortColumn, setSalesSortColumn, salesSortDirection, setSalesSortDirection,
    expensesSearchTerm, setExpensesSearchTerm, expensesSortColumn, setExpensesSortColumn, expensesSortDirection, setExpensesSortDirection,
    inventorySearchTerm, setInventorySearchTerm, inventorySortColumn, setInventorySortColumn, inventorySortDirection, setInventorySortDirection,
    editingSaleId, setEditingSaleId, isSavingSale, handleAddOrUpdateSale,
    editingExpenseId, setEditingExpenseId, isSavingExpense, handleAddOrUpdateExpense,
    editingInventoryId, setEditingInventoryId, isSavingInventory, handleAddOrUpdateInventory,
    showConfirmModal, openConfirmModal, closeConfirmModal, handleConfirmDelete, isDeleting,
    showExportDropdown, setShowExportDropdown,
    exportToCsv: (type) => exportToCsvOrPdf(type, 'csv'),
    exportToPdf: (type) => exportToCsvOrPdf(type, 'pdf'),
  };

  return (
    <DataContext.Provider value={contextValue}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};
