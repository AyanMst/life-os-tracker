import React from 'react';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import { Bar } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

export default function BalanceChart({ shifts = [], expenses = [] }) {
  const labels = [];
  const incomes = [0, 0, 0, 0, 0, 0];
  const expData = [0, 0, 0, 0, 0, 0]; // Monthly expense totals

  const today = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
    const monthName = d.toLocaleString(undefined, { month: 'short' });
    labels.push(monthName.charAt(0).toUpperCase() + monthName.slice(1));
  }

  // Sum income (shifts) per month
  shifts.forEach(shift => {
    const [yearStr, monthStr] = shift.work_date.split('-');
    const monthsAgo = (today.getFullYear() - parseInt(yearStr, 10)) * 12 + (today.getMonth() - (parseInt(monthStr, 10) - 1));
    if (monthsAgo >= 0 && monthsAgo <= 5) {
      incomes[5 - monthsAgo] += Number(shift.total);
    }
  });

  // Sum expenses per month
  expenses.forEach(exp => {
    const [yearStr, monthStr] = exp.expense_date.split('-');
    const monthsAgo = (today.getFullYear() - parseInt(yearStr, 10)) * 12 + (today.getMonth() - (parseInt(monthStr, 10) - 1));
    if (monthsAgo >= 0 && monthsAgo <= 5) {
      expData[5 - monthsAgo] += Number(exp.amount);
    }
  });

  const data = {
    labels: labels,
    datasets: [
      {
        label: 'Income',
        data: incomes,
        backgroundColor: '#10B981', // Green
        borderRadius: 4,
        barPercentage: 0.5,
        categoryPercentage: 0.7,
      },
      {
        label: 'Expenses',
        data: expData,
        backgroundColor: '#F59E0B', // Amber
        borderRadius: 4,
        barPercentage: 0.5,
        categoryPercentage: 0.7,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: 'index', intersect: false },
    plugins: {
      legend: { position: 'top', align: 'end', labels: { usePointStyle: true, boxWidth: 8, boxHeight: 8, color: '#64748B', font: { size: 12, family: "system-ui, sans-serif", weight: '500' }, padding: 20 } },
      tooltip: { backgroundColor: '#0F172A', titleColor: '#FFFFFF', bodyColor: '#CBD5E1', padding: 12, cornerRadius: 8, usePointStyle: true, callbacks: { label: function(context) { return context.dataset.label + ': $' + context.parsed.y; } } }
    },
    scales: {
      x: { grid: { display: false, drawBorder: false }, ticks: { color: '#94A3B8', font: { size: 11 } } },
      y: { grid: { color: '#F1F5F9', borderDash: [4, 4] }, ticks: { color: '#94A3B8', font: { size: 11 }, callback: function(value) { return '$' + value; }, maxTicksLimit: 6 }, border: { display: false } },
    },
  };

  return (
    <div className="h-72 w-full pt-4">
      <Bar data={data} options={options} />
    </div>
  );
}