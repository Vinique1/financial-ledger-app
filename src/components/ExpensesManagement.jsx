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

  const expenseCategories = ['Rent', 'Salaries', 'Utilities', 'Marketing', 'Supplies', 'Maintenance', 'Transportation', 'Miscellaneous'];
  const initialExpenseFormState = { date: new Date().toISOString().slice(0, 10), item: '', amount: '', category: '' };
  
  const { formData, setFormData, errors, handleChange, handleSubmit, resetForm } = useForm(initialExpenseFormState, (formData) => {
      const errors = {};
      if (!formData.date) errors.date = 'Expense Date is required.';
      if (!formData.item.trim()) errors.item = 'Item description is required.';
      if (!formData.amount || parseFloat(formData.amount) <= 0) errors.amount = 'Amount must be a positive number.';
      if (!formData.category) errors.category = 'Category is required.';
      return errors;
  });

  useEffect(() => {
    if (editingExpenseId) {
      const expenseToEdit = expensesData.find(e => e.id === editingExpenseId);
      if (expenseToEdit) setFormData(expenseToEdit);
    } else {
      resetForm();
    }
  }, [editingExpenseId, expensesData, setFormData, resetForm]);
  
  const onFormSubmit = (data) => {
    handleAddOrUpdateExpense(data).then(() => {
        if (!editingExpenseId) resetForm();
    });
  };

  const sortedAndFilteredExpenses = useMemo(() => {
    return expensesData
      .filter(expense => 
        (expense.item && expense.item.toLowerCase().includes(expensesSearchTerm.toLowerCase())) ||
        (expense.category && expense.category.toLowerCase().includes(expensesSearchTerm.toLowerCase()))
      )
      .sort((a, b) => {
        const aVal = a[expensesSortColumn];
        const bVal = b[expensesSortColumn];
        const order = expensesSortDirection === 'asc' ? 1 : -1;
        if (typeof aVal === 'string') return aVal.localeCompare(bVal) * order;
        return (aVal - bVal) * order;
      });
  }, [expensesData, expensesSearchTerm, expensesSortColumn, expensesSortDirection]);

  const tableHeaders = [ { key: 'date', label: 'Date', align: 'left' }, { key: 'item', label: 'Description', align: 'left' }, { key: 'category', label: 'Category', align: 'left' }, { key: 'amount', label: 'Amount', align: 'center' }, { key: 'actions', label: '', align: 'center' } ];

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-xl shadow-md border border-gray-200">
        <h2 className="text-2xl font-bold text-gray-700 mb-4">{editingExpenseId ? 'Edit Expense' : 'Add New Expense'}</h2>
        <form onSubmit={handleSubmit(onFormSubmit)} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormInput id="date" label="Expense Date" type="date" value={formData.date} onChange={handleChange} error={errors.date} />
          <FormInput id="item" label="Item/Description" value={formData.item} onChange={handleChange} error={errors.item} />
          <FormInput id="amount" label="Amount" type="number" value={formData.amount} onChange={handleChange} error={errors.amount} />
          <FormInput id="category" label="Category" type="select" value={formData.category} onChange={handleChange} error={errors.category}>
            <option value="">Select a category</option>
            {expenseCategories.map(cat => (<option key={cat} value={cat}>{cat}</option>))}
          </FormInput>
          <div className="md:col-span-2 flex justify-end space-x-2">
            <ActionButton type="submit" color="blue" loading={isSavingExpense}>
              {isSavingExpense ? 'Saving' : 'Save Expense'}
            </ActionButton>
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
        <div className="overflow-y-auto max-h-[60vh] relative">
            <table className="min-w-full bg-white">
            <thead>
                <tr>{tableHeaders.map(header => (<th key={header.key} className={`sticky top-0 z-10 p-3 bg-gray-100 border-b text-${header.align} text-sm font-semibold text-gray-600 uppercase tracking-wider`}>{header.label}</th>))}</tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
                {sortedAndFilteredExpenses.map((expense) => (
                <tr key={expense.id} className="hover:bg-gray-50">
                    <td className="p-3 text-sm text-gray-800">{expense.date}</td>
                    <td className="p-3 text-sm text-gray-800">{expense.item}</td>
                    <td className="p-3 text-sm text-gray-800">{expense.category}</td>
                    <td className="p-3 text-center text-sm text-gray-800">₦{(expense.amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                    <td className="p-3 text-center">
                    <DropdownMenu>
                        <ActionButton onClick={() => setEditingExpenseId(expense.id)} color="blue">Edit</ActionButton>
                        <ActionButton onClick={() => openConfirmModal(expense.id, 'expense')} color="red" disabled={isDeleting}>Delete</ActionButton>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
        </div>
      </div>
    </div>
  );
}
