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

  const monthlySalesChartData = useMemo(() => {
    const months = {};
    salesData.forEach(sale => {
      if (sale.date && typeof sale.date === 'string') {
        try {
          const month = format(parseISO(sale.date), 'yyyy-MM');
          if (!months[month]) {
            months[month] = 0;
          }
          months[month] += (sale.qty * sale.price);
        } catch (e) {
          console.warn(`Could not parse date for sale ${sale.id}:`, sale.date);
        }
      }
    });

    const sortedMonths = Object.keys(months).sort();
    return {
      labels: sortedMonths.map(month => format(parseISO(month), 'MMM yyyy')),
      datasets: [{
        label: 'Total Sales',
        data: sortedMonths.map(month => months[month]),
        borderColor: 'rgb(54, 162, 235)',
        backgroundColor: 'rgba(54, 162, 235, 0.5)',
        fill: true,
      }],
    };
  }, [salesData]);

  const monthlyExpensesChartData = useMemo(() => {
    const months = {};
    expensesData.forEach(expense => {
      if (expense.date && typeof expense.date === 'string') {
        try {
          const month = format(parseISO(expense.date), 'yyyy-MM');
          if (!months[month]) {
            months[month] = 0;
          }
          months[month] += expense.amount;
        } catch (e) {
          console.warn(`Could not parse date for expense ${expense.id}:`, expense.date);
        }
      }
    });

    const sortedMonths = Object.keys(months).sort();
    return {
      labels: sortedMonths.map(month => format(parseISO(month), 'MMM yyyy')),
      datasets: [{
        label: 'Total Expenses',
        data: sortedMonths.map(month => months[month]),
        borderColor: 'rgb(255, 99, 132)',
        backgroundColor: 'rgba(255, 99, 132, 0.5)',
        fill: true,
      }],
    };
  }, [expensesData]);

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
        backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40'],
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
        backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40', '#C9CBCF'],
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
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-xl font-semibold mb-4 text-gray-800">Sales Over Time</h3>
          <div className="h-96">
              <Line data={monthlySalesChartData} options={{ responsive: true, maintainAspectRatio: false }} />
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-xl font-semibold mb-4 text-gray-800">Expenses Over Time</h3>
          <div className="h-96">
              <Line data={monthlyExpensesChartData} options={{ responsive: true, maintainAspectRatio: false }} />
          </div>
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
