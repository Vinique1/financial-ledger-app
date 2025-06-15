// src/components/SalesManagement.jsx
import React, { useEffect, useMemo } from 'react';
import { useData } from '../DataContext';
import { useForm } from '../hooks/useForm';
import FormInput from './FormInput';
import ActionButton from './ActionButton';
import DropdownMenu from './DropdownMenu';
import SearchableSelect from './SearchableSelect';

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

  const initialSaleFormState = { date: new Date().toISOString().slice(0, 10), item: '', customer: '', qty: '', price: '', cost: '' };
  const { formData, setFormData, errors, handleChange, handleSubmit, resetForm } = useForm(initialSaleFormState, (formData) => {
      const errors = {};
      if (!formData.date) errors.date = 'Sale Date is required.';
      if (!formData.item) errors.item = 'Item is required.';
      if (!formData.customer.trim()) errors.customer = 'Customer name is required.';
      if (!formData.qty || parseFloat(formData.qty) <= 0) errors.qty = 'Quantity must be a positive number.';
      if (!formData.price || parseFloat(formData.price) <= 0) errors.price = 'Price must be a positive number.';
      return errors;
  });

  useEffect(() => {
    if (editingSaleId) {
      const saleToEdit = salesData.find(s => s.id === editingSaleId);
      if (saleToEdit) setFormData(saleToEdit);
    } else {
      resetForm();
    }
  }, [editingSaleId, salesData, setFormData, resetForm]);
  
  useEffect(() => {
      const selectedItem = rawInventoryData.find(inv => inv.itemName === formData.item);
      if (selectedItem) {
          setFormData(prev => ({ ...prev, cost: selectedItem.costPrice || 0 }));
      }
  }, [formData.item, rawInventoryData, setFormData]);

  const onFormSubmit = (data) => {
    const oldSale = editingSaleId ? salesData.find(s => s.id === editingSaleId) : null;
    handleAddOrUpdateSale(data, oldSale).then(() => {
        if (!editingSaleId) resetForm();
    });
  };

  const inventoryOptions = useMemo(() => rawInventoryData.map(inv => ({ value: inv.itemName, label: inv.itemName })), [rawInventoryData]);

  const sortedAndFilteredSales = useMemo(() => {
    return salesData
      .filter(sale => 
        (sale.item && sale.item.toLowerCase().includes(salesSearchTerm.toLowerCase())) ||
        (sale.customer && sale.customer.toLowerCase().includes(salesSearchTerm.toLowerCase()))
      )
      .sort((a, b) => {
        const aVal = a[salesSortColumn];
        const bVal = b[salesSortColumn];
        const order = salesSortDirection === 'asc' ? 1 : -1;
        if (typeof aVal === 'string') return aVal.localeCompare(bVal) * order;
        return (aVal - bVal) * order;
    });
  }, [salesData, salesSearchTerm, salesSortColumn, salesSortDirection]);
  
  const tableHeaders = [ { key: 'date', label: 'Date', align: 'left' }, { key: 'item', label: 'Item', align: 'left' }, { key: 'customer', label: 'Customer', align: 'left' }, { key: 'qty', label: 'Qty', align: 'center' }, { key: 'price', label: 'Price', align: 'center' }, { key: 'cost', label: 'Cost', align: 'center' }, { key: 'profit', label: 'Profit', align: 'center' }, { key: 'actions', label: '', align: 'center' } ];

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-xl shadow-md border border-gray-200">
        <h2 className="text-2xl font-bold text-gray-700 mb-4">{editingSaleId ? 'Edit Sale' : 'Add New Sale'}</h2>
        <form onSubmit={handleSubmit(onFormSubmit)} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <FormInput id="date" label="Sale Date" type="date" value={formData.date} onChange={handleChange} error={errors.date} />
            <div>
              <label htmlFor="item" className="block text-sm font-medium text-gray-700">Item</label>
              <SearchableSelect options={inventoryOptions} value={formData.item} onChange={(val) => handleChange({ target: { id: 'item', value: val }})} placeholder="Search for an item..." />
               {errors.item && <p className="text-red-500 text-xs mt-1">{errors.item}</p>}
            </div>
            <FormInput id="customer" label="Customer" value={formData.customer} onChange={handleChange} error={errors.customer} />
            <FormInput id="qty" label="Quantity" type="number" value={formData.qty} onChange={handleChange} error={errors.qty} />
            <FormInput id="price" label="Sale Price per Unit" type="number" value={formData.price} onChange={handleChange} error={errors.price} />
            <FormInput id="cost" label="Cost per Unit" type="number" value={formData.cost} readOnly disabled />
            <div className="lg:col-span-3 flex justify-end space-x-2">
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
          <div className="overflow-y-auto max-h-[60vh] relative">
            <table className="min-w-full bg-white">
                <thead>
                    <tr>{tableHeaders.map(header => (<th key={header.key} className={`sticky top-0 z-10 p-3 bg-gray-100 border-b text-${header.align} text-sm font-semibold text-gray-600 uppercase tracking-wider`}>{header.label}</th>))}</tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                    {sortedAndFilteredSales.map(sale => {
                        const totalCost = (sale.qty || 0) * (sale.cost || 0);
                        const totalSale = (sale.qty || 0) * (sale.price || 0);
                        const profit = totalSale - totalCost;
                        return (
                            <tr key={sale.id} className="hover:bg-gray-50">
                                <td className="p-3 text-sm text-gray-800">{sale.date}</td>
                                <td className="p-3 text-sm text-gray-800">{sale.item}</td>
                                <td className="p-3 text-sm text-gray-800">{sale.customer}</td>
                                <td className="p-3 text-center text-sm text-gray-800">{(sale.qty || 0).toLocaleString()}</td>
                                <td className="p-3 text-center text-sm text-gray-800">₦{(sale.price || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                <td className="p-3 text-center text-sm text-gray-800">₦{totalCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                <td className="p-3 text-center text-sm text-gray-800">₦{profit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                <td className="p-3 text-center">
                                    <DropdownMenu>
                                        <ActionButton onClick={() => setEditingSaleId(sale.id)} color="blue">Edit</ActionButton>
                                        <ActionButton onClick={() => openConfirmModal(sale.id, 'sale')} color="red" disabled={isDeleting}>Delete</ActionButton>
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
