import React from 'react';
import {
  HeartPulse,
  Droplet,
  CheckCircle2,
  Circle,
  Plus,
  ArrowRight,
  Sparkles,
  Wallet,
  Clock,
  Bot,
  MessageCircle,
  Flame,
  CheckSquare,
  Square,
  Calendar
} from 'lucide-react';
import { HabitItem, HealthCheckRecord, TransactionLog, ReminderItem, ActivityItem } from '../types';
import { formatRupiah, formatDateIndonesian, getActivityUrgency } from '../utils/storage';
import { sound } from '../utils/audio';

interface HomeViewProps {
  todayDate: string;
  activities: ActivityItem[];
  habits: HabitItem[];
  healthChecks: HealthCheckRecord[];
  transactions: TransactionLog[];
  reminders: ReminderItem[];
  onToggleActivity: (id: string) => void;
  onToggleHabit: (habitId: string) => void;
  onIncrementHabit: (habitId: string, delta: number) => void;
  onOpenHealthModal: () => void;
  onOpenTransactionModal: () => void;
  onNavigateTab: (tab: 'health' | 'finance' | 'reminders' | 'ai' | 'activities') => void;
  soundEnabled: boolean;
}

export function HomeView({
  todayDate,
  activities,
  habits,
  healthChecks,
  transactions,
  reminders,
  onToggleActivity,
  onToggleHabit,
  onIncrementHabit,
  onOpenHealthModal,
  onOpenTransactionModal,
  onNavigateTab,
  soundEnabled
}: HomeViewProps) {
  const latestCheck = healthChecks[0];

  // Activities due calculations
  const pendingActivities = activities.filter((a) => !a.completed);
  const urgentActivities = [...pendingActivities]
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
    .slice(0, 3);

  // Today transactions summary
  const todayTransactions = transactions.filter((t) => t.date === todayDate);
  const totalExpenseToday = todayTransactions
    .filter((t) => t.type === 'pengeluaran')
    .reduce((sum, t) => sum + t.amount, 0);
  const totalIncomeToday = todayTransactions
    .filter((t) => t.type === 'pemasukan')
    .reduce((sum, t) => sum + t.amount, 0);

  // Next reminder
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const todayDayIndex = now.getDay();
  const nextReminder = reminders
    .filter((r) => r.enabled && r.days.includes(todayDayIndex))
    .map((r) => {
      const [h, m] = r.time.split(':').map(Number);
      return { ...r, mins: h * 60 + m };
    })
    .sort((a, b) => a.mins - b.mins)
    .find((r) => r.mins >= currentMinutes);

  const waterHabit = habits.find((h) => h.id === 'h-1');
  const currentWater = waterHabit?.history[todayDate] || 0;

  return (
    <div className="space-y-4 pb-4">
      {/* 1. Friendly AI Greeting Card */}
      <div className="p-4 bg-linear-to-r from-rose-500/10 via-indigo-500/10 to-emerald-500/10 dark:from-rose-950/40 dark:via-indigo-950/40 dark:to-emerald-950/40 border border-rose-200/60 dark:border-rose-900/40 rounded-2xl flex items-start gap-3">
        <div className="w-10 h-10 rounded-full bg-linear-to-tr from-rose-500 to-indigo-600 flex items-center justify-center text-white shrink-0 mt-0.5 shadow-xs">
          <Bot className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="text-xs font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
            Hai Agus!
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
          </h2>
          <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5 leading-snug">
            {pendingActivities.length > 0 ? (
              <span>
                Kamu ada <strong>{pendingActivities.length} kegiatan</strong> yang belum selesai. Semangat, yuk selesaikan satu per satu!
              </span>
            ) : (
              <span>Semua kegiatan selesai! Jangan lupa istirahat yang cukup dan minum air putih ya.</span>
            )}
          </p>
          <button
            onClick={() => onNavigateTab('ai')}
            className="mt-2.5 inline-flex items-center gap-1 px-3 py-1 text-[11px] font-semibold text-white bg-rose-600 hover:bg-rose-700 active:scale-98 rounded-lg shadow-xs transition-all"
          >
            <MessageCircle className="w-3.5 h-3.5" />
            Ngobrol dengan AI Agus
          </button>
        </div>
      </div>

      {/* 2. Aktifitas & Deadline Terdekat (User Focus) */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 shadow-xs">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
              <CheckSquare className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-slate-900 dark:text-white">
                Aktifitas & Deadline
              </h3>
              <span className="text-[10px] text-slate-400">
                {pendingActivities.length} belum dikerjakan
              </span>
            </div>
          </div>

          <button
            onClick={() => onNavigateTab('activities')}
            className="px-2.5 py-1 text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/50 hover:bg-indigo-100 rounded-lg transition-colors flex items-center gap-1"
          >
            <Plus className="w-3 h-3" />
            Tambah
          </button>
        </div>

        {urgentActivities.length === 0 ? (
          <p className="text-xs text-slate-400 text-center py-2.5">
            Tidak ada kegiatan tertunda. Semua beres! 🎉
          </p>
        ) : (
          <div className="space-y-2">
            {urgentActivities.map((act) => {
              const urgency = getActivityUrgency(act.dueDate, act.dueTime, act.completed);
              return (
                <div
                  key={act.id}
                  className="p-2.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-850 flex items-start gap-2.5"
                >
                  <button
                    onClick={() => {
                      if (soundEnabled) sound.playSuccess();
                      onToggleActivity(act.id);
                    }}
                    className="mt-0.5 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 active:scale-90 transition-transform"
                    title="Tandai selesai"
                  >
                    <Square className="w-4 h-4" />
                  </button>

                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                      {act.title}
                    </p>
                    <div className="flex items-center gap-1.5 mt-1">
                      <span className={`text-[10px] px-1.5 py-0.2 rounded-md border ${urgency.badgeClass}`}>
                        {urgency.label}
                      </span>
                      <span className="text-[10px] text-slate-400 capitalize">
                        · {act.category}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <button
          onClick={() => onNavigateTab('activities')}
          className="mt-3 w-full py-1.5 text-[11px] font-semibold text-center text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors flex items-center justify-center gap-1"
        >
          Buka Semua Daftar Kegiatan
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* 3. Ringkasan Skrining Medis */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 shadow-xs">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400">
              <HeartPulse className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-slate-900 dark:text-white">
                Skrining Medis Terkini
              </h3>
              <span className="text-[10px] text-slate-400">
                {latestCheck ? formatDateIndonesian(latestCheck.date) : 'Belum ada data'}
              </span>
            </div>
          </div>

          <button
            onClick={onOpenHealthModal}
            className="px-2.5 py-1 text-[11px] font-semibold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/50 hover:bg-rose-100 rounded-lg transition-colors flex items-center gap-1"
          >
            <Plus className="w-3 h-3" />
            Cek Baru
          </button>
        </div>

        {/* 4 Metric Chips */}
        {latestCheck ? (
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
              <span className="text-[10px] text-slate-400 block">Tensi Darah</span>
              <span className="text-sm font-bold font-mono tabular-nums text-slate-900 dark:text-white">
                {latestCheck.systolic}/{latestCheck.diastolic}
              </span>
              <span className="text-[10px] text-slate-400 font-mono ml-1">mmHg</span>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
              <span className="text-[10px] text-slate-400 block">Asam Urat</span>
              <span className="text-sm font-bold font-mono tabular-nums text-slate-900 dark:text-white">
                {latestCheck.uricAcid ?? '-'}
              </span>
              <span className="text-[10px] text-slate-400 font-mono ml-1">mg/dL</span>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
              <span className="text-[10px] text-slate-400 block">Kolesterol Total</span>
              <span className="text-sm font-bold font-mono tabular-nums text-slate-900 dark:text-white">
                {latestCheck.cholesterol ?? '-'}
              </span>
              <span className="text-[10px] text-slate-400 font-mono ml-1">mg/dL</span>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
              <span className="text-[10px] text-slate-400 block">Gula Darah</span>
              <span className="text-sm font-bold font-mono tabular-nums text-slate-900 dark:text-white">
                {latestCheck.bloodSugar ?? '-'}
              </span>
              <span className="text-[10px] text-slate-400 font-mono ml-1">mg/dL</span>
            </div>
          </div>
        ) : (
          <p className="text-xs text-slate-400 text-center py-3">
            Belum ada catatan tensi, asam urat, kolesterol, dan gula darah.
          </p>
        )}

        <button
          onClick={() => onNavigateTab('health')}
          className="mt-3 w-full py-1.5 text-[11px] font-semibold text-center text-slate-600 dark:text-slate-300 hover:text-rose-600 dark:hover:text-rose-400 transition-colors flex items-center justify-center gap-1"
        >
          Lihat Analisis Medis Lengkap
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* 4. Target Kebiasaan Hari Ini */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            Kebiasaan Sehat Hari Ini
          </h3>
          <span className="text-[11px] font-mono text-slate-400">
            {habits.filter((h) => (h.history[todayDate] || 0) >= h.targetCount).length}/{habits.length} Selesai
          </span>
        </div>

        {/* Quick Water Stepper Widget */}
        {waterHabit && (
          <div className="p-3 bg-cyan-50/60 dark:bg-cyan-950/30 border border-cyan-100 dark:border-cyan-900/50 rounded-xl flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 bg-cyan-500 text-white rounded-lg">
                <Droplet className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-semibold text-slate-900 dark:text-white block">
                  Air Putih Hari Ini
                </span>
                <span className="text-[11px] font-mono text-cyan-700 dark:text-cyan-300 font-bold">
                  {currentWater}/{waterHabit.targetCount} Gelas (~{(currentWater * 0.25).toFixed(1)}L)
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={() => onIncrementHabit(waterHabit.id, -1)}
                disabled={currentWater <= 0}
                className="w-7 h-7 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300 disabled:opacity-30 active:scale-95"
              >
                -
              </button>
              <button
                onClick={() => {
                  if (soundEnabled) sound.playSuccess();
                  onIncrementHabit(waterHabit.id, 1);
                }}
                className="px-2.5 h-7 rounded-lg bg-cyan-600 text-white text-xs font-bold active:scale-95 shadow-xs flex items-center gap-1"
              >
                +1 Gelas
              </button>
            </div>
          </div>
        )}

        {/* Other Habits */}
        <div className="space-y-1.5">
          {habits
            .filter((h) => h.id !== 'h-1')
            .map((habit) => {
              const current = habit.history[todayDate] || 0;
              const isDone = current >= habit.targetCount;

              return (
                <div
                  key={habit.id}
                  onClick={() => {
                    if (soundEnabled) sound.playSuccess();
                    onToggleHabit(habit.id);
                  }}
                  className="p-2.5 rounded-xl border border-slate-100 dark:border-slate-800/80 hover:bg-slate-50 dark:hover:bg-slate-800/40 flex items-center justify-between cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    {isDone ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    ) : (
                      <Circle className="w-4 h-4 text-slate-400" />
                    )}
                    <span
                      className={`text-xs font-medium ${
                        isDone
                          ? 'line-through text-slate-400 dark:text-slate-500'
                          : 'text-slate-800 dark:text-slate-200'
                      }`}
                    >
                      {habit.title}
                    </span>
                  </div>

                  {habit.currentStreak > 0 && (
                    <span className="text-[10px] font-mono text-amber-600 flex items-center gap-0.5">
                      <Flame className="w-3 h-3" />
                      {habit.currentStreak}d
                    </span>
                  )}
                </div>
              );
            })}
        </div>
      </div>

      {/* 5. Keuangan Ringkas Hari Ini */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 shadow-xs">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-600">
              <Wallet className="w-4 h-4" />
            </div>
            <h3 className="text-xs font-bold text-slate-900 dark:text-white">
              Keuangan Hari Ini
            </h3>
          </div>
          <button
            onClick={onOpenTransactionModal}
            className="px-2.5 py-1 text-[11px] font-semibold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/50 hover:bg-amber-100 rounded-lg transition-colors flex items-center gap-1"
          >
            <Plus className="w-3 h-3" />
            Catat
          </button>
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs pt-1">
          <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60">
            <span className="text-[10px] text-slate-400 block">Pengeluaran</span>
            <span className="font-bold font-mono tabular-nums text-slate-900 dark:text-white text-sm">
              {formatRupiah(totalExpenseToday)}
            </span>
          </div>

          <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60">
            <span className="text-[10px] text-slate-400 block">Pemasukan</span>
            <span className="font-bold font-mono tabular-nums text-emerald-600 text-sm">
              {formatRupiah(totalIncomeToday)}
            </span>
          </div>
        </div>

        <button
          onClick={() => onNavigateTab('finance')}
          className="mt-3 w-full py-1 text-[11px] font-semibold text-center text-slate-500 hover:text-amber-600 dark:hover:text-amber-400 transition-colors flex items-center justify-center gap-1"
        >
          Lihat Catatan Keuangan Lengkap &rarr;
        </button>
      </div>

      {/* 6. Pengingat Berikutnya */}
      {nextReminder && (
        <div className="p-3 bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/40 rounded-xl flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-indigo-600" />
            <div>
              <span className="font-bold text-indigo-950 dark:text-indigo-200">
                {nextReminder.time} · {nextReminder.title}
              </span>
              <p className="text-[10px] text-indigo-700 dark:text-indigo-400 truncate max-w-xs">
                {nextReminder.note}
              </p>
            </div>
          </div>
          <button
            onClick={() => onNavigateTab('reminders')}
            className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 hover:underline shrink-0"
          >
            Lihat
          </button>
        </div>
      )}
    </div>
  );
}
