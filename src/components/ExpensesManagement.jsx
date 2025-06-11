// src/components/ExpensesManagement.jsx
import React, { useEffect, useMemo } from 'react';
import { useData } from '../DataContext';
import { useForm } from '../hooks/useForm';
import FormInput from './FormInput';
import ActionButton from './ActionButton';
import DropdownMenu from './DropdownMenu';

export default function ExpensesManagement() {
  const {
    expensesData,
    editingExpenseId, setEditingExpenseId,
    isSavingExpense, handleAddOrUpdateExpense,
    isDeleting, openConfirmModal,
    expensesSearchTerm, setExpensesSearchTerm,
    expensesSortColumn, setExpensesSortColumn,
    expensesSortDirection, setExpensesSortDirection,
  } = useData();

  const initialExpenseFormState = {
    date: new Date().toISOString().slice(0, 10),
    item: '',
    amount: '',
    category: '',
  };
  
  const validateExpenseForm = (formData) => {
      const errors = {};
      if (!formData.date) errors.date = 'Expense Date is required.';
      if (!formData.item.trim()) errors.item = 'Item description is required.';
      if (!formData.amount || parseFloat(formData.amount) <= 0) errors.amount = 'Amount must be a positive number.';
      if (!formData.category) errors.category = 'Category is required.';
      return errors;
  };
  
  const { formData, setFormData, errors, handleChange, handleSubmit, resetForm } = useForm(initialExpenseFormState, validateExpenseForm);

  useEffect(() => {
    if (editingExpenseId) {
      const expenseToEdit = expensesData.find(e => e.id === editingExpenseId);
      if (expenseToEdit) {
        setFormData(expenseToEdit);
      }
    } else {
      resetForm();
    }
  }, [editingExpenseId, expensesData, setFormData, resetForm]);
  
  const onFormSubmit = (data) => {
    handleAddOrUpdateExpense(data).then(() => {
        if (!editingExpenseId) resetForm();
    });
  };

  const sortedExpenses = useMemo(() => {
    return [...expensesData].sort((a, b) => {
      const aVal = a[expensesSortColumn];
      const bVal = b[expensesSortColumn];
      const order = expensesSortDirection === 'asc' ? 1 : -1;
      if (typeof aVal === 'string') return aVal.localeCompare(bVal) * order;
      return (aVal - bVal) * order;
    });
  }, [expensesData, expensesSortColumn, expensesSortDirection]);

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-xl shadow-md border border-gray-200">
        <h2 className="text-2xl font-bold text-gray-700 mb-4">{editingExpenseId ? 'Edit Expense' : 'Add New Expense'}</h2>
        <form onSubmit={handleSubmit(onFormSubmit)} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormInput id="date" label="Expense Date" type="date" value={formData.date} onChange={handleChange} error={errors.date} />
          <FormInput id="item" label="Item/Description" value={formData.item} onChange={handleChange} error={errors.item} />
          <FormInput id="amount" label="Amount" type="number" value={formData.amount} onChange={handleChange} error={errors.amount} />
          <FormInput id="category" label="Category" value={formData.category} onChange={handleChange} error={errors.category} />
          <div className="md:col-span-2 flex justify-end space-x-2">
            <ActionButton type="submit" color="blue" disabled={isSavingExpense}>{isSavingExpense ? 'Saving...' : 'Save Expense'}</ActionButton>
            <ActionButton type="button" color="gray" onClick={() => { setEditingExpenseId(null); resetForm(); }}>Cancel</ActionButton>
          </div>
        </form>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-md border border-gray-200">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-gray-700">Expenses Records</h2>
          <input
            type="text"
            placeholder="Search expenses..."
            value={expensesSearchTerm}
            onChange={(e) => setExpensesSearchTerm(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md shadow-sm"
          />
        </div>
        <table className="min-w-full bg-white">
          <thead>
            <tr>
              {['Date', 'Item', 'Amount', 'Category', 'Actions'].map(header => (
                <th key={header} className="p-3 text-left text-sm font-semibold text-gray-600 uppercase tracking-wider">{header}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {sortedExpenses.map((expense) => (
              <tr key={expense.id} className="hover:bg-gray-50">
                <td className="p-3 text-sm text-gray-800">{expense.date}</td>
                <td className="p-3 text-sm text-gray-800">{expense.item}</td>
                <td className="p-3 text-right text-sm text-gray-800">₦{expense.amount.toFixed(2)}</td>
                <td className="p-3 text-sm text-gray-800">{expense.category}</td>
                <td className="p-3 text-center">
                  <DropdownMenu>
                    <ActionButton onClick={() => setEditingExpenseId(expense.id)} color="blue">Edit</ActionButton>
                    <ActionButton onClick={() => openConfirmModal(expense.id, 'expense')} color="red" disabled={isDeleting}>
                      {isDeleting ? 'Deleting...' : 'Delete'}
                    </ActionButton>
                  </DropdownMenu>
                </td>
              </tr>
            ))}
            {sortedExpenses.length === 0 && (
              <tr>
                <td colSpan="5" className="p-4 text-center text-gray-500">No expenses records found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
