import React, { useEffect, useMemo, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Tooltip, Legend } from 'chart.js';
import { Bar } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

const formatYMD = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const toCurrency = (value) => {
  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 2,
  }).format(Number(value || 0));
};

export default function Money({ t, lang, theme, user }) {
  const [jobs, setJobs] = useState([]);
  const [shifts, setShifts] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [newJobName, setNewJobName] = useState('');
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [selectedExpenseDate, setSelectedExpenseDate] = useState(formatYMD(new Date()));
  const [shiftForm, setShiftForm] = useState({
    work_date: formatYMD(new Date()),
    job_id: '',
    hours: '',
    hourly_rate: '',
    tips: '',
  });
  const [expenseForm, setExpenseForm] = useState({
    amount: '',
    description: '',
  });

  const fetchData = async () => {
    const [jobResult, shiftResult, expenseResult] = await Promise.all([
      supabase.from('jobs').select('*').order('created_at', { ascending: true }),
      supabase.from('shifts').select('*').order('work_date', { ascending: false }),
      supabase.from('expenses').select('*').order('expense_date', { ascending: false }),
    ]);

    if (jobResult.data) {
      setJobs(jobResult.data);
      setShiftForm((current) => ({
        ...current,
        job_id: current.job_id || jobResult.data[0]?.id?.toString() || '',
      }));
    }
    if (shiftResult.data) setShifts(shiftResult.data);
    if (expenseResult.data) setExpenses(expenseResult.data);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const dailyShiftTotal = useMemo(() => {
    const hours = Number(shiftForm.hours || 0);
    const hourlyRate = Number(shiftForm.hourly_rate || 0);
    const tips = Number(shiftForm.tips || 0);
    return hours * hourlyRate + tips;
  }, [shiftForm.hours, shiftForm.hourly_rate, shiftForm.tips]);

  const chartData = useMemo(() => {
    const labels = [];
    const incomes = [0, 0, 0, 0, 0, 0];
    const expenseTotals = [0, 0, 0, 0, 0, 0];
    const today = new Date();

    for (let index = 5; index >= 0; index -= 1) {
      const date = new Date(today.getFullYear(), today.getMonth() - index, 1);
      labels.push(date.toLocaleString(lang, { month: 'short' }).toUpperCase());
    }

    shifts.forEach((shift) => {
      const [year, month] = shift.work_date.split('-');
      const monthDiff = (today.getFullYear() - Number(year)) * 12 + (today.getMonth() - (Number(month) - 1));
      if (monthDiff >= 0 && monthDiff <= 5) incomes[5 - monthDiff] += Number(shift.total || 0);
    });

    expenses.forEach((expense) => {
      const [year, month] = expense.expense_date.split('-');
      const monthDiff = (today.getFullYear() - Number(year)) * 12 + (today.getMonth() - (Number(month) - 1));
      if (monthDiff >= 0 && monthDiff <= 5) expenseTotals[5 - monthDiff] += Number(expense.amount || 0);
    });

    return { labels, incomes, expenseTotals };
  }, [expenses, lang, shifts]);

  const calendarDays = useMemo(() => {
    const start = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth(), 1);
    const end = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() + 1, 0);
    const leadingDays = start.getDay();
    const days = [];

    for (let index = 0; index < leadingDays; index += 1) {
      days.push(null);
    }

    for (let day = 1; day <= end.getDate(); day += 1) {
      days.push(new Date(selectedMonth.getFullYear(), selectedMonth.getMonth(), day));
    }

    return days;
  }, [selectedMonth]);

  const expensesByDate = useMemo(() => {
    return expenses.reduce((acc, expense) => {
      acc[expense.expense_date] = acc[expense.expense_date] || [];
      acc[expense.expense_date].push(expense);
      return acc;
    }, {});
  }, [expenses]);

  const selectedExpenses = expensesByDate[selectedExpenseDate] || [];

  const handleAddJob = async () => {
    if (!newJobName.trim()) return;

    const { data } = await supabase
      .from('jobs')
      .insert([{ name: newJobName.trim(), user_id: user.id }])
      .select()
      .single();

    if (data) {
      setJobs((current) => [...current, data]);
      setShiftForm((current) => ({ ...current, job_id: current.job_id || data.id.toString() }));
      setNewJobName('');
    }
  };

  const handleDeleteJob = async (jobId) => {
    await supabase.from('jobs').delete().eq('id', jobId);
    setJobs((current) => current.filter((job) => job.id !== jobId));
    setShifts((current) => current.filter((shift) => shift.job_id !== jobId));
  };

  const handleShiftChange = (field, value) => {
    setShiftForm((current) => ({ ...current, [field]: value }));
  };

  const handleAddShift = async (event) => {
    event.preventDefault();
    if (!shiftForm.job_id) return;

    const payload = {
      user_id: user.id,
      job_id: Number(shiftForm.job_id),
      work_date: shiftForm.work_date,
      hours: Number(shiftForm.hours || 0),
      hourly_rate: Number(shiftForm.hourly_rate || 0),
      tips: Number(shiftForm.tips || 0),
    };

    const { data } = await supabase.from('shifts').insert([payload]).select().single();
    if (data) {
      setShifts((current) => [data, ...current]);
      setShiftForm((current) => ({ ...current, hours: '', tips: '' }));
    }
  };

  const handleAddExpense = async (event) => {
    event.preventDefault();
    if (!expenseForm.amount || !expenseForm.description.trim()) return;

    const { data } = await supabase
      .from('expenses')
      .insert([{
        user_id: user.id,
        expense_date: selectedExpenseDate,
        amount: Number(expenseForm.amount),
        description: expenseForm.description.trim(),
      }])
      .select()
      .single();

    if (data) {
      setExpenses((current) => [data, ...current]);
      setExpenseForm({ amount: '', description: '' });
    }
  };

  const goToMonth = (offset) => {
    setSelectedMonth((current) => new Date(current.getFullYear(), current.getMonth() + offset, 1));
  };

  return (
    <div className="space-y-10 animate-in fade-in duration-300">
      <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-[#111111] sm:p-6">
        <div className="mb-6 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">{t.sponsoredBy}</p>
            <h2 className="mt-2 text-lg font-semibold text-zinc-900 dark:text-zinc-100">{t.titleJob}</h2>
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={newJobName}
              onChange={(event) => setNewJobName(event.target.value)}
              placeholder={t.newJob}
              className="min-w-0 flex-1 rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-900 outline-none dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50 sm:w-56"
            />
            <button
              type="button"
              onClick={handleAddJob}
              className="rounded-xl bg-zinc-900 px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90 dark:bg-white dark:text-black"
            >
              {t.addJob}
            </button>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          {jobs.map((job) => (
            <div key={job.id} className="group flex items-center justify-between rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 dark:border-zinc-800 dark:bg-zinc-950">
              <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{job.name}</span>
              <button
                type="button"
                onClick={() => handleDeleteJob(job.id)}
                className="text-xs font-medium text-zinc-400 opacity-100 transition-colors hover:text-red-500 sm:opacity-0 sm:group-hover:opacity-100"
              >
                {t.delete}
              </button>
            </div>
          ))}
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1fr_0.8fr]">
        <form onSubmit={handleAddShift} className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-[#111111] sm:p-6">
          <div className="mb-5 flex items-center justify-between gap-4">
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">{t.shiftTitle}</h2>
            <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-sm font-semibold text-emerald-600 dark:text-emerald-400">
              {toCurrency(dailyShiftTotal)}
            </span>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-zinc-500">{t.shiftDate}</span>
              <input
                type="date"
                required
                value={shiftForm.work_date}
                onChange={(event) => handleShiftChange('work_date', event.target.value)}
                className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm outline-none dark:border-zinc-800 dark:bg-zinc-950"
              />
            </label>

            <label className="block">
              <span className="mb-1 block text-sm font-medium text-zinc-500">{t.shiftJob}</span>
              <select
                required
                value={shiftForm.job_id}
                onChange={(event) => handleShiftChange('job_id', event.target.value)}
                className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm outline-none dark:border-zinc-800 dark:bg-zinc-950"
              >
                <option value="">{t.noJobs}</option>
                {jobs.map((job) => (
                  <option key={job.id} value={job.id}>
                    {job.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="mb-1 block text-sm font-medium text-zinc-500">{t.shiftHours}</span>
              <input
                type="number"
                min="0"
                step="0.01"
                required
                value={shiftForm.hours}
                onChange={(event) => handleShiftChange('hours', event.target.value)}
                className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm outline-none dark:border-zinc-800 dark:bg-zinc-950"
              />
            </label>

            <label className="block">
              <span className="mb-1 block text-sm font-medium text-zinc-500">{t.shiftRate}</span>
              <input
                type="number"
                min="0"
                step="0.01"
                required
                value={shiftForm.hourly_rate}
                onChange={(event) => handleShiftChange('hourly_rate', event.target.value)}
                className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm outline-none dark:border-zinc-800 dark:bg-zinc-950"
              />
            </label>

            <label className="block sm:col-span-2">
              <span className="mb-1 block text-sm font-medium text-zinc-500">{t.shiftTips}</span>
              <input
                type="number"
                min="0"
                step="0.01"
                value={shiftForm.tips}
                onChange={(event) => handleShiftChange('tips', event.target.value)}
                className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm outline-none dark:border-zinc-800 dark:bg-zinc-950"
              />
            </label>
          </div>

          <button
            type="submit"
            className="mt-5 w-full rounded-xl bg-zinc-900 px-4 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50 dark:bg-white dark:text-black"
            disabled={!jobs.length}
          >
            {t.addShift}
          </button>
        </form>

        <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-5 dark:border-zinc-800 dark:bg-[#111111] sm:p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">{t.affiliateTitle}</p>
          <p className="mt-3 text-sm leading-6 text-zinc-600 dark:text-zinc-300">{t.affiliateBody}</p>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1fr_0.85fr]">
        <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-[#111111] sm:p-6">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">{t.expTitle}</h2>
            <div className="flex gap-2">
              <button type="button" onClick={() => goToMonth(-1)} className="grid h-8 w-8 place-items-center rounded-lg border border-zinc-200 text-zinc-500 dark:border-zinc-800">‹</button>
              <button type="button" onClick={() => goToMonth(1)} className="grid h-8 w-8 place-items-center rounded-lg border border-zinc-200 text-zinc-500 dark:border-zinc-800">›</button>
            </div>
          </div>

          <p className="mb-4 text-sm font-medium text-zinc-500">
            {selectedMonth.toLocaleString(lang, { month: 'long', year: 'numeric' })}
          </p>

          <div className="grid grid-cols-7 gap-2">
            {calendarDays.map((day, index) => {
              if (!day) return <div key={`empty-${index}`} className="aspect-square" />;
              const dateString = formatYMD(day);
              const dayExpenses = expensesByDate[dateString] || [];
              const dayTotal = dayExpenses.reduce((sum, expense) => sum + Number(expense.amount || 0), 0);
              const isSelected = selectedExpenseDate === dateString;

              return (
                <button
                  type="button"
                  key={dateString}
                  onClick={() => setSelectedExpenseDate(dateString)}
                  className={`aspect-square rounded-xl border p-2 text-left transition-colors ${
                    isSelected
                      ? 'border-zinc-900 bg-zinc-900 text-white dark:border-white dark:bg-white dark:text-black'
                      : 'border-zinc-200 bg-zinc-50 hover:border-zinc-400 dark:border-zinc-800 dark:bg-zinc-950'
                  }`}
                >
                  <span className="block text-xs font-semibold">{day.getDate()}</span>
                  {dayExpenses.length > 0 && (
                    <span className="mt-1 block truncate text-[11px] font-medium">
                      {toCurrency(dayTotal)}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        <form onSubmit={handleAddExpense} className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-[#111111] sm:p-6">
          <div className="mb-5">
            <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">{selectedExpenseDate}</h3>
            <div className="mt-3 space-y-2">
              {selectedExpenses.map((expense) => (
                <div key={expense.id} className="flex items-center justify-between gap-3 rounded-xl bg-zinc-50 px-3 py-2 text-sm dark:bg-zinc-950">
                  <span className="min-w-0 truncate text-zinc-600 dark:text-zinc-300">{expense.description}</span>
                  <span className="font-semibold text-zinc-900 dark:text-zinc-50">{toCurrency(expense.amount)}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-zinc-500">{t.expAmount}</span>
              <input
                type="number"
                min="0"
                step="0.01"
                required
                value={expenseForm.amount}
                onChange={(event) => setExpenseForm((current) => ({ ...current, amount: event.target.value }))}
                className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm outline-none dark:border-zinc-800 dark:bg-zinc-950"
              />
            </label>

            <label className="block">
              <span className="mb-1 block text-sm font-medium text-zinc-500">{t.expDescription}</span>
              <input
                type="text"
                required
                value={expenseForm.description}
                onChange={(event) => setExpenseForm((current) => ({ ...current, description: event.target.value }))}
                className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm outline-none dark:border-zinc-800 dark:bg-zinc-950"
              />
            </label>
          </div>

          <button
            type="submit"
            className="mt-5 w-full rounded-xl bg-zinc-900 px-4 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90 dark:bg-white dark:text-black"
          >
            {t.addExp}
          </button>
        </form>
      </section>

      <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-[#0A0A0A] sm:p-8">
        <h2 className="mb-8 text-sm font-semibold uppercase tracking-[0.18em] text-zinc-500 dark:text-zinc-400">{t.balTitle}</h2>
        <div className="h-72 w-full">
          <Bar
            data={{
              labels: chartData.labels,
              datasets: [
                {
                  label: t.inc,
                  data: chartData.incomes,
                  backgroundColor: theme === 'dark' ? '#E5E5E5' : '#18181B',
                  borderRadius: 4,
                  barPercentage: 0.4,
                },
                {
                  label: t.exp,
                  data: chartData.expenseTotals,
                  backgroundColor: theme === 'dark' ? '#3F3F46' : '#A1A1AA',
                  borderRadius: 4,
                  barPercentage: 0.4,
                },
              ],
            }}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: {
                  position: 'top',
                  align: 'end',
                  labels: {
                    color: theme === 'dark' ? '#A1A1AA' : '#52525B',
                    boxWidth: 8,
                    usePointStyle: true,
                    font: { size: 12 },
                  },
                },
                tooltip: {
                  backgroundColor: theme === 'dark' ? '#18181B' : '#FFFFFF',
                  titleColor: theme === 'dark' ? '#FAFAFA' : '#09090B',
                  bodyColor: theme === 'dark' ? '#A1A1AA' : '#52525B',
                  borderColor: theme === 'dark' ? '#27272A' : '#E4E4E7',
                  borderWidth: 1,
                  padding: 12,
                  cornerRadius: 8,
                },
              },
              scales: {
                x: {
                  grid: { display: false },
                  ticks: { color: theme === 'dark' ? '#71717A' : '#A1A1AA', font: { size: 11, weight: '500' } },
                },
                y: {
                  grid: { color: theme === 'dark' ? '#18181B' : '#F4F4F5' },
                  ticks: { color: theme === 'dark' ? '#71717A' : '#A1A1AA' },
                  border: { display: false },
                },
              },
            }}
          />
        </div>
      </section>
    </div>
  );
}
