// src/components/SalesManagement.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { useData } from '../DataContext';
import { useForm } from '../hooks/useForm';
import FormInput from './FormInput';
import ActionButton from './ActionButton';
import DropdownMenu from './DropdownMenu';
import toast from 'react-hot-toast';

export default function SalesManagement() {
  const {
    salesData,
    rawInventoryData,
    editingSaleId, setEditingSaleId,
    isSavingSale, handleAddOrUpdateSale,
    isDeleting, openConfirmModal,
    salesSearchTerm, setSalesSearchTerm,
    salesSortColumn, setSalesSortColumn,
    salesSortDirection, setSalesSortDirection,
  } = useData();

  const initialSaleFormState = {
    date: new Date().toISOString().slice(0, 10),
    item: '',
    customer: '',
    qty: '',
    cost: '',
    price: '',
    totalCost: '',
    profit: '',
  };
  
  const validateSaleForm = (formData) => {
      const errors = {};
      if (!formData.date) errors.date = 'Sale Date is required.';
      if (!formData.item) errors.item = 'Item is required.';
      if (!formData.customer.trim()) errors.customer = 'Customer name is required.';
      if (!formData.qty || parseFloat(formData.qty) <= 0) errors.qty = 'Quantity must be a positive number.';
      if (!formData.price || parseFloat(formData.price) <= 0) errors.price = 'Price must be a positive number.';
      return errors;
  };

  const { formData, setFormData, errors, handleChange, handleSubmit, resetForm } = useForm(initialSaleFormState, validateSaleForm);

  useEffect(() => {
    if (editingSaleId) {
      const saleToEdit = salesData.find(s => s.id === editingSaleId);
      if (saleToEdit) {
        setFormData({
            date: saleToEdit.date,
            item: saleToEdit.item,
            customer: saleToEdit.customer,
            qty: saleToEdit.qty,
            cost: saleToEdit.cost,
            price: saleToEdit.price,
            totalCost: (saleToEdit.qty * saleToEdit.cost).toFixed(2),
            profit: ((saleToEdit.qty * saleToEdit.price) - (saleToEdit.qty * saleToEdit.cost)).toFixed(2),
        });
      }
    } else {
      resetForm();
    }
  }, [editingSaleId, salesData, setFormData, resetForm]);
  
  useEffect(() => {
      const { item, qty, price } = formData;
      const selectedItem = rawInventoryData.find(inv => inv.itemName === item);
      if (selectedItem && qty && price) {
          const numQty = parseFloat(qty);
          const numPrice = parseFloat(price);
          const cost = selectedItem.costPrice || 0;
          const totalCost = (numQty * cost).toFixed(2);
          const totalSale = (numQty * numPrice).toFixed(2);
          const profit = (totalSale - totalCost).toFixed(2);
          setFormData(prev => ({ ...prev, cost, totalCost, profit }));
      }
  }, [formData.item, formData.qty, formData.price, rawInventoryData, setFormData]);

  const onFormSubmit = (data) => {
    const oldSale = editingSaleId ? salesData.find(s => s.id === editingSaleId) : null;
    handleAddOrUpdateSale(data, oldSale).then(() => {
        if (!editingSaleId) resetForm();
    });
  };

  const sortedSales = useMemo(() => {
    return [...salesData].sort((a, b) => {
        const aVal = a[salesSortColumn];
        const bVal = b[salesSortColumn];
        const order = salesSortDirection === 'asc' ? 1 : -1;

        if (typeof aVal === 'string') return aVal.localeCompare(bVal) * order;
        return (aVal - bVal) * order;
    });
  }, [salesData, salesSortColumn, salesSortDirection]);

  const tableHeaders = [
    { key: 'date', label: 'Date', align: 'left' },
    { key: 'item', label: 'Item', align: 'left' },
    { key: 'customer', label: 'Customer', align: 'left' },
    { key: 'qty', label: 'Qty', align: 'center' },
    { key: 'price', label: 'Price', align: 'center' },
    { key: 'cost', label: 'Cost', align: 'center' },
    { key: 'profit', label: 'Profit', align: 'center' },
    { key: 'actions', label: '', align: 'center' },
  ];

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-xl shadow-md border border-gray-200">
        <h2 className="text-2xl font-bold text-gray-700 mb-4">{editingSaleId ? 'Edit Sale' : 'Add New Sale'}</h2>
        <form onSubmit={handleSubmit(onFormSubmit)} className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <FormInput id="date" label="Sale Date" type="date" value={formData.date} onChange={handleChange} error={errors.date} />
            <FormInput id="item" label="Item" type="select" value={formData.item} onChange={handleChange} error={errors.item}>
                <option value="">Select an item</option>
                {rawInventoryData.map(inv => <option key={inv.id} value={inv.itemName}>{inv.itemName}</option>)}
            </FormInput>
            <FormInput id="customer" label="Customer" value={formData.customer} onChange={handleChange} error={errors.customer} />
            <FormInput id="qty" label="Quantity" type="number" value={formData.qty} onChange={handleChange} error={errors.qty} />
            <FormInput id="price" label="Sale Price per Unit" type="number" value={formData.price} onChange={handleChange} error={errors.price} />
            <FormInput id="cost" label="Cost per Unit" type="number" value={formData.cost} readOnly disabled />
            <FormInput id="totalCost" label="Total Cost" type="number" value={formData.totalCost} readOnly disabled />
            <FormInput id="profit" label="Profit" type="number" value={formData.profit} readOnly disabled />
            <div className="md:col-span-3 flex justify-end space-x-2">
                <ActionButton type="submit" color="blue" disabled={isSavingSale}>{isSavingSale ? 'Saving...' : 'Save Sale'}</ActionButton>
                <ActionButton type="button" color="gray" onClick={() => { setEditingSaleId(null); resetForm(); }}>Cancel</ActionButton>
            </div>
        </form>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-md border border-gray-200">
          <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-gray-700">Sales Records</h2>
              <input
                  type="text"
                  placeholder="Search sales..."
                  value={salesSearchTerm}
                  onChange={(e) => setSalesSearchTerm(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md shadow-sm"
              />
          </div>
          <table className="min-w-full bg-white">
              <thead>
                  <tr>
                      {tableHeaders.map(header => (
                          <th key={header.key} className={`p-3 text-${header.align} text-sm font-semibold text-gray-600 uppercase tracking-wider`}>{header.label}</th>
                      ))}
                  </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                  {sortedSales.map(sale => {
                      const totalCost = sale.qty * sale.cost;
                      const totalSale = sale.qty * sale.price;
                      const profit = totalSale - totalCost;
                      return (
                          <tr key={sale.id} className="hover:bg-gray-50">
                              <td className="p-3 text-sm text-gray-800">{sale.date}</td>
                              <td className="p-3 text-sm text-gray-800">{sale.item}</td>
                              <td className="p-3 text-sm text-gray-800">{sale.customer}</td>
                              <td className="p-3 text-center text-sm text-gray-800">{sale.qty}</td>
                              <td className="p-3 text-center text-sm text-gray-800">₦{sale.price.toFixed(2)}</td>
                              <td className="p-3 text-center text-sm text-gray-800">₦{totalCost.toFixed(2)}</td>
                              <td className="p-3 text-center text-sm text-gray-800">₦{profit.toFixed(2)}</td>
                              <td className="p-3 text-center">
                                  <DropdownMenu>
                                      <ActionButton onClick={() => setEditingSaleId(sale.id)} color="blue">Edit</ActionButton>
                                      <ActionButton onClick={() => openConfirmModal(sale.id, 'sale')} color="red" disabled={isDeleting}>
                                          {isDeleting ? 'Deleting...' : 'Delete'}
                                      </ActionButton>
                                  </DropdownMenu>
                              </td>
                          </tr>
                      );
                  })}
                  {sortedSales.length === 0 && (
                      <tr>
                          <td colSpan={tableHeaders.length} className="p-4 text-center text-gray-500">No sales records found.</td>
                      </tr>
                  )}
              </tbody>
          </table>
      </div>
    </div>
  );
}
