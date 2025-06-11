// src/components/DashboardContent.jsx
import React, { useMemo } from 'react';
import { format, parseISO } from 'date-fns';
import { Line, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export default function DashboardContent({ salesData, expensesData, inventoryData }) {

  const kpiData = useMemo(() => {
    const totalSales = salesData.reduce((acc, sale) => acc + (sale.qty * sale.price), 0);
    const totalCost = salesData.reduce((acc, sale) => acc + (sale.qty * sale.cost), 0);
    const totalExpenses = expensesData.reduce((acc, expense) => acc + expense.amount, 0);
    const grossProfit = totalSales - totalCost;
    const netProfit = grossProfit - totalExpenses;
    return { totalSales, grossProfit, totalExpenses, netProfit };
  }, [salesData, expensesData]);

  const monthlyChartData = useMemo(() => {
    const months = {};
    const processData = (data, valueField, dateField) => {
        data.forEach(item => {
            // Check if date exists and is a valid string
            if (item[dateField] && typeof item[dateField] === 'string') {
                try {
                    const month = format(parseISO(item[dateField]), 'yyyy-MM');
                    if (!months[month]) {
                        months[month] = { sales: 0, expenses: 0 };
                    }
                    months[month][valueField] += (valueField === 'sales' ? (item.qty * item.price) : item.amount);
                } catch (e) {
                    console.warn(`Could not parse date for item ${item.id}:`, item[dateField]);
                }
            }
        });
    };
    
    processData(salesData, 'sales', 'date');
    processData(expensesData, 'expenses', 'date');

    const sortedMonths = Object.keys(months).sort();
    const labels = sortedMonths.map(month => format(parseISO(month), 'MMM yyyy'));
    const salesValues = sortedMonths.map(month => months[month].sales);
    const expensesValues = sortedMonths.map(month => months[month].expenses);

    return {
      labels,
      datasets: [
        {
          label: 'Total Sales',
          data: salesValues,
          borderColor: 'rgb(54, 162, 235)',
          backgroundColor: 'rgba(54, 162, 235, 0.5)',
          fill: true,
        },
        {
          label: 'Total Expenses',
          data: expensesValues,
          borderColor: 'rgb(255, 99, 132)',
          backgroundColor: 'rgba(255, 99, 132, 0.5)',
          fill: true,
        },
      ],
    };
  }, [salesData, expensesData]);

  const expenseCategoryChartData = useMemo(() => {
    const categories = expensesData.reduce((acc, expense) => {
        const category = expense.category || 'Uncategorized';
        acc[category] = (acc[category] || 0) + expense.amount;
        return acc;
    }, {});
    
    return {
      labels: Object.keys(categories),
      datasets: [{
        data: Object.values(categories),
        backgroundColor: [
          '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40'
        ],
      }],
    };
  }, [expensesData]);

  const inventoryValueChartData = useMemo(() => {
    const inventoryValues = inventoryData.map(item => ({
      name: item.itemName,
      value: (item.qtyIn - item.qtyOut) * item.costPrice,
    }));

    return {
      labels: inventoryValues.map(item => item.name),
      datasets: [{
        data: inventoryValues.map(item => item.value),
        backgroundColor: [
          '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40', '#C9CBCF'
        ],
      }],
    };
  }, [inventoryData]);

  const KpiCard = ({ title, value, isCurrency = true }) => (
    <div className="bg-white p-6 rounded-lg shadow-md text-center">
      <h3 className="text-lg font-semibold text-gray-500">{title}</h3>
      <p className="text-3xl font-bold text-gray-800 mt-2">
        {isCurrency ? `₦${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : value}
      </p>
    </div>
  );

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KpiCard title="Total Sales" value={kpiData.totalSales} />
        <KpiCard title="Gross Profit" value={kpiData.grossProfit} />
        <KpiCard title="Total Expenses" value={kpiData.totalExpenses} />
        <KpiCard title="Net Profit" value={kpiData.netProfit} />
      </div>

      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-xl font-semibold mb-4 text-gray-800">Sales vs Expenses Over Time</h3>
        <div className="h-96">
            <Line data={monthlyChartData} options={{ responsive: true, maintainAspectRatio: false }} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-lg shadow-md flex flex-col items-center">
            <h3 className="text-xl font-semibold mb-4 text-gray-800">Expense Breakdown</h3>
            {expenseCategoryChartData.labels.length > 0 ? (
                <div className="relative h-80 w-80">
                    <Doughnut data={expenseCategoryChartData} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'right' } } }} />
                </div>
            ) : <p className="text-gray-500 text-center py-10">No expense data to categorize.</p>}
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md flex flex-col items-center">
            <h3 className="text-xl font-semibold mb-4 text-gray-800">Inventory Value Distribution</h3>
            {inventoryValueChartData.labels.length > 0 ? (
                <div className="relative h-80 w-80">
                    <Doughnut data={inventoryValueChartData} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'right' } } }} />
                </div>
            ) : <p className="text-gray-500 text-center py-10">No inventory with value to display.</p>}
        </div>
      </div>
    </div>
  );
}
