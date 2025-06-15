// src/components/DashboardContent.jsx
import React, { useMemo } from 'react';
import { format, parseISO, differenceInDays, getWeek, getYear } from 'date-fns';
import { Line, Doughnut, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  BarElement,
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
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export default function DashboardContent({ salesData, expensesData, inventoryData, startDateFilter, endDateFilter }) {

  const kpiData = useMemo(() => {
    const totalSales = salesData.reduce((acc, sale) => acc + ((sale.qty || 0) * (sale.price || 0)), 0);
    const totalCost = salesData.reduce((acc, sale) => acc + ((sale.qty || 0) * (sale.cost || 0)), 0);
    const totalExpenses = expensesData.reduce((acc, expense) => acc + (expense.amount || 0), 0);
    const grossProfit = totalSales - totalCost;
    const netProfit = grossProfit - totalExpenses;
    const totalInventoryValue = inventoryData.reduce((acc, item) => {
        const stock = (item.qtyIn || 0) - (item.qtyOut || 0);
        return acc + (stock * (item.costPrice || 0));
    }, 0);

    return { totalSales, grossProfit, totalExpenses, netProfit, totalInventoryValue };
  }, [salesData, expensesData, inventoryData]);
  
  const lineChartData = useMemo(() => {
    const emptyChart = { labels: [], datasets: [] };
    if (!startDateFilter || !endDateFilter) {
      return { salesChart: emptyChart, expensesChart: emptyChart };
    }

    const start = parseISO(startDateFilter);
    const end = parseISO(endDateFilter);
    const dayCount = differenceInDays(end, start) + 1;

    let timeUnit, dateFormat;

    if (dayCount <= 60) {
      timeUnit = 'day';
      dateFormat = 'MMM d';
    } else if (dayCount <= 112) { // Approx 16 weeks
      timeUnit = 'week';
      dateFormat = (date) => `W${getWeek(date, { weekStartsOn: 1 })} '${getYear(date).toString().slice(-2)}`;
    } else {
      timeUnit = 'month';
      dateFormat = 'MMM yy';
    }

    const aggregateData = (data, valueField, dateField) => {
        const aggregation = {};
        data.forEach(item => {
            if (item[dateField] && typeof item[dateField] === 'string') {
                try {
                    const date = parseISO(item[dateField]);
                    let key;
                    if (timeUnit === 'day') {
                        key = format(date, 'yyyy-MM-dd');
                    } else if (timeUnit === 'week') {
                        key = `${getYear(date)}-${getWeek(date, { weekStartsOn: 1 })}`;
                    } else { // month
                        key = format(date, 'yyyy-MM');
                    }
                    if (!aggregation[key]) aggregation[key] = 0;
                    aggregation[key] += valueField === 'sales' ? ((item.qty || 0) * (item.price || 0)) : (item.amount || 0);
                } catch (e) {
                    console.warn(`Could not parse date for item ${item.id}:`, item[dateField]);
                }
            }
        });
        return aggregation;
    };
    
    const aggregatedSales = aggregateData(salesData, 'sales', 'date');
    const aggregatedExpenses = aggregateData(expensesData, 'expenses', 'date');

    const allKeys = [...new Set([...Object.keys(aggregatedSales), ...Object.keys(aggregatedExpenses)])].sort();
    
    const labels = allKeys.map(key => {
        if (timeUnit === 'day') return format(parseISO(key), dateFormat);
        if (timeUnit === 'week') {
            const [year, weekNum] = key.split('-');
            return `W${weekNum} '${year.slice(-2)}`;
        }
        return format(parseISO(key), dateFormat);
    });

    const salesValues = allKeys.map(key => aggregatedSales[key] || 0);
    const expensesValues = allKeys.map(key => aggregatedExpenses[key] || 0);

    return {
        salesChart: {
            labels,
            datasets: [{ label: 'Total Sales', data: salesValues, borderColor: 'rgb(54, 162, 235)', backgroundColor: 'rgba(54, 162, 235, 0.5)', fill: true }],
        },
        expensesChart: {
            labels,
            datasets: [{ label: 'Total Expenses', data: expensesValues, borderColor: 'rgb(255, 99, 132)', backgroundColor: 'rgba(255, 99, 132, 0.5)', fill: true }],
        }
    };
  }, [salesData, expensesData, startDateFilter, endDateFilter]);


  const expenseCategoryChartData = useMemo(() => {
    const categories = expensesData.reduce((acc, expense) => {
      const category = expense.category || 'Uncategorized';
      acc[category] = (acc[category] || 0) + (expense.amount || 0);
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

  // --- OPTIMIZATION APPLIED HERE ---
  // 1. Calculate the value of all inventory items just once.
  const inventoryValues = useMemo(() =>
    inventoryData.map(item => ({
      name: item.itemName,
      value: ((item.qtyIn || 0) - (item.qtyOut || 0)) * (item.costPrice || 0),
    })),
  [inventoryData]);

  // 2. Use the pre-calculated values to get the top 10.
  const top10InventoryChartData = useMemo(() => {
    const top10 = [...inventoryValues]
      .sort((a, b) => b.value - a.value) // Sort descending
      .slice(0, 10);

    return {
      labels: top10.map(item => item.name),
      datasets: [{
        label: 'Inventory Value',
        data: top10.map(item => item.value),
        backgroundColor: '#36A2EB',
      }],
    };
  }, [inventoryValues]); // Depend on the pre-calculated `inventoryValues`

  // 3. Use the same pre-calculated values to get the bottom 10.
  const bottom10InventoryChartData = useMemo(() => {
    const bottom10 = [...inventoryValues]
      .sort((a, b) => a.value - b.value) // Sort ascending
      .slice(0, 10);

    return {
      labels: bottom10.map(item => item.name),
      datasets: [{
        label: 'Inventory Value',
        data: bottom10.map(item => item.value),
        backgroundColor: '#FF6384',
      }],
    };
  }, [inventoryValues]); // Depend on the pre-calculated `inventoryValues`
  // --- END OF OPTIMIZATION ---


  const KpiCard = ({ title, value, accentColor, isCurrency = true }) => {
    const valueColor = title === 'Net Profit/Loss' 
      ? (value >= 0 ? 'text-green-600' : 'text-red-600') 
      : 'text-gray-900';
  
    return (
      <div className="bg-white rounded-lg shadow-md flex overflow-hidden">
        <div className={`w-1.5 ${accentColor}`}></div>
        <div className="p-4 flex-1">
          <h3 className="text-sm font-medium text-gray-500">{title}</h3>
          <p className={`text-2xl font-bold mt-1 ${valueColor}`}>
            {isCurrency ? `₦${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : value}
          </p>
        </div>
      </div>
    );
  };
  
  const barChartOptions = {
    indexAxis: 'y',
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
        legend: { display: false },
    },
    scales: {
        x: {
            beginAtZero: true,
            title: { display: true, text: 'Value (₦)' },
        },
    },
  };

  const kpiCards = [
    { title: "Total Sales", value: kpiData.totalSales, color: "bg-blue-500" },
    { title: "Gross Profit", value: kpiData.grossProfit, color: "bg-purple-500" },
    { title: "Total Expenses", value: kpiData.totalExpenses, color: "bg-red-500" },
    { title: "Net Profit/Loss", value: kpiData.netProfit, color: "bg-green-500" },
    { title: "Total Inventory Value", value: kpiData.totalInventoryValue, color: "bg-yellow-500" },
  ];

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
        {kpiCards.map(card => (
          <KpiCard key={card.title} title={card.title} value={card.value} accentColor={card.color} />
        ))}
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-xl font-semibold mb-4 text-gray-800">Sales Over Time</h3>
          <div className="h-96">
              <Line data={lineChartData.salesChart} options={{ responsive: true, maintainAspectRatio: false }} />
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-xl font-semibold mb-4 text-gray-800">Expenses Over Time</h3>
          <div className="h-96">
              <Line data={lineChartData.expensesChart} options={{ responsive: true, maintainAspectRatio: false }} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-lg shadow-md flex flex-col items-center">
            <h3 className="text-xl font-semibold mb-4 text-gray-800">Expense Breakdown</h3>
            {expenseCategoryChartData.labels.length > 0 ? (
                <div className="relative h-80 w-80">
                    <Doughnut data={expenseCategoryChartData} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom' } } }} />
                </div>
            ) : <p className="text-gray-500 text-center py-10">No expense data to categorize.</p>}
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-xl font-semibold mb-4 text-gray-800">Top 10 Most Valuable Items</h3>
            {top10InventoryChartData.labels.length > 0 ? (
                <div className="relative h-96">
                    <Bar data={top10InventoryChartData} options={barChartOptions} />
                </div>
            ) : <p className="text-gray-500 text-center py-10">No inventory with value to display.</p>}
        </div>
      </div>
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-xl font-semibold mb-4 text-gray-800">Bottom 10 Least Valuable Items</h3>
        {bottom10InventoryChartData.labels.length > 0 ? (
            <div className="relative h-96">
                <Bar data={bottom10InventoryChartData} options={barChartOptions} />
            </div>
        ) : <p className="text-gray-500 text-center py-10">No inventory with value to display.</p>}
      </div>
    </div>
  );
}
