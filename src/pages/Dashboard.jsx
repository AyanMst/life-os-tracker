import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Filler } from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Filler);

const formatYMD = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export default function Dashboard({ t, lang, theme, user }) {
  const [habits, setHabits] = useState([]);
  const [logs, setLogs] = useState([]);
  const [newHabitName, setNewHabitName] = useState('');
  const [selectedHabit, setSelectedHabit] = useState(null);
  const [selectedDate, setSelectedDate] = useState('');
  const [visibleMonth, setVisibleMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [logValue, setLogValue] = useState('');
  const [logNotes, setLogNotes] = useState('');

  const fetchHabits = async () => {
    const { data } = await supabase.from('habits').select('*').order('created_at', { ascending: true });
    if (data) setHabits(data);
  };

  const fetchLogs = async () => {
    const { data } = await supabase.from('habit_logs').select('*').order('log_date', { ascending: false });
    if (data) setLogs(data);
  };

  useEffect(() => {
    fetchHabits();
    fetchLogs();
  }, []);

  const rollingWindow = React.useMemo(() => {
    const days = Array.from({ length: 14 }, (_, index) => {
      const day = new Date();
      day.setDate(day.getDate() - 13 + index);
      return day;
    });
    const dateStrings = days.map(formatYMD);
    const labels = days.map((day) => `${day.getDate()}/${day.getMonth() + 1}`);
    const globalPoints = dateStrings.map((dateString) => {
      return logs.filter((log) => log.log_date === dateString).length;
    });

    return { days, dateStrings, labels, globalPoints };
  }, [logs]);

  const activitySeries = React.useMemo(() => {
    return habits.reduce((acc, habit) => {
      acc[habit.id] = rollingWindow.dateStrings.map((dateString) => {
        const log = logs.find((item) => Number(item.habit_id) === Number(habit.id) && item.log_date === dateString);
        return log ? Number(log.value ?? 1) : 0;
      });
      return acc;
    }, {});
  }, [habits, logs, rollingWindow.dateStrings]);

  const timeline = React.useMemo(() => {
    return logs
      .map((log) => ({
        ...log,
        habit: habits.find((habit) => Number(habit.id) === Number(log.habit_id)),
      }))
      .filter((log) => log.habit)
      .sort((a, b) => `${b.log_date}${b.id}`.localeCompare(`${a.log_date}${a.id}`))
      .slice(0, 12);
  }, [habits, logs]);

  const calendarDays = React.useMemo(() => {
    const monthStart = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth(), 1);
    const monthEnd = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() + 1, 0);
    const days = [];

    for (let index = 0; index < monthStart.getDay(); index += 1) {
      days.push(null);
    }

    for (let day = 1; day <= monthEnd.getDate(); day += 1) {
      days.push(new Date(visibleMonth.getFullYear(), visibleMonth.getMonth(), day));
    }

    return days;
  }, [visibleMonth]);

  const chartOptions = React.useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: { mode: 'index', intersect: false },
    },
    scales: {
      x: {
        display: true,
        grid: { display: false },
        ticks: { color: theme === 'dark' ? '#71717A' : '#A1A1AA' },
      },
      y: {
        display: true,
        min: 0,
        grid: { color: theme === 'dark' ? '#27272A' : '#F4F4F5' },
        ticks: { stepSize: 1, color: theme === 'dark' ? '#71717A' : '#A1A1AA' },
      },
    },
  }), [theme]);

  const sparkOptions = React.useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false }, tooltip: { enabled: false } },
    scales: {
      x: { display: false },
      y: { display: false, min: 0 },
    },
  }), []);

  const handleAddHabit = async () => {
    if (!newHabitName.trim()) return;

    const { data } = await supabase
      .from('habits')
      .insert([{ name: newHabitName.trim(), user_id: user.id }])
      .select()
      .single();

    if (data) {
      setHabits((current) => [...current, data]);
      setNewHabitName('');
    }
  };

  const handleDeleteHabit = async (habitId, event) => {
    event.stopPropagation();
    await supabase.from('habits').delete().eq('id', habitId);
    setHabits((current) => current.filter((habit) => habit.id !== habitId));
    setLogs((current) => current.filter((log) => log.habit_id !== habitId));
  };

  const openDay = (dateString) => {
    if (!selectedHabit) return;

    const existingLog = logs.find((log) => Number(log.habit_id) === Number(selectedHabit.id) && log.log_date === dateString);
    setSelectedDate(dateString);
    setLogValue(existingLog?.value ?? '');
    setLogNotes(existingLog?.notes || '');
  };

  const handleSaveLog = async (event) => {
    event.preventDefault();
    if (!selectedHabit || !selectedDate) return;

    const existingLog = logs.find((log) => Number(log.habit_id) === Number(selectedHabit.id) && log.log_date === selectedDate);
    const payload = {
      user_id: user.id,
      habit_id: selectedHabit.id,
      log_date: selectedDate,
      value: logValue === '' ? null : Number(logValue),
      notes: logNotes,
    };

    if (existingLog) {
      await supabase.from('habit_logs').update(payload).eq('id', existingLog.id);
    } else {
      await supabase.from('habit_logs').insert([payload]);
    }

    await fetchLogs();
    setSelectedDate('');
  };

  const moveVisibleMonth = (offset) => {
    setVisibleMonth((current) => new Date(current.getFullYear(), current.getMonth() + offset, 1));
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <div className="space-y-6">
        <div className="flex gap-3 border-b border-zinc-200 pb-4 dark:border-zinc-800">
          <input
            type="text"
            value={newHabitName}
            onChange={(event) => setNewHabitName(event.target.value)}
            placeholder={t.addPh}
            className="min-w-0 flex-1 bg-transparent text-lg text-zinc-900 outline-none placeholder:text-zinc-400 dark:text-zinc-50"
          />
          <button
            type="button"
            onClick={handleAddHabit}
            className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-semibold text-zinc-50 dark:bg-zinc-100 dark:text-zinc-900"
          >
            {t.addBtn}
          </button>
        </div>

        <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-[#111111] sm:p-6">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">{t.masterTitle}</h2>
          <p className="mb-6 text-sm text-zinc-500">{t.masterDesc}</p>
          <div className="h-48 w-full">
            <Line
              data={{
                labels: rollingWindow.labels,
                datasets: [{
                  data: rollingWindow.globalPoints,
                  borderColor: '#10B981',
                  backgroundColor: 'rgba(16, 185, 129, 0.08)',
                  borderWidth: 2,
                  fill: true,
                  tension: 0.3,
                  pointRadius: 2,
                }],
              }}
              options={chartOptions}
            />
          </div>
        </section>

        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {habits.map((habit) => (
            <button
              type="button"
              key={habit.id}
              onClick={() => {
                setSelectedHabit(habit);
                setSelectedDate('');
              }}
              className="group rounded-2xl border border-zinc-200 bg-white p-5 text-left shadow-sm transition-colors hover:border-emerald-500/50 dark:border-zinc-800 dark:bg-[#111111]"
            >
              <div className="mb-4 flex items-center justify-between gap-3">
                <h3 className="min-w-0 truncate text-base font-semibold text-zinc-900 dark:text-zinc-100">{habit.name}</h3>
                <span
                  role="button"
                  tabIndex={0}
                  onClick={(event) => handleDeleteHabit(habit.id, event)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') handleDeleteHabit(habit.id, event);
                  }}
                  className="text-xs font-medium text-zinc-400 transition-colors hover:text-red-500"
                >
                  {t.delete}
                </span>
              </div>
              <div className="h-16 w-full">
                <Line
                  data={{
                    labels: rollingWindow.labels,
                    datasets: [{
                      data: activitySeries[habit.id] || [],
                      borderColor: '#52525B',
                      borderWidth: 1.5,
                      tension: 0.3,
                      pointRadius: 0,
                    }],
                  }}
                  options={sparkOptions}
                />
              </div>
            </button>
          ))}
        </section>
      </div>

      <aside className="space-y-4">
        <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-[#111111]">
          <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-zinc-500">{t.activityFeed}</h2>
          <div className="mt-4 space-y-3">
            {timeline.length === 0 && <p className="text-sm text-zinc-500">{t.noLogs}</p>}
            {timeline.map((log) => (
              <div key={log.id} className="rounded-xl bg-zinc-50 p-3 dark:bg-zinc-950">
                <div className="flex items-center justify-between gap-3">
                  <span className="truncate text-sm font-semibold text-zinc-900 dark:text-zinc-100">{log.habit.name}</span>
                  <span className="shrink-0 text-xs text-zinc-500">{log.log_date}</span>
                </div>
                <div className="mt-2 flex items-center gap-2 text-xs text-zinc-500">
                  {log.value !== null && <span className="font-semibold text-emerald-600 dark:text-emerald-400">{log.value}</span>}
                  {log.notes && <span className="truncate">{log.notes}</span>}
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-zinc-200 bg-zinc-50 p-5 dark:border-zinc-800 dark:bg-[#111111]">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">{t.affiliateTitle}</p>
          <p className="mt-3 text-sm leading-6 text-zinc-600 dark:text-zinc-300">{t.affiliateBody}</p>
        </section>
      </aside>

      {selectedHabit && (
        <div className="fixed inset-0 z-50 flex justify-end bg-zinc-900/40 backdrop-blur-sm dark:bg-black/60">
          <div className="h-full w-full max-w-lg overflow-y-auto border-l border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">
            <div className="mb-8 flex items-center justify-between gap-4">
              <div className="min-w-0">
                <h2 className="truncate text-xl font-semibold text-zinc-900 dark:text-zinc-50">{selectedHabit.name}</h2>
                <p className="mt-1 text-sm text-zinc-500">{visibleMonth.toLocaleString(lang, { month: 'long', year: 'numeric' })}</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setSelectedHabit(null);
                  setSelectedDate('');
                }}
                className="grid h-9 w-9 place-items-center rounded-lg border border-zinc-200 text-zinc-500 dark:border-zinc-800"
              >
                x
              </button>
            </div>

            {!selectedDate ? (
              <div className="space-y-5">
                <div className="flex justify-end gap-2">
                  <button type="button" onClick={() => moveVisibleMonth(-1)} className="grid h-8 w-8 place-items-center rounded-lg border border-zinc-200 text-zinc-500 dark:border-zinc-800">‹</button>
                  <button type="button" onClick={() => moveVisibleMonth(1)} className="grid h-8 w-8 place-items-center rounded-lg border border-zinc-200 text-zinc-500 dark:border-zinc-800">›</button>
                </div>

                <div className="grid grid-cols-7 gap-2">
                  {calendarDays.map((day, index) => {
                    if (!day) return <div key={`empty-${index}`} className="aspect-square" />;
                    const dateString = formatYMD(day);
                    const dayLog = logs.find((log) => Number(log.habit_id) === Number(selectedHabit.id) && log.log_date === dateString);
                    const isToday = dateString === formatYMD(new Date());

                    return (
                      <button
                        type="button"
                        key={dateString}
                        onClick={() => openDay(dateString)}
                        className={`aspect-square rounded-xl border p-2 text-left transition-colors ${
                          dayLog
                            ? 'border-emerald-500/40 bg-emerald-500/10'
                            : 'border-zinc-200 bg-zinc-50 hover:border-zinc-400 dark:border-zinc-800 dark:bg-zinc-900'
                        }`}
                      >
                        <span className="block text-xs font-semibold text-zinc-900 dark:text-zinc-100">{day.getDate()}</span>
                        {isToday && <span className="mt-1 block text-[10px] font-semibold uppercase text-zinc-500">{t.today}</span>}
                        {dayLog?.value != null && <span className="mt-1 block truncate text-[11px] text-emerald-600 dark:text-emerald-400">{dayLog.value}</span>}
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : (
              <form onSubmit={handleSaveLog} className="space-y-6">
                <button type="button" onClick={() => setSelectedDate('')} className="text-sm font-medium text-zinc-500 transition-colors hover:text-zinc-900 dark:hover:text-zinc-100">
                  {t.back}
                </button>
                <h3 className="text-sm font-medium text-zinc-500">{selectedDate}</h3>
                <input
                  type="number"
                  value={logValue}
                  onChange={(event) => setLogValue(event.target.value)}
                  placeholder={t.valPh}
                  className="w-full border-b border-zinc-200 bg-transparent pb-2 text-2xl font-light text-zinc-900 outline-none dark:border-zinc-800 dark:text-zinc-50"
                />
                <textarea
                  value={logNotes}
                  onChange={(event) => setLogNotes(event.target.value)}
                  placeholder={t.notePh}
                  className="min-h-[180px] w-full resize-none rounded-xl border border-zinc-200 bg-zinc-50 p-4 text-sm text-zinc-900 outline-none dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100"
                />
                <button type="submit" className="w-full rounded-xl bg-zinc-900 py-3 text-sm font-semibold text-zinc-50 dark:bg-zinc-100 dark:text-zinc-900">
                  {t.saveBtn}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
