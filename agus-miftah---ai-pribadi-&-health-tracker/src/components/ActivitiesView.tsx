import React, { useState } from 'react';
import {
  CheckSquare,
  Square,
  Plus,
  Calendar,
  Clock,
  Trash2,
  Edit3,
  AlertCircle,
  Tag,
  CheckCircle2,
  Filter,
  Bell,
  X,
  RotateCcw,
  Sparkles,
  Repeat,
  Moon,
  CalendarRange,
  CalendarDays
} from 'lucide-react';
import { ActivityItem } from '../types';
import { getActivityUrgency, getTodayDateString, formatDateIndonesian } from '../utils/storage';
import { sound } from '../utils/audio';
import { EditActivityModal } from './EditActivityModal';
import { AutoLinkText, QuickUrlButtons } from './AutoLinkText';
import { getRoutineWeekKey, getWeeklyDayName } from '../utils/prayerTimes';

interface ActivitiesViewProps {
  activities: ActivityItem[];
  todayDate: string;
  onToggleActivity: (id: string) => void;
  onToggleRoutine?: (id: string) => void;
  onAddActivity: (activity: Omit<ActivityItem, 'id' | 'createdAt'>) => void;
  onUpdateActivity: (activity: ActivityItem) => void;
  onDeleteActivity: (id: string) => void;
  onNavigateToReminders?: () => void;
  soundEnabled: boolean;
}

export function ActivitiesView({
  activities,
  todayDate,
  onToggleActivity,
  onToggleRoutine,
  onAddActivity,
  onUpdateActivity,
  onDeleteActivity,
  onNavigateToReminders,
  soundEnabled
}: ActivitiesViewProps) {
  // Main view tab: 'deadline' vs 'rutin'
  const [activeTab, setActiveTab] = useState<'deadline' | 'rutin'>('deadline');

  // Filters for Deadline
  const [filterStatus, setFilterStatus] = useState<'pending' | 'completed' | 'all'>('pending');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Filters for Rutin
  const [routineFilter, setRoutineFilter] = useState<'all' | 'harian' | 'mingguan' | 'bulanan' | 'ibadah'>('all');

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingActivity, setEditingActivity] = useState<ActivityItem | null>(null);

  // New activity form state
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<ActivityItem['category']>('kerjaan');
  const [activityType, setActivityType] = useState<ActivityItem['activityType']>('deadline');
  const [weeklyInterval, setWeeklyInterval] = useState<1 | 2>(1);
  const [weeklyDay, setWeeklyDay] = useState<number>(5); // default Jumat
  const [dueDate, setDueDate] = useState(getTodayDateString(0));
  const [dueTime, setDueTime] = useState('');
  const [priority, setPriority] = useState<ActivityItem['priority']>('sedang');
  const [notes, setNotes] = useState('');
  const [reminderMinutesBefore, setReminderMinutesBefore] = useState<number>(15);

  const currentMonth = todayDate.slice(0, 7); // 'YYYY-MM'

  // Separate deadline vs routine (including weekly)
  const deadlineActivities = activities.filter((a) => !a.activityType || a.activityType === 'deadline');
  const routineActivities = activities.filter(
    (a) =>
      a.activityType === 'rutin_harian' ||
      a.activityType === 'rutin_mingguan' ||
      a.activityType === 'rutin_bulanan'
  );

  const pendingDeadlineCount = deadlineActivities.filter((a) => !a.completed).length;
  const completedDeadlineCount = deadlineActivities.filter((a) => a.completed).length;

  // Filtered Deadline Activities
  const filteredDeadlines = deadlineActivities
    .filter((a) => {
      if (filterStatus === 'pending') return !a.completed;
      if (filterStatus === 'completed') return a.completed;
      return true;
    })
    .filter((a) => {
      if (selectedCategory === 'all') return true;
      return a.category === selectedCategory;
    })
    .sort((a, b) => {
      if (a.completed !== b.completed) return a.completed ? 1 : -1;
      return a.dueDate.localeCompare(b.dueDate);
    });

  // Filtered Routine Activities
  const filteredRoutines = routineActivities.filter((a) => {
    if (routineFilter === 'harian') return a.activityType === 'rutin_harian';
    if (routineFilter === 'mingguan') return a.activityType === 'rutin_mingguan';
    if (routineFilter === 'bulanan') return a.activityType === 'rutin_bulanan';
    if (routineFilter === 'ibadah') return a.category === 'ibadah';
    return true;
  });

  const handleCreateActivity = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    onAddActivity({
      title: title.trim(),
      category,
      activityType,
      weeklyInterval: activityType === 'rutin_mingguan' ? weeklyInterval : undefined,
      weeklyDay: activityType === 'rutin_mingguan' ? weeklyDay : undefined,
      dueDate: dueDate || getTodayDateString(0),
      dueTime: dueTime ? dueTime : undefined,
      reminderMinutesBefore: dueTime ? reminderMinutesBefore : undefined,
      completed: false,
      priority,
      notes: notes.trim() ? notes.trim() : undefined,
      routineCompletions: {}
    });

    if (soundEnabled) sound.playSuccess();

    // Reset form
    setTitle('');
    setCategory('kerjaan');
    setActivityType('deadline');
    setWeeklyInterval(1);
    setWeeklyDay(5);
    setDueDate(getTodayDateString(0));
    setDueTime('');
    setReminderMinutesBefore(15);
    setPriority('sedang');
    setNotes('');
    setIsAddModalOpen(false);
  };

  const getCategoryColor = (cat: ActivityItem['category']) => {
    switch (cat) {
      case 'ibadah':
        return 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-300/80';
      case 'kerjaan':
        return 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border-indigo-200/60';
      case 'kesehatan':
        return 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border-rose-200/60';
      case 'keuangan':
        return 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200/60';
      case 'belajar':
        return 'bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border-purple-200/60';
      case 'pribadi':
      default:
        return 'bg-teal-50 text-teal-700 dark:bg-teal-950/60 dark:text-teal-300 border-teal-200/60';
    }
  };

  const isRoutineCompleted = (act: ActivityItem): boolean => {
    const comps = act.routineCompletions || {};
    if (act.activityType === 'rutin_bulanan') {
      return Boolean(comps[currentMonth]);
    }
    if (act.activityType === 'rutin_mingguan') {
      const weekKey = getRoutineWeekKey(todayDate, act.weeklyInterval || 1);
      return Boolean(comps[weekKey]);
    }
    return Boolean(comps[todayDate]);
  };

  return (
    <div className="space-y-4 pb-6">
      {/* 1. Header bar with summary & Add button */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 shadow-xs">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <CheckSquare className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              Aktifitas & Kegiatan
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {pendingDeadlineCount > 0 ? (
                <span>
                  <strong className="text-rose-600 dark:text-rose-400 font-bold">{pendingDeadlineCount}</strong> tugas deadline menunggu diselesaikan
                </span>
              ) : (
                <span className="text-emerald-600 dark:text-emerald-400 font-medium">Semua deadline beres! 🎉</span>
              )}
            </p>
          </div>

          <button
            onClick={() => {
              setActivityType(activeTab === 'rutin' ? 'rutin_harian' : 'deadline');
              setIsAddModalOpen(true);
            }}
            className="px-3.5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 active:scale-95 rounded-xl shadow-xs flex items-center gap-1.5 transition-all min-h-[40px]"
          >
            <Plus className="w-4 h-4" />
            Tambah Kegiatan
          </button>
        </div>
      </div>

      {/* 2. Sub-Tab Pemisah: Deadline Tugas vs Aktifitas Rutin */}
      <div className="grid grid-cols-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl border border-slate-200/80 dark:border-slate-800">
        <button
          onClick={() => setActiveTab('deadline')}
          className={`py-2 px-3 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 ${
            activeTab === 'deadline'
              ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>Deadline Tugas ({deadlineActivities.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('rutin')}
          className={`py-2 px-3 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 ${
            activeTab === 'rutin'
              ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Repeat className="w-4 h-4 text-emerald-500" />
          <span>Aktifitas Rutin ({routineActivities.length})</span>
        </button>
      </div>

      {/* 3. SECTION A: DEADLINE TUGAS */}
      {activeTab === 'deadline' && (
        <div className="space-y-3">
          {/* Status Filters */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-3 shadow-xs space-y-2">
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl">
              <button
                onClick={() => setFilterStatus('pending')}
                className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all text-center ${
                  filterStatus === 'pending'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                }`}
              >
                Belum Selesai ({pendingDeadlineCount})
              </button>
              <button
                onClick={() => setFilterStatus('all')}
                className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all text-center ${
                  filterStatus === 'all'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                }`}
              >
                Semua ({deadlineActivities.length})
              </button>
              <button
                onClick={() => setFilterStatus('completed')}
                className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all text-center ${
                  filterStatus === 'completed'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                }`}
              >
                Selesai ({completedDeadlineCount})
              </button>
            </div>

            {/* Category Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
              {[
                { id: 'all', label: 'Semua Kategori' },
                { id: 'kerjaan', label: 'Kerjaan' },
                { id: 'ibadah', label: 'Ibadah' },
                { id: 'kesehatan', label: 'Kesehatan' },
                { id: 'keuangan', label: 'Keuangan' },
                { id: 'belajar', label: 'Belajar' },
                { id: 'pribadi', label: 'Pribadi' }
              ].map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-2.5 py-1 text-[11px] font-medium rounded-full shrink-0 transition-colors ${
                    selectedCategory === cat.id
                      ? 'bg-slate-900 dark:bg-slate-200 text-white dark:text-slate-900 font-bold'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* Activities List */}
          <div className="space-y-2.5">
            {filteredDeadlines.length === 0 ? (
              <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-8 text-center shadow-xs">
                <CheckCircle2 className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto mb-2" />
                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                  {filterStatus === 'pending'
                    ? 'Tidak ada kegiatan deadline yang tertunda'
                    : 'Belum ada daftar kegiatan'}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-xs mx-auto">
                  {filterStatus === 'pending'
                    ? 'Hebat! Semua tugas berbatas waktu sudah diselesaikan.'
                    : 'Catat kegiatan baru agar jadwal dan deadlinemu selalu teringat.'}
                </p>
                <button
                  onClick={() => {
                    setActivityType('deadline');
                    setIsAddModalOpen(true);
                  }}
                  className="mt-4 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl inline-flex items-center gap-1.5 active:scale-95 transition-all shadow-xs"
                >
                  <Plus className="w-4 h-4" />
                  Catat Kegiatan Baru
                </button>
              </div>
            ) : (
              filteredDeadlines.map((act) => {
                const urgency = getActivityUrgency(act.dueDate, act.dueTime, act.completed);

                return (
                  <div
                    key={act.id}
                    className={`bg-white dark:bg-slate-900 border rounded-2xl p-3.5 shadow-xs transition-all ${
                      act.completed
                        ? 'border-slate-200/60 dark:border-slate-800/60 opacity-65'
                        : urgency.isOverdue
                        ? 'border-rose-300 dark:border-rose-900/60 bg-rose-50/20 dark:bg-rose-950/20'
                        : urgency.isToday
                        ? 'border-amber-300 dark:border-amber-800/60 bg-amber-50/20 dark:bg-amber-950/20'
                        : 'border-slate-200/80 dark:border-slate-800'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      {/* Tap-friendly Checkbox */}
                      <button
                        onClick={() => onToggleActivity(act.id)}
                        className="mt-0.5 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 active:scale-90 transition-transform p-0.5"
                        title={act.completed ? 'Kembalikan ke belum selesai (isi alasan)' : 'Tandai selesai'}
                      >
                        {act.completed ? (
                          <CheckSquare className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                        ) : (
                          <Square className="w-5 h-5 text-slate-400 hover:text-indigo-600" />
                        )}
                      </button>

                      {/* Main Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span
                            className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border capitalize ${getCategoryColor(
                              act.category
                            )}`}
                          >
                            {act.category === 'ibadah' ? '🌙 Ibadah' : act.category}
                          </span>

                          {act.priority === 'tinggi' && (
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-rose-100 text-rose-700 dark:bg-rose-950/70 dark:text-rose-300">
                              Penting
                            </span>
                          )}

                          {/* Deadline Urgency Badge */}
                          <span
                            className={`text-[10px] px-2 py-0.5 rounded-full border flex items-center gap-1 ${urgency.badgeClass}`}
                          >
                            <Clock className="w-3 h-3" />
                            {urgency.label}
                          </span>
                        </div>

                        <h4
                          className={`text-sm font-semibold mt-1.5 leading-snug break-words ${
                            act.completed
                              ? 'line-through text-slate-400 dark:text-slate-500 font-normal'
                              : 'text-slate-900 dark:text-white'
                          }`}
                        >
                          {act.title}
                        </h4>

                        {/* Catatan / Detail Tambahan & Clickable Links */}
                        {act.notes && (
                          <div className="mt-2 p-2 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                            <div className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed break-words whitespace-pre-wrap">
                              <AutoLinkText text={act.notes} />
                            </div>
                            <QuickUrlButtons text={act.notes} />
                          </div>
                        )}
                      </div>

                      {/* Actions: Revert, Edit & Delete */}
                      <div className="flex items-center gap-1 shrink-0">
                        {act.completed && (
                          <button
                            onClick={() => onToggleActivity(act.id)}
                            className="text-amber-600 hover:text-amber-700 dark:text-amber-400 dark:hover:text-amber-300 p-1.5 rounded-lg hover:bg-amber-50 dark:hover:bg-amber-950/50 transition-colors flex items-center gap-1"
                            title="Kembalikan ke belum selesai (isi alasan)"
                            aria-label="Kembalikan ke belum selesai"
                          >
                            <RotateCcw className="w-4 h-4" />
                            <span className="hidden sm:inline text-[11px] font-semibold">Batal</span>
                          </button>
                        )}

                        <button
                          onClick={() => setEditingActivity(act)}
                          className="text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                          title="Edit kegiatan"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => onDeleteActivity(act.id)}
                          className="text-slate-300 hover:text-rose-600 dark:text-slate-600 dark:hover:text-rose-400 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                          title="Hapus kegiatan"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* 4. SECTION B: AKTIFITAS RUTIN (HARIAN & BULANAN) */}
      {activeTab === 'rutin' && (
        <div className="space-y-3">
          {/* Sub-Filters for Routine */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-3 shadow-xs flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            {[
              { id: 'all', label: 'Semua Rutin' },
              { id: 'harian', label: '🔄 Rutin Harian' },
              { id: 'mingguan', label: '🗓️ Rutin Mingguan' },
              { id: 'bulanan', label: '📅 Rutin Bulanan' },
              { id: 'ibadah', label: '🌙 Rutin Ibadah' }
            ].map((rf) => (
              <button
                key={rf.id}
                onClick={() => setRoutineFilter(rf.id as any)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-xl shrink-0 transition-colors ${
                  routineFilter === rf.id
                    ? 'bg-emerald-600 text-white shadow-xs font-bold'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                }`}
              >
                {rf.label}
              </button>
            ))}
          </div>

          <div className="space-y-2.5">
            {filteredRoutines.length === 0 ? (
              <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-8 text-center shadow-xs">
                <Repeat className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto mb-2" />
                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                  Belum ada kegiatan rutin
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-xs mx-auto">
                  Catat aktifitas rutin harian (seperti sholat 5 waktu, tilawah, cek email) atau bulanan (bayar tagihan, rekap gaji) agar tidak hilang dan bisa diupdate setiap hari!
                </p>
                <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
                  <button
                    onClick={() => {
                      setActivityType('rutin_harian');
                      setIsAddModalOpen(true);
                    }}
                    className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl inline-flex items-center gap-1.5 active:scale-95 transition-all shadow-xs"
                  >
                    <Plus className="w-4 h-4" />
                    Tambah Rutin Harian
                  </button>
                  <button
                    onClick={() => {
                      onAddActivity({
                        title: 'Sholat Fardhu 5 Waktu Tepat Waktu & Dzikir',
                        category: 'ibadah',
                        activityType: 'rutin_harian',
                        dueDate: todayDate,
                        completed: false,
                        priority: 'tinggi',
                        notes: 'Subuh, Dzuhur, Ashar, Maghrib, Isya. Menjaga ketenangan batin dan spiritual.'
                      });
                      onAddActivity({
                        title: "Tilawah Al-Qur'an 1 Ruku / 1 Halaman",
                        category: 'ibadah',
                        activityType: 'rutin_harian',
                        dueDate: todayDate,
                        completed: false,
                        priority: 'sedang',
                        notes: 'Rutinkan setiap hari setelah subuh atau sebelum istirahat malam.'
                      });
                      onAddActivity({
                        title: 'Bayar Tagihan Listrik, Internet & Air',
                        category: 'keuangan',
                        activityType: 'rutin_bulanan',
                        dueDate: `${todayDate.slice(0, 7)}-20`,
                        completed: false,
                        priority: 'tinggi',
                        notes: 'Cek tagihan awal bulan dan bayar via m-Banking sebelum tanggal 20.'
                      });
                      if (soundEnabled) sound.playSuccess();
                    }}
                    className="px-3.5 py-2 text-xs font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300/60 rounded-xl inline-flex items-center gap-1.5 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 transition-all"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
                    Muat Contoh Rutinitas Ibadah
                  </button>
                </div>
              </div>
            ) : (
              filteredRoutines.map((act) => {
                const isDone = isRoutineCompleted(act);
                const isMonthly = act.activityType === 'rutin_bulanan';
                const isWeekly = act.activityType === 'rutin_mingguan';

                let periodTitle = 'Rutin Harian';
                let completionText = isDone ? 'Selesai Hari Ini ✨' : 'Belum Hari Ini';

                if (isMonthly) {
                  periodTitle = 'Rutin Bulanan';
                  completionText = isDone ? 'Selesai Bulan Ini ✨' : 'Belum Bulan Ini';
                } else if (isWeekly) {
                  const freq = act.weeklyInterval === 2 ? '2 Minggu 1x' : 'Seminggu 1x';
                  const day = act.weeklyDay !== undefined ? ` · ${getWeeklyDayName(act.weeklyDay)}` : '';
                  periodTitle = `${freq}${day}`;
                  completionText = isDone ? 'Selesai Pekan Ini ✨' : 'Belum Pekan Ini';
                }

                return (
                  <div
                    key={act.id}
                    className={`bg-white dark:bg-slate-900 border rounded-2xl p-3.5 shadow-xs transition-all ${
                      isDone
                        ? 'border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/20 dark:bg-emerald-950/20'
                        : 'border-slate-200/80 dark:border-slate-800'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      {/* Routine Checkbox */}
                      <button
                        onClick={() => {
                          if (onToggleRoutine) {
                            onToggleRoutine(act.id);
                          } else {
                            onToggleActivity(act.id);
                          }
                        }}
                        className="mt-0.5 text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 active:scale-90 transition-transform p-0.5"
                        title={isDone ? `${completionText} (klik untuk ubah)` : `Tandai selesai`}
                      >
                        {isDone ? (
                          <CheckSquare className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                        ) : (
                          <Square className="w-5 h-5 text-slate-400 hover:text-emerald-600" />
                        )}
                      </button>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          {/* Routine Type Badge */}
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 flex items-center gap-1">
                            {isMonthly ? (
                              <CalendarRange className="w-3 h-3 text-indigo-500" />
                            ) : isWeekly ? (
                              <Calendar className="w-3 h-3 text-amber-500" />
                            ) : (
                              <Repeat className="w-3 h-3 text-emerald-500" />
                            )}
                            {periodTitle}
                          </span>

                          <span
                            className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border capitalize ${getCategoryColor(
                              act.category
                            )}`}
                          >
                            {act.category === 'ibadah' ? '🌙 Ibadah' : act.category}
                          </span>

                          {/* Completion Status Badge */}
                          {isDone ? (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 flex items-center gap-1 border border-emerald-200">
                              <CheckCircle2 className="w-3 h-3" />
                              {completionText}
                            </span>
                          ) : (
                            <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200">
                              {completionText}
                            </span>
                          )}
                        </div>

                        <h4
                          className={`text-sm font-semibold mt-1.5 leading-snug break-words ${
                            isDone ? 'text-slate-700 dark:text-slate-300' : 'text-slate-900 dark:text-white'
                          }`}
                        >
                          {act.title}
                        </h4>

                        {/* Catatan / Detail Tambahan & Clickable Links */}
                        {act.notes && (
                          <div className="mt-2 p-2 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                            <div className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed break-words whitespace-pre-wrap">
                              <AutoLinkText text={act.notes} />
                            </div>
                            <QuickUrlButtons text={act.notes} />
                          </div>
                        )}
                      </div>

                      {/* Actions: Edit & Delete */}
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => setEditingActivity(act)}
                          className="text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                          title="Edit kegiatan rutin"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => onDeleteActivity(act.id)}
                          className="text-slate-300 hover:text-rose-600 dark:text-slate-600 dark:hover:text-rose-400 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                          title="Hapus kegiatan rutin"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* 5. Modal Tambah Kegiatan */}
      {isAddModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-3.5 sm:p-4 bg-slate-900/60 backdrop-blur-xs"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsAddModalOpen(false);
          }}
        >
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-850">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
                  <Plus className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Catat Kegiatan Baru
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Pilih tipe deadline atau aktifitas rutin (harian/mingguan/bulanan)
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleCreateActivity} className="p-5 overflow-y-auto space-y-3.5 text-xs">
              {/* Tipe Kegiatan: Deadline vs Rutin */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Tipe Kegiatan
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                  {[
                    { id: 'deadline', label: 'Deadline Tugas', icon: Clock },
                    { id: 'rutin_harian', label: 'Rutin Harian', icon: Repeat },
                    { id: 'rutin_mingguan', label: 'Rutin Mingguan', icon: CalendarDays },
                    { id: 'rutin_bulanan', label: 'Rutin Bulanan', icon: CalendarRange }
                  ].map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setActivityType(t.id as any)}
                      className={`p-2 rounded-xl border text-center transition-all ${
                        activityType === t.id
                          ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 font-bold shadow-2xs'
                          : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      <t.icon className="w-3.5 h-3.5 mx-auto mb-1 opacity-80" />
                      <span className="text-[10px] block leading-tight">{t.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Rutin Mingguan Options: Frekuensi & Hari */}
              {activityType === 'rutin_mingguan' && (
                <div className="p-3 bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200/70 dark:border-indigo-800/60 rounded-xl space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-indigo-950 dark:text-indigo-200">
                      Jadwal Rutinitas Mingguan
                    </span>
                    <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-medium">
                      Pilihan Periode
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] font-medium text-slate-700 dark:text-slate-300 mb-1">
                        Frekuensi
                      </label>
                      <select
                        value={weeklyInterval}
                        onChange={(e) => setWeeklyInterval(Number(e.target.value) as 1 | 2)}
                        className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500 font-medium"
                      >
                        <option value={1}>Seminggu Sekali (Tiap Pekan)</option>
                        <option value={2}>Dua Minggu Sekali (2 Pekan 1x)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-medium text-slate-700 dark:text-slate-300 mb-1">
                        Hari Rutinitas
                      </label>
                      <select
                        value={weeklyDay}
                        onChange={(e) => setWeeklyDay(Number(e.target.value))}
                        className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500 font-medium"
                      >
                        <option value={1}>Senin</option>
                        <option value={2}>Selasa</option>
                        <option value={3}>Rabu</option>
                        <option value={4}>Kamis</option>
                        <option value={5}>Jumat</option>
                        <option value={6}>Sabtu</option>
                        <option value={0}>Minggu</option>
                      </select>
                    </div>
                  </div>

                  <p className="text-[10px] text-indigo-700/80 dark:text-indigo-300/80">
                    💡 Centang rutinitas ini akan otomatis di-reset saat periode {weeklyInterval === 2 ? '2 pekan baru' : 'pekan baru'} dimulai.
                  </p>
                </div>
              )}

              {/* Title */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Nama Kegiatan <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder={
                    activityType === 'rutin_harian'
                      ? 'Contoh: Sholat Fardhu 5 Waktu, Minum Vitamin, Daily Standup...'
                      : activityType === 'rutin_mingguan'
                      ? 'Contoh: Sholat Sunnah Jumat, Bersih-bersih Rumah, Evaluasi Mingguan...'
                      : activityType === 'rutin_bulanan'
                      ? 'Contoh: Bayar Listrik & Wifi, Rekap Keuangan Bulanan...'
                      : 'Contoh: Buat presentasi klien, kirim invoice...'
                  }
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Category & Priority */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Kategori
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as any)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500 capitalize"
                  >
                    <option value="kerjaan">Kerjaan</option>
                    <option value="ibadah">🌙 Ibadah & Spiritual</option>
                    <option value="kesehatan">Kesehatan</option>
                    <option value="keuangan">Keuangan</option>
                    <option value="belajar">Belajar</option>
                    <option value="pribadi">Pribadi</option>
                    <option value="lainnya">Lainnya</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Prioritas
                  </label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as any)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500 capitalize"
                  >
                    <option value="tinggi">Tinggi (Penting)</option>
                    <option value="sedang">Sedang</option>
                    <option value="rendah">Rendah</option>
                  </select>
                </div>
              </div>

              {/* Deadline specific date / time */}
              {activityType === 'deadline' && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Tanggal Tenggat
                    </label>
                    <input
                      type="date"
                      required
                      value={dueDate}
                      onChange={(e) => setDueDate(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Jam (Opsional)
                    </label>
                    <input
                      type="time"
                      value={dueTime}
                      onChange={(e) => setDueTime(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>
              )}

              {/* Pengingat Sebelum Jam Deadline */}
              {activityType === 'deadline' && dueTime && (
                <div className="p-3 bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-900/60 rounded-xl space-y-1.5 animate-in fade-in">
                  <label className="font-semibold text-amber-950 dark:text-amber-200 flex items-center justify-between text-xs">
                    <span>Waktu Pengingat Notifikasi</span>
                    <span className="text-[10px] text-amber-600 dark:text-amber-400 font-normal">Alarm & getar sebelum jamnya</span>
                  </label>
                  <select
                    value={reminderMinutesBefore}
                    onChange={(e) => setReminderMinutesBefore(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg border border-amber-300/80 dark:border-amber-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs font-medium focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                  >
                    <option value={0}>Tepat waktu (saat jam tiba)</option>
                    <option value={10}>10 menit sebelumnya</option>
                    <option value={15}>15 menit sebelumnya (Rekomendasi)</option>
                    <option value={30}>30 menit sebelumnya</option>
                    <option value={60}>1 jam sebelumnya</option>
                    <option value={120}>2 jam sebelumnya</option>
                    <option value={1440}>1 hari sebelumnya</option>
                  </select>
                </div>
              )}

              {/* Notes & Links */}
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center justify-between">
                  <span>Catatan / Link Pekerjaan (Opsional)</span>
                  <span className="text-[10px] text-slate-400 font-normal">Google Docs, Drive, dll</span>
                </label>
                <textarea
                  rows={2}
                  placeholder="Contoh: Kerjakan di https://docs.google.com/... atau catatan detail tugas"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
                {notes && <QuickUrlButtons text={notes} />}
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="flex-1 py-2.5 text-xs font-semibold text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 rounded-xl hover:bg-slate-200 transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 active:scale-98 rounded-xl shadow-xs transition-all"
                >
                  Simpan Kegiatan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Activity Modal */}
      <EditActivityModal
        isOpen={!!editingActivity}
        activity={editingActivity}
        onSave={(updated) => {
          onUpdateActivity(updated);
          if (soundEnabled) sound.playSuccess();
        }}
        onClose={() => setEditingActivity(null)}
      />
    </div>
  );
}
