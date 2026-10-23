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
  MessageCircle,
  Flame,
  CheckSquare,
  Square,
  Calendar,
  Repeat,
  Target,
  Moon
} from 'lucide-react';
import {
  HabitItem,
  HealthCheckRecord,
  TransactionLog,
  ReminderItem,
  ActivityItem,
  FinancialGoal,
  AppFeatureTab
} from '../types';
import { formatRupiah, formatDateIndonesian, getActivityUrgency } from '../utils/storage';
import { sound } from '../utils/audio';
import { JarvisLogo } from './JarvisLogo';
import { AutoLinkText, QuickUrlButtons } from './AutoLinkText';

interface HomeViewProps {
  todayDate: string;
  activities: ActivityItem[];
  habits: HabitItem[];
  healthChecks: HealthCheckRecord[];
  transactions: TransactionLog[];
  financialTargets?: FinancialGoal[];
  reminders: ReminderItem[];
  onToggleActivity: (id: string) => void;
  onToggleRoutine?: (id: string) => void;
  onToggleHabit: (habitId: string) => void;
  onIncrementHabit: (habitId: string, delta: number) => void;
  onOpenHealthModal: () => void;
  onOpenTransactionModal: () => void;
  onNavigateTab: (tab: 'health' | 'finance' | 'reminders' | 'ai' | 'activities') => void;
  soundEnabled: boolean;
  displayMode?: 'auto' | 'mobile' | 'laptop';
  allowedTabs?: AppFeatureTab[];
}

export function HomeView({
  todayDate,
  activities,
  habits,
  healthChecks,
  transactions,
  financialTargets = [],
  reminders,
  onToggleActivity,
  onToggleRoutine,
  onToggleHabit,
  onIncrementHabit,
  onOpenHealthModal,
  onOpenTransactionModal,
  onNavigateTab,
  soundEnabled,
  displayMode = 'auto',
  allowedTabs
}: HomeViewProps) {
  const isTabAllowed = (tab: AppFeatureTab) => {
    if (!allowedTabs || allowedTabs.length === 0) return true;
    return allowedTabs.includes(tab);
  };

  const latestCheck = healthChecks[0];
  const currentMonth = todayDate.slice(0, 7);

  // Activities due calculations
  const deadlineActivities = activities.filter((a) => !a.activityType || a.activityType === 'deadline');
  const routineActivities = activities.filter(
    (a) => a.activityType === 'rutin_harian' || a.activityType === 'rutin_bulanan'
  );

  const pendingDeadlines = deadlineActivities.filter((a) => !a.completed);
  const urgentActivities = [...pendingDeadlines]
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
    .slice(0, 5);

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
  const currentWater = (waterHabit?.history && waterHabit.history[todayDate]) || 0;

  // Grid wrapper styling based on displayMode
  const isWide = displayMode === 'laptop' || (displayMode === 'auto');

  return (
    <div className="space-y-4 pb-4">
      {/* 1. Futuristic JARVIS Greeting Card (Always Full Width) */}
      <div className="p-4 bg-linear-to-r from-cyan-500/10 via-indigo-500/10 to-amber-500/10 dark:from-cyan-950/40 dark:via-indigo-950/40 dark:to-amber-950/40 border border-cyan-200/60 dark:border-cyan-800/50 rounded-2xl flex items-start gap-3 shadow-xs">
        <JarvisLogo size="md" variant="hybrid" animated={true} />
        <div className="flex-1 min-w-0">
          <h2 className="text-xs font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1.5 font-mono tracking-wide">
            JARVIS ONLINE
            <Sparkles className="w-3.5 h-3.5 text-cyan-500" />
          </h2>
          <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5 leading-snug">
            {pendingDeadlines.length > 0 ? (
              <span>
                Halo Agus, ada <strong>{pendingDeadlines.length} tugas deadline</strong> aktif dan {routineActivities.length} aktifitas rutin. Sistem siap memandu hari Anda!
              </span>
            ) : (
              <span>Halo Agus! Semua parameter dan tugas harian aman terkendali. Jangan lupa hidrasi dan cek ibadah ya.</span>
            )}
          </p>
          {isTabAllowed('ai') && (
            <button
              onClick={() => onNavigateTab('ai')}
              className="mt-2.5 inline-flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-bold text-slate-950 bg-cyan-400 hover:bg-cyan-300 active:scale-98 rounded-lg shadow-xs shadow-cyan-500/20 transition-all font-mono"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              Tanya JARVIS
            </button>
          )}
        </div>
      </div>

      {/* Main Grid: Responsive 2-column on Laptop, linear single-column on HP */}
      <div className={isWide ? 'grid grid-cols-1 lg:grid-cols-2 gap-4' : 'space-y-4'}>
        {/* COLUMN LEFT */}
        <div className="space-y-4">
          {/* 2. Aktifitas & Deadline Terdekat */}
          {isTabAllowed('activities') && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 shadow-xs">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
                    <Clock className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-slate-900 dark:text-white">
                      Kegiatan Deadline Terdekat
                    </h3>
                    <span className="text-[10px] text-slate-400">
                      {pendingDeadlines.length} deadline menunggu
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
              <p className="text-xs text-slate-400 text-center py-3">
                Tidak ada kegiatan deadline tertunda. Semua beres! 🎉
              </p>
            ) : (
              <div className="space-y-2.5">
                {urgentActivities.map((act) => {
                  const urgency = getActivityUrgency(act.dueDate, act.dueTime, act.completed);
                  return (
                    <div
                      key={act.id}
                      className="p-3 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-850/80 flex items-start gap-3 shadow-2xs hover:border-slate-300 dark:hover:border-slate-700 transition-colors"
                    >
                      <button
                        onClick={() => onToggleActivity(act.id)}
                        className="mt-0.5 text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 active:scale-90 transition-transform p-1 min-w-[28px] min-h-[28px] flex items-center justify-center rounded-lg hover:bg-slate-200/60 dark:hover:bg-slate-800"
                        title="Tandai selesai (dengan konfirmasi)"
                        aria-label="Tandai selesai"
                      >
                        <Square className="w-4 h-4" />
                      </button>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className={`text-[10px] px-2 py-0.5 rounded-full border font-semibold ${urgency.badgeClass}`}>
                            {urgency.label}
                          </span>
                          <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium capitalize bg-white dark:bg-slate-800 px-2 py-0.5 rounded-md border border-slate-200/60 dark:border-slate-700/60">
                            {act.category === 'ibadah' ? '🌙 Ibadah' : act.category}
                          </span>
                          {act.priority === 'tinggi' && (
                            <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-sm bg-rose-100 text-rose-700 dark:bg-rose-950/70 dark:text-rose-300">
                              Penting
                            </span>
                          )}
                        </div>

                        <p className="text-xs font-semibold text-slate-900 dark:text-white mt-1 leading-snug break-words">
                          {act.title}
                        </p>

                        {/* Catatan / Detail Tambahan & Link Langsung */}
                        {act.notes && (
                          <div className="mt-2 p-2 rounded-lg bg-white/90 dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800/80 shadow-2xs">
                            <div className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed break-words whitespace-pre-wrap">
                              <AutoLinkText text={act.notes} />
                            </div>
                            {/* Direct 1-tap link action buttons */}
                            <QuickUrlButtons text={act.notes} />
                          </div>
                        )}
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
          )}

          {/* 3. Aktifitas Rutin Harian & Ibadah Hari Ini (User request: gak hilang sekali selesai) */}
          {isTabAllowed('activities') && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 shadow-xs">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
                    <Repeat className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1">
                      Rutin Harian & Ibadah
                      <Sparkles className="w-3 h-3 text-emerald-500" />
                    </h3>
                    <span className="text-[10px] text-slate-400">
                      Diperbarui setiap hari & tidak hilang
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => onNavigateTab('activities')}
                  className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 hover:underline"
                >
                  Kelola
                </button>
              </div>

              {routineActivities.length === 0 ? (
                <div className="py-3 text-center bg-slate-50/50 dark:bg-slate-800/40 rounded-xl p-3 border border-dashed border-slate-200 dark:border-slate-700">
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Belum ada aktifitas rutin atau ibadah harian.
                  </p>
                  <button
                    onClick={() => onNavigateTab('activities')}
                    className="mt-2 text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline inline-flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Tambah Rutinitas Harian / Ibadah
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  {routineActivities.slice(0, 4).map((routine) => {
                    const comps = routine.routineCompletions || {};
                    const isDone = routine.activityType === 'rutin_bulanan'
                      ? Boolean(comps[currentMonth])
                      : Boolean(comps[todayDate]);

                    return (
                      <div
                        key={routine.id}
                        onClick={() => {
                          if (onToggleRoutine) onToggleRoutine(routine.id);
                          else onToggleActivity(routine.id);
                        }}
                        className={`p-2.5 rounded-xl border flex items-center justify-between gap-2.5 cursor-pointer transition-colors ${
                          isDone
                            ? 'bg-emerald-50/30 dark:bg-emerald-950/20 border-emerald-200/60 dark:border-emerald-900/40'
                            : 'bg-slate-50/70 dark:bg-slate-850/60 border-slate-100 dark:border-slate-800'
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <button
                            type="button"
                            className="shrink-0 text-slate-400 hover:text-emerald-600"
                          >
                            {isDone ? (
                              <CheckSquare className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                            ) : (
                              <Square className="w-4 h-4 text-slate-400" />
                            )}
                          </button>
                          <div className="truncate">
                            <span
                              className={`text-xs font-medium block truncate ${
                                isDone ? 'text-slate-600 dark:text-slate-400 line-through' : 'text-slate-900 dark:text-white font-semibold'
                              }`}
                            >
                              {routine.title}
                            </span>
                            <span className="text-[10px] text-slate-400">
                              {routine.category === 'ibadah' ? '🌙 Ibadah' : routine.category}
                            </span>
                          </div>
                        </div>

                        {isDone ? (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 shrink-0">
                            Selesai ✨
                          </span>
                        ) : (
                          <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-500 shrink-0">
                            Belum
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* COLUMN RIGHT */}
        <div className="space-y-4">
          {/* 4. Skrining Medis Terkini */}
          {isTabAllowed('health') && (
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
          )}

          {/* 5. Keuangan & Target Finansial */}
          {isTabAllowed('finance') && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 shadow-xs">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-600">
                    <Wallet className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-slate-900 dark:text-white">
                      Keuangan & Target
                    </h3>
                    <span className="text-[10px] text-slate-400">
                      BCA, DANA, dan Impian Finansial
                    </span>
                  </div>
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
                  <span className="text-[10px] text-slate-400 block">Pengeluaran Hari Ini</span>
                  <span className="font-bold font-mono tabular-nums text-slate-900 dark:text-white text-sm">
                    {formatRupiah(totalExpenseToday)}
                  </span>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60">
                  <span className="text-[10px] text-slate-400 block">Pemasukan Hari Ini</span>
                  <span className="font-bold font-mono tabular-nums text-emerald-600 text-sm">
                    {formatRupiah(totalIncomeToday)}
                  </span>
                </div>
              </div>

              {/* Quick target progress preview */}
              {financialTargets.length > 0 && (
                <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex items-center justify-between text-[11px] mb-1 font-semibold text-slate-700 dark:text-slate-300">
                    <span className="flex items-center gap-1">
                      <Target className="w-3.5 h-3.5 text-amber-500" />
                      {financialTargets[0].title}
                    </span>
                    <span className="font-mono text-amber-600">
                      {formatRupiah(financialTargets[0].currentAmount)}
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-amber-500 rounded-full"
                      style={{
                        width: `${Math.min(
                          100,
                          Math.round((financialTargets[0].currentAmount / financialTargets[0].targetAmount) * 100)
                        )}%`
                      }}
                    />
                  </div>
                </div>
              )}

              <button
                onClick={() => onNavigateTab('finance')}
                className="mt-3 w-full py-1 text-[11px] font-semibold text-center text-slate-500 hover:text-amber-600 dark:hover:text-amber-400 transition-colors flex items-center justify-center gap-1"
              >
                Buka Dompet & Target Keuangan &rarr;
              </button>
            </div>
          )}

          {/* 6. Kebiasaan Sehat & Air Putih */}
          {isTabAllowed('health') && waterHabit && (
            <div className="p-3 bg-cyan-50/60 dark:bg-cyan-950/30 border border-cyan-100 dark:border-cyan-900/50 rounded-2xl flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 bg-cyan-500 text-white rounded-lg">
                  <Droplet className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs font-semibold text-slate-900 dark:text-white block">
                    Air Putih Hari Ini
                  </span>
                  <span className="text-[11px] font-mono text-cyan-700 dark:text-cyan-300 font-bold">
                    {currentWater}/{waterHabit.targetCount || 8} Gelas (~{(currentWater * 0.25).toFixed(1)}L)
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

          {/* 7. Pengingat Berikutnya */}
          {isTabAllowed('reminders') && nextReminder && (
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
      </div>
    </div>
  );
}
