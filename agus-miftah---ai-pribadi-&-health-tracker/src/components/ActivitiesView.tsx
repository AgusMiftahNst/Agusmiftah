import React, { useState } from 'react';
import {
  CheckSquare,
  Square,
  Plus,
  Calendar,
  Clock,
  Trash2,
  AlertCircle,
  Tag,
  CheckCircle2,
  Filter,
  Bell,
  X
} from 'lucide-react';
import { ActivityItem } from '../types';
import { getActivityUrgency, getTodayDateString, formatDateIndonesian } from '../utils/storage';
import { sound } from '../utils/audio';

interface ActivitiesViewProps {
  activities: ActivityItem[];
  onToggleActivity: (id: string) => void;
  onAddActivity: (activity: Omit<ActivityItem, 'id' | 'createdAt'>) => void;
  onDeleteActivity: (id: string) => void;
  onNavigateToReminders?: () => void;
  soundEnabled: boolean;
}

export function ActivitiesView({
  activities,
  onToggleActivity,
  onAddActivity,
  onDeleteActivity,
  onNavigateToReminders,
  soundEnabled
}: ActivitiesViewProps) {
  const [filterStatus, setFilterStatus] = useState<'pending' | 'completed' | 'all'>('pending');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // New activity form state
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<ActivityItem['category']>('kerjaan');
  const [dueDate, setDueDate] = useState(getTodayDateString(0));
  const [dueTime, setDueTime] = useState('');
  const [priority, setPriority] = useState<ActivityItem['priority']>('sedang');
  const [notes, setNotes] = useState('');

  const pendingCount = activities.filter((a) => !a.completed).length;
  const completedCount = activities.filter((a) => a.completed).length;

  // Filter activities
  const filteredActivities = activities
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
      // Pending first, then by dueDate ascending
      if (a.completed !== b.completed) {
        return a.completed ? 1 : -1;
      }
      return a.dueDate.localeCompare(b.dueDate);
    });

  const handleCreateActivity = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    onAddActivity({
      title: title.trim(),
      category,
      dueDate: dueDate || getTodayDateString(0),
      dueTime: dueTime ? dueTime : undefined,
      completed: false,
      priority,
      notes: notes.trim() ? notes.trim() : undefined
    });

    if (soundEnabled) sound.playSuccess();

    // Reset form
    setTitle('');
    setCategory('kerjaan');
    setDueDate(getTodayDateString(0));
    setDueTime('');
    setPriority('sedang');
    setNotes('');
    setIsAddModalOpen(false);
  };

  const getCategoryColor = (cat: ActivityItem['category']) => {
    switch (cat) {
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
        return 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200/60';
    }
  };

  return (
    <div className="space-y-4 pb-6">
      {/* Header bar with summary & Add button */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 shadow-xs">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <CheckSquare className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              Aktifitas & Deadline
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {pendingCount > 0 ? (
                <span>
                  <strong className="text-rose-600 dark:text-rose-400 font-bold">{pendingCount}</strong> kegiatan belum dikerjakan
                </span>
              ) : (
                <span className="text-emerald-600 dark:text-emerald-400 font-medium">Semua kegiatan sudah selesai! 🎉</span>
              )}
            </p>
          </div>

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="px-3 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 active:scale-95 rounded-xl shadow-xs transition-all flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            Tambah
          </button>
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1.5 mt-3.5 pt-3 border-t border-slate-100 dark:border-slate-800">
          <button
            onClick={() => setFilterStatus('pending')}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all text-center ${
              filterStatus === 'pending'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            Belum Selesai ({pendingCount})
          </button>
          <button
            onClick={() => setFilterStatus('all')}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all text-center ${
              filterStatus === 'all'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            Semua ({activities.length})
          </button>
          <button
            onClick={() => setFilterStatus('completed')}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all text-center ${
              filterStatus === 'completed'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            Selesai ({completedCount})
          </button>
        </div>

        {/* Category Pills (horizontal scrollable on mobile) */}
        <div className="flex items-center gap-1.5 mt-2.5 overflow-x-auto no-scrollbar py-1">
          {[
            { id: 'all', label: 'Semua Kategori' },
            { id: 'kerjaan', label: 'Kerjaan' },
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
                  ? 'bg-slate-800 dark:bg-slate-200 text-white dark:text-slate-900 font-semibold'
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
        {filteredActivities.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-8 text-center shadow-xs">
            <CheckCircle2 className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto mb-2.5" />
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
              {filterStatus === 'pending'
                ? 'Tidak ada kegiatan yang tertunda'
                : 'Belum ada daftar kegiatan'}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-xs mx-auto">
              {filterStatus === 'pending'
                ? 'Hebat! Semua deadline kegiatanmu sudah diselesaikan atau belum ada yang dicatat.'
                : 'Tambah kegiatan baru agar deadline tugas dan rencanamu selalu teringat.'}
            </p>
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="mt-4 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl inline-flex items-center gap-1.5 active:scale-95 transition-all shadow-xs"
            >
              <Plus className="w-4 h-4" />
              Catat Kegiatan Baru
            </button>
          </div>
        ) : (
          filteredActivities.map((act) => {
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
                    onClick={() => {
                      if (!act.completed && soundEnabled) sound.playSuccess();
                      onToggleActivity(act.id);
                    }}
                    className="mt-0.5 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 active:scale-90 transition-transform p-0.5"
                    title={act.completed ? 'Tandai belum selesai' : 'Tandai selesai'}
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
                        {act.category}
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

                    {act.notes && (
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed bg-slate-50 dark:bg-slate-800/50 p-2 rounded-lg">
                        {act.notes}
                      </p>
                    )}
                  </div>

                  {/* Delete button */}
                  <button
                    onClick={() => onDeleteActivity(act.id)}
                    className="text-slate-300 hover:text-rose-600 dark:text-slate-600 dark:hover:text-rose-400 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    title="Hapus kegiatan"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Shortcut to Routine Reminders / Alarm */}
      {onNavigateToReminders && (
        <div className="p-3 bg-linear-to-r from-indigo-50 to-purple-50 dark:from-indigo-950/30 dark:to-purple-950/30 border border-indigo-100 dark:border-indigo-900/40 rounded-2xl flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-indigo-600 text-white">
              <Bell className="w-3.5 h-3.5" />
            </div>
            <div>
              <span className="font-bold text-slate-800 dark:text-slate-200">
                Pengingat Jam & Alarm Rutin
              </span>
              <p className="text-[10px] text-slate-500 dark:text-slate-400">
                Atur alarm jam minum air, peregangan badan, atau istirahat
              </p>
            </div>
          </div>
          <button
            onClick={onNavigateToReminders}
            className="px-2.5 py-1 text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline shrink-0"
          >
            Buka &rarr;
          </button>
        </div>
      )}

      {/* Modal / Sheet: Add New Activity */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xs p-0 sm:p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-2xl p-5 shadow-2xl border border-slate-200 dark:border-slate-800 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-4">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Plus className="w-4 h-4 text-indigo-600" />
                Catat Kegiatan & Deadline
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateActivity} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Nama Kegiatan / Tugas <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Misal: Kirim revisi desain atau beli obat"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                  autoFocus
                />
              </div>

              {/* Category selector */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Kategori
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  {(['kerjaan', 'kesehatan', 'keuangan', 'belajar', 'pribadi'] as const).map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setCategory(cat)}
                      className={`py-1.5 px-2 text-[11px] font-semibold rounded-lg capitalize border transition-all ${
                        category === cat
                          ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300'
                          : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Deadline Date & Time */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-indigo-600" />
                    Batas Tanggal <span className="text-rose-500">*</span>
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
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-indigo-600" />
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

              {/* Priority */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Tingkat Prioritas
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  {[
                    { id: 'tinggi' as const, label: 'Penting / Urgent', color: 'text-rose-600 border-rose-300' },
                    { id: 'sedang' as const, label: 'Sedang / Biasa', color: 'text-amber-600 border-amber-300' },
                    { id: 'rendah' as const, label: 'Santai', color: 'text-slate-600 border-slate-300' }
                  ].map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setPriority(p.id)}
                      className={`py-1.5 px-1.5 text-[11px] font-semibold rounded-lg border transition-all text-center ${
                        priority === p.id
                          ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300'
                          : 'border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400'
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Catatan Tambahan (Opsional)
                </label>
                <textarea
                  rows={2}
                  placeholder="Detail link, nomor telepon, atau catatan penting..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
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
    </div>
  );
}
