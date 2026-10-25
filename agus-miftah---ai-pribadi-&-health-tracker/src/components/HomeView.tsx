import React, { useState } from 'react';
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
  Moon,
  MapPin,
  CalendarRange,
  Compass,
  Check,
  Search,
  X
} from 'lucide-react';
import {
  HabitItem,
  HealthCheckRecord,
  TransactionLog,
  ReminderItem,
  ActivityItem,
  FinancialGoal,
  AppFeatureTab,
  PrayerLocationSettings
} from '../types';
import { formatRupiah, formatDateIndonesian, getActivityUrgency } from '../utils/storage';
import { sound } from '../utils/audio';
import { JarvisLogo } from './JarvisLogo';
import { AutoLinkText, QuickUrlButtons } from './AutoLinkText';
import {
  calculatePrayerTimes,
  getNextPrayer,
  DEFAULT_PRAYER_LOCATION,
  INDONESIA_CITIES,
  getRoutineWeekKey,
  getWeeklyDayName
} from '../utils/prayerTimes';

interface HomeViewProps {
  todayDate: string;
  activities: ActivityItem[];
  habits: HabitItem[];
  healthChecks: HealthCheckRecord[];
  transactions: TransactionLog[];
  financialTargets?: FinancialGoal[];
  reminders: ReminderItem[];
  prayerLocation?: PrayerLocationSettings;
  onChangePrayerLocation?: (location: PrayerLocationSettings) => void;
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
  prayerLocation = DEFAULT_PRAYER_LOCATION,
  onChangePrayerLocation,
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
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
  const [isGpsLoading, setIsGpsLoading] = useState(false);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [citySearch, setCitySearch] = useState('');

  const isTabAllowed = (tab: AppFeatureTab) => {
    if (!allowedTabs || allowedTabs.length === 0) return true;
    return allowedTabs.includes(tab);
  };

  const latestCheck = healthChecks[0];
  const currentMonth = todayDate.slice(0, 7);

  // Prayer Times calculation according to location
  const prayerTimes = calculatePrayerTimes(
    new Date(),
    prayerLocation.latitude,
    prayerLocation.longitude,
    prayerLocation.timezone
  );
  const nextPrayer = getNextPrayer(prayerTimes, new Date());

  // Activities separation
  const deadlineActivities = activities.filter((a) => !a.activityType || a.activityType === 'deadline');
  const routineActivities = activities.filter(
    (a) => a.activityType === 'rutin_harian' || a.activityType === 'rutin_mingguan' || a.activityType === 'rutin_bulanan'
  );

  const pendingDeadlines = deadlineActivities.filter((a) => !a.completed);
  const urgentActivities = [...pendingDeadlines]
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
    .slice(0, 5);

  // Sholat 5 waktu activities
  const prayerActivities = activities.filter(
    (a) => a.activityType === 'rutin_harian' && Boolean(a.prayerType)
  );

  // General routines (excluding specific sholat pills)
  const generalRoutines = routineActivities.filter((a) => !a.prayerType);

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
  const isWide = displayMode === 'laptop' || displayMode === 'auto';

  // Geolocation detection handler
  const handleDetectGPS = () => {
    if (!navigator.geolocation) {
      setGpsError('Browser tidak mendukung pendeteksian lokasi GPS.');
      return;
    }

    setIsGpsLoading(true);
    setGpsError(null);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setIsGpsLoading(false);
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        // Approximate timezone in Indonesia based on longitude
        let tz = 7;
        if (lng >= 120) tz = 9; // WIT
        else if (lng >= 115) tz = 8; // WITA

        const detectedLoc: PrayerLocationSettings = {
          cityName: 'Lokasi Saya (GPS)',
          latitude: lat,
          longitude: lng,
          timezone: tz,
          autoLocation: true
        };

        if (onChangePrayerLocation) {
          onChangePrayerLocation(detectedLoc);
        }
        setIsLocationModalOpen(false);
        if (soundEnabled) sound.playSuccess();
      },
      (err) => {
        setIsGpsLoading(false);
        if (err.code === 1) {
          setGpsError('Izin lokasi ditolak oleh browser/HP. Silakan aktifkan izin lokasi di Setelan Browser/HP Anda, atau langsung pilih kota Anda di daftar bawah (hasil waktu azan sama akuratnya).');
        } else if (err.code === 2) {
          setGpsError('Posisi GPS tidak tersedia saat ini. Pastikan GPS HP aktif atau pilih kota di bawah.');
        } else if (err.code === 3) {
          setGpsError('Waktu pencarian GPS habis. Silakan coba lagi atau pilih kota di daftar bawah.');
        } else {
          setGpsError('Tidak dapat mendeteksi GPS. Silakan pilih kota di daftar bawah.');
        }
      },
      { timeout: 12000, enableHighAccuracy: false, maximumAge: 60000 }
    );
  };

  const handleSelectCity = (city: PrayerLocationSettings) => {
    if (onChangePrayerLocation) {
      onChangePrayerLocation(city);
    }
    setIsLocationModalOpen(false);
    if (soundEnabled) sound.playSuccess();
  };

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
        {/* ===================== COLUMN LEFT ===================== */}
        <div className="space-y-4">
          {/* 2. USER REQUEST: RUTINITAS HARIAN & SHOLAT 5 WAKTU PALING ATAS */}
          {isTabAllowed('activities') && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 shadow-xs space-y-3.5">
              {/* Header with Location & Manage */}
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2.5">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
                    <Repeat className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1">
                      Rutinitas Harian & Ibadah
                      <Sparkles className="w-3 h-3 text-emerald-500" />
                    </h3>
                    <span className="text-[10px] text-slate-400">
                      Diperbarui berkala & tidak hilang
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setIsLocationModalOpen(true)}
                    className="px-2 py-1 text-[10px] font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200/80 dark:border-emerald-800/60 rounded-lg flex items-center gap-1 hover:bg-emerald-100 transition-colors"
                    title="Ubah lokasi adzan"
                  >
                    <MapPin className="w-3 h-3 text-emerald-600" />
                    <span className="truncate max-w-[100px]">{prayerLocation.cityName}</span>
                  </button>

                  <button
                    onClick={() => onNavigateTab('activities')}
                    className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 hover:underline"
                  >
                    Kelola
                  </button>
                </div>
              </div>

              {/* JADWAL SHOLAT 5 WAKTU & ADZAN KONTROL */}
              <div className="p-3 bg-linear-to-br from-emerald-500/10 via-teal-500/5 to-slate-900/5 dark:from-emerald-950/40 dark:via-teal-950/20 dark:to-slate-900 border border-emerald-200/80 dark:border-emerald-800/60 rounded-xl space-y-2.5">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5 font-bold text-emerald-900 dark:text-emerald-200 text-[11px]">
                    <Moon className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    <span>Jadwal Sholat & Adzan Hari Ini</span>
                  </div>
                  <span className="text-[10px] font-mono text-emerald-700 dark:text-emerald-400 font-semibold">
                    Berikutnya: {nextPrayer.name} ({nextPrayer.time}) · {nextPrayer.countdownText}
                  </span>
                </div>

                {/* 5 Sholat Quick Checklist Buttons */}
                <div className="grid grid-cols-5 gap-1.5 pt-0.5">
                  {[
                    { key: 'subuh', name: 'Subuh', time: prayerTimes.subuh },
                    { key: 'dzuhur', name: 'Dzuhur', time: prayerTimes.dzuhur },
                    { key: 'ashar', name: 'Ashar', time: prayerTimes.ashar },
                    { key: 'maghrib', name: 'Maghrib', time: prayerTimes.maghrib },
                    { key: 'isya', name: 'Isya', time: prayerTimes.isya }
                  ].map((p) => {
                    // Match corresponding prayer activity
                    const matchingAct = prayerActivities.find((a) => a.prayerType === p.key);
                    const comps = matchingAct?.routineCompletions || {};
                    const isDone = Boolean(comps[todayDate]);

                    return (
                      <button
                        key={p.key}
                        onClick={() => {
                          if (matchingAct) {
                            if (onToggleRoutine) onToggleRoutine(matchingAct.id);
                            else onToggleActivity(matchingAct.id);
                          }
                        }}
                        className={`p-1.5 rounded-xl border text-center transition-all ${
                          isDone
                            ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs ring-1 ring-emerald-500/30'
                            : nextPrayer.name.toLowerCase().includes(p.key)
                            ? 'bg-amber-100 dark:bg-amber-950/60 border-amber-400 text-amber-900 dark:text-amber-200 ring-1 ring-amber-400/50'
                            : 'bg-white/80 dark:bg-slate-800/80 border-slate-200/80 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-emerald-300'
                        }`}
                        title={isDone ? `${p.name} selesai (klik ubah)` : `Tandai ${p.name} sudah sholat`}
                      >
                        <div className="flex items-center justify-center mb-0.5">
                          {isDone ? (
                            <Check className="w-3 h-3 text-white" />
                          ) : (
                            <span className="text-[9px] font-bold opacity-60">
                              {nextPrayer.name.toLowerCase().includes(p.key) ? '🔔' : '⚪'}
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] font-bold block truncate">{p.name}</span>
                        <span className="text-[9px] font-mono block opacity-90 truncate">{p.time}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* General Routines List (Daily & Weekly & Monthly) */}
              <div className="space-y-2 pt-0.5">
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                  Rutinitas Harian & Mingguan Lainnya:
                </span>

                {generalRoutines.length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-2">
                    Belum ada kegiatan rutin harian atau mingguan lainnya.
                  </p>
                ) : (
                  generalRoutines.slice(0, 4).map((routine) => {
                    const comps = routine.routineCompletions || {};
                    let isDone = false;
                    let periodLabel = 'Harian';

                    if (routine.activityType === 'rutin_bulanan') {
                      isDone = Boolean(comps[currentMonth]);
                      periodLabel = 'Bulanan';
                    } else if (routine.activityType === 'rutin_mingguan') {
                      const weekKey = getRoutineWeekKey(todayDate, routine.weeklyInterval || 1);
                      isDone = Boolean(comps[weekKey]);
                      periodLabel = routine.weeklyInterval === 2 ? '2 Minggu 1x' : 'Mingguan';
                    } else {
                      isDone = Boolean(comps[todayDate]);
                      periodLabel = 'Harian';
                    }

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
                                isDone
                                  ? 'text-slate-600 dark:text-slate-400 line-through'
                                  : 'text-slate-900 dark:text-white font-semibold'
                              }`}
                            >
                              {routine.title}
                            </span>
                            <div className="flex items-center gap-1.5 text-[10px] text-slate-400 mt-0.5">
                              <span className="px-1.5 py-0.2 rounded-sm bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                                {periodLabel}
                              </span>
                              {routine.weeklyDay !== undefined && (
                                <span>· {getWeeklyDayName(routine.weeklyDay)}</span>
                              )}
                              {routine.category === 'ibadah' && <span>· 🌙 Ibadah</span>}
                            </div>
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
                  })
                )}
              </div>
            </div>
          )}

          {/* 3. USER REQUEST: KEGIATAN DEADLINE TERDEKAT DI BAWAH RUTINITAS */}
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
                          title="Tandai selesai"
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

                          {act.notes && (
                            <div className="mt-2 p-2 rounded-lg bg-white/90 dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800/80 shadow-2xs">
                              <div className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed break-words whitespace-pre-wrap">
                                <AutoLinkText text={act.notes} />
                              </div>
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
        </div>

        {/* ===================== COLUMN RIGHT ===================== */}
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
                Buka Dompet, Aset & Target Keuangan &rarr;
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

      {/* MODAL PILIH LOKASI ADZAN & SHOLAT */}
      {isLocationModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3.5 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-md p-5 space-y-3.5 shadow-2xl max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2.5">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
                  <Compass className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Pilih Lokasi Waktu Adzan
                  </h3>
                  <span className="text-[10px] text-slate-400">
                    Menyesuaikan waktu sholat dengan daerahmu
                  </span>
                </div>
              </div>
              <button
                onClick={() => setIsLocationModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Auto GPS Detect Button */}
            <button
              onClick={handleDetectGPS}
              disabled={isGpsLoading}
              className="w-full py-2.5 px-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 active:scale-98 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition-all disabled:opacity-50"
            >
              <MapPin className="w-4 h-4" />
              <span>{isGpsLoading ? 'Mendeteksi koordinat GPS...' : '📍 Deteksi Lokasi Otomatis (GPS)'}</span>
            </button>

            {gpsError && (
              <p className="text-[11px] text-rose-500 bg-rose-50 dark:bg-rose-950/40 p-2 rounded-lg border border-rose-200/60">
                {gpsError}
              </p>
            )}

            {/* Search Input for Cities */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={citySearch}
                onChange={(e) => setCitySearch(e.target.value)}
                placeholder="Cari kota (contoh: Nabire, Papua, dll)..."
                className="w-full pl-8 pr-7 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
              />
              {citySearch && (
                <button
                  type="button"
                  onClick={() => setCitySearch('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs p-0.5"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="flex items-center justify-between pt-0.5">
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                Daftar Kota ({INDONESIA_CITIES.filter((c) => c.cityName.toLowerCase().includes(citySearch.toLowerCase())).length}):
              </span>
              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
                Pilih untuk terapkan
              </span>
            </div>

            {/* List of Indonesian Cities */}
            <div className="overflow-y-auto space-y-1.5 flex-1 pr-1 max-h-56">
              {INDONESIA_CITIES
                .filter((city) =>
                  city.cityName.toLowerCase().includes(citySearch.toLowerCase())
                )
                .map((city) => {
                  const isSelected = prayerLocation.cityName === city.cityName;
                  const tzLabel = city.timezone === 7 ? 'WIB' : city.timezone === 8 ? 'WITA' : 'WIT';

                  return (
                    <button
                      key={city.cityName}
                      onClick={() => {
                        handleSelectCity(city);
                        setIsLocationModalOpen(false);
                      }}
                      className={`w-full p-2.5 rounded-xl border text-left text-xs flex items-center justify-between transition-colors ${
                        isSelected
                          ? 'border-emerald-500 bg-emerald-50/70 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200 font-bold ring-1 ring-emerald-500/30'
                          : 'border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-850/60 text-slate-700 dark:text-slate-300 hover:border-slate-300'
                      }`}
                    >
                      <div>
                        <span className="block font-semibold">{city.cityName}</span>
                        <span className="text-[10px] text-slate-400">{tzLabel} · Zona Waktu UTC+{city.timezone}</span>
                      </div>
                      {isSelected && <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />}
                    </button>
                  );
                })}
              {INDONESIA_CITIES.filter((c) => c.cityName.toLowerCase().includes(citySearch.toLowerCase())).length === 0 && (
                <div className="text-center py-6 text-slate-400 text-xs space-y-1">
                  <p>Kota "{citySearch}" belum ada di daftar.</p>
                  <p className="text-[11px] text-slate-500">Silakan pilih kota terdekat di provinsi yang sama.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
