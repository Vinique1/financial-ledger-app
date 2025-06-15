// src/components/InventoryManagement.jsx
import React, { useEffect, useMemo } from 'react';
import { useData } from '../DataContext';
import { useForm } from '../hooks/useForm';
import FormInput from './FormInput';
import ActionButton from './ActionButton';
import DropdownMenu from './DropdownMenu';

export default function InventoryManagement() {
  const {
    inventoryData,
    editingInventoryId, setEditingInventoryId,
    isSavingInventory, handleAddOrUpdateInventory,
    isDeleting, openConfirmModal,
    inventorySearchTerm, setInventorySearchTerm,
    inventorySortColumn, setInventorySortColumn,
    inventorySortDirection, setInventorySortDirection,
  } = useData();

  const initialInventoryFormState = { itemName: '', qtyIn: '', costPrice: '' };
  const { formData, setFormData, errors, handleChange, handleSubmit, resetForm } = useForm(initialInventoryFormState, (formData) => {
    const errors = {};
    if (!formData.itemName.trim()) errors.itemName = 'Item Name is required.';
    if (!formData.qtyIn || parseInt(formData.qtyIn, 10) < 0) errors.qtyIn = 'Quantity must be a non-negative number.';
    if (!formData.costPrice || parseFloat(formData.costPrice) < 0) errors.costPrice = 'Cost Price must be a non-negative number.';
    return errors;
  });

  useEffect(() => {
    if (editingInventoryId) {
      const itemToEdit = inventoryData.find(i => i.id === editingInventoryId);
      if (itemToEdit) setFormData(itemToEdit);
    } else {
      resetForm();
    }
  }, [editingInventoryId, inventoryData, setFormData, resetForm]);

  const onFormSubmit = (data) => {
    handleAddOrUpdateInventory(data).then(() => {
        if(!editingInventoryId) resetForm();
    });
  };

  const sortedAndFilteredInventory = useMemo(() => {
    return inventoryData
      .filter(item => 
        item.itemName && item.itemName.toLowerCase().includes(inventorySearchTerm.toLowerCase())
      )
      .sort((a, b) => {
        const aVal = a[inventorySortColumn];
        const bVal = b[inventorySortColumn];
        const order = inventorySortDirection === 'asc' ? 1 : -1;
        if (typeof aVal === 'string') return aVal.localeCompare(bVal) * order;
        return (aVal - bVal) * order;
    });
  }, [inventoryData, inventorySearchTerm, inventorySortColumn, inventorySortDirection]);

  const tableHeaders = [
    { key: 'itemName', label: 'Item Name', align: 'left' },
    { key: 'qtyIn', label: 'Qty In', align: 'center' },
    { key: 'qtyOut', label: 'Qty Out', align: 'center' },
    { key: 'currentStock', label: 'Current Stock', align: 'center' },
    { key: 'costPrice', label: 'Cost Price', align: 'center' },
    { key: 'stockValue', label: 'Stock Value', align: 'center' },
    { key: 'actions', label: '', align: 'center' },
  ];

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-xl shadow-md border border-gray-200">
        <h2 className="text-2xl font-bold text-gray-700 mb-4">{editingInventoryId ? 'Edit Inventory Item' : 'Add New Inventory Item'}</h2>
        <form onSubmit={handleSubmit(onFormSubmit)} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormInput id="itemName" label="Item Name" value={formData.itemName} onChange={handleChange} error={errors.itemName} disabled={!!editingInventoryId} />
          <FormInput id="qtyIn" label="Quantity In" type="number" value={formData.qtyIn} onChange={handleChange} error={errors.qtyIn} />
          <FormInput id="costPrice" label="Cost Price" type="number" value={formData.costPrice} onChange={handleChange} error={errors.costPrice} />
          <div className="md:col-span-2 flex justify-end space-x-2">
            <ActionButton type="submit" color="blue" disabled={isSavingInventory}>{isSavingInventory ? 'Saving...' : 'Save Item'}</ActionButton>
            <ActionButton type="button" color="gray" onClick={() => { setEditingInventoryId(null); resetForm(); }}>Cancel</ActionButton>
          </div>
        </form>
      </div>
      <div className="bg-white p-6 rounded-xl shadow-md border border-gray-200">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-gray-700">Inventory List</h2>
          <input
            type="text"
            placeholder="Search inventory..."
            value={inventorySearchTerm}
            onChange={(e) => setInventorySearchTerm(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md shadow-sm"
          />
        </div>
        <div className="overflow-y-auto max-h-[60vh] relative">
            <table className="min-w-full bg-white">
              <thead>
                <tr>
                  {tableHeaders.map(header => (
                    <th key={header.key} className={`sticky top-0 z-10 p-3 bg-gray-100 border-b text-${header.align} text-sm font-semibold text-gray-600 uppercase tracking-wider`}>{header.label}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {sortedAndFilteredInventory.map((item) => {
                  const currentStock = (item.qtyIn || 0) - (item.qtyOut || 0);
                  const stockValue = (item.qtyIn || 0) * (item.costPrice || 0);
                  return (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="p-3 text-sm text-gray-800">{item.itemName}</td>
                      <td className="p-3 text-center text-sm text-gray-800">{(item.qtyIn || 0).toLocaleString()}</td>
                      <td className="p-3 text-center text-sm text-gray-800">{(item.qtyOut || 0).toLocaleString()}</td>
                      <td className="p-3 text-center text-sm font-bold text-gray-800">{currentStock.toLocaleString()}</td>
                      <td className="p-3 text-center text-sm text-gray-800">₦{(item.costPrice || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                      <td className="p-3 text-center text-sm text-gray-800">₦{stockValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                      <td className="p-3 text-center">
                        <DropdownMenu>
                          <ActionButton onClick={() => setEditingInventoryId(item.id)} color="blue">Edit</ActionButton>
                          <ActionButton onClick={() => openConfirmModal(item.id, 'inventory')} color="red" disabled={isDeleting}>
                            {isDeleting ? 'Deleting...' : 'Delete'}
                          </ActionButton>
                        </DropdownMenu>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
        </div>
      </div>
    </div>
  );
}
