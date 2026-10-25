import React, { useState, useEffect } from 'react';
import { Edit3, Calendar, Clock, Tag, AlertCircle, X, Check } from 'lucide-react';
import { ActivityItem } from '../types';
import { getTodayDateString } from '../utils/storage';
import { QuickUrlButtons } from './AutoLinkText';

interface EditActivityModalProps {
  isOpen: boolean;
  activity: ActivityItem | null;
  onSave: (updatedActivity: ActivityItem) => void;
  onClose: () => void;
}

export function EditActivityModal({
  isOpen,
  activity,
  onSave,
  onClose
}: EditActivityModalProps) {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<ActivityItem['category']>('kerjaan');
  const [dueDate, setDueDate] = useState(getTodayDateString(0));
  const [dueTime, setDueTime] = useState('');
  const [activityType, setActivityType] = useState<ActivityItem['activityType']>('deadline');
  const [weeklyInterval, setWeeklyInterval] = useState<1 | 2>(1);
  const [weeklyDay, setWeeklyDay] = useState<number>(5); // default Jumat
  const [priority, setPriority] = useState<ActivityItem['priority']>('sedang');
  const [notes, setNotes] = useState('');
  const [reminderMinutesBefore, setReminderMinutesBefore] = useState<number>(15);

  // Sync state whenever active activity changes
  useEffect(() => {
    if (activity) {
      setTitle(activity.title || '');
      setCategory(activity.category || 'kerjaan');
      setActivityType(activity.activityType || 'deadline');
      setWeeklyInterval(activity.weeklyInterval === 2 ? 2 : 1);
      setWeeklyDay(typeof activity.weeklyDay === 'number' ? activity.weeklyDay : 5);
      setDueDate(activity.dueDate || getTodayDateString(0));
      setDueTime(activity.dueTime || '');
      setPriority(activity.priority || 'sedang');
      setNotes(activity.notes || '');
      setReminderMinutesBefore(typeof activity.reminderMinutesBefore === 'number' ? activity.reminderMinutesBefore : 15);
    }
  }, [activity]);

  // Escape key handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !activity) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    onSave({
      ...activity,
      title: title.trim(),
      category,
      activityType,
      weeklyInterval: activityType === 'rutin_mingguan' ? weeklyInterval : undefined,
      weeklyDay: activityType === 'rutin_mingguan' ? weeklyDay : undefined,
      dueDate: dueDate || getTodayDateString(0),
      dueTime: dueTime ? dueTime : undefined,
      reminderMinutesBefore: dueTime ? reminderMinutesBefore : undefined,
      priority,
      notes: notes.trim() ? notes.trim() : undefined
    });

    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="edit-activity-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3.5 sm:p-4 bg-slate-900/60 backdrop-blur-xs transition-opacity duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-850">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
              <Edit3 className="w-4 h-4" />
            </div>
            <div>
              <h2 id="edit-activity-title" className="text-sm font-bold text-slate-900 dark:text-white">
                Edit Kegiatan
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Perbarui rincian, tenggat, atau prioritas kegiatan
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Tutup"
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-4 text-xs">
          {/* Judul Kegiatan */}
          <div className="space-y-1.5">
            <label className="font-semibold text-slate-700 dark:text-slate-200">
              Judul Kegiatan <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Contoh: Kirim laporan bulanan ke tim"
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-xs"
            />
          </div>

          {/* Kategori, Tipe, Prioritas */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            <div className="space-y-1.5">
              <label className="font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-1">
                <Tag className="w-3.5 h-3.5 text-slate-400" />
                Kategori
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as ActivityItem['category'])}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-xs capitalize"
              >
                <option value="kerjaan">Kerjaan</option>
                <option value="ibadah">Ibadah & Spiritual</option>
                <option value="kesehatan">Kesehatan</option>
                <option value="keuangan">Keuangan</option>
                <option value="belajar">Belajar</option>
                <option value="pribadi">Pribadi</option>
                <option value="lainnya">Lainnya</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-1">
                Tipe Kegiatan
              </label>
              <select
                value={activityType}
                onChange={(e) => setActivityType(e.target.value as ActivityItem['activityType'])}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-xs"
              >
                <option value="deadline">Deadline (Berbatas Waktu)</option>
                <option value="rutin_harian">Rutin Harian (Tiap Hari)</option>
                <option value="rutin_mingguan">Rutin Mingguan (1x / 2x Pekan)</option>
                <option value="rutin_bulanan">Rutin Bulanan (Tiap Bulan)</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5 text-slate-400" />
                Prioritas
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as ActivityItem['priority'])}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-xs capitalize"
              >
                <option value="tinggi">Tinggi (Penting)</option>
                <option value="sedang">Sedang</option>
                <option value="rendah">Rendah</option>
              </select>
            </div>
          </div>

          {/* Pengaturan Khusus Rutin Mingguan: Seminggu 1x atau 2 Minggu 1x & Hari */}
          {activityType === 'rutin_mingguan' && (
            <div className="p-3 bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-900/60 rounded-xl space-y-2.5 animate-in fade-in">
              <div className="font-semibold text-amber-900 dark:text-amber-200 text-[11px] flex items-center justify-between">
                <span>Pengaturan Rutinitas Mingguan</span>
                <span className="text-[10px] font-normal text-amber-700 dark:text-amber-300">Siklus berulang</span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] text-slate-600 dark:text-slate-300 mb-1 font-medium">
                    Frekuensi Siklus
                  </label>
                  <select
                    value={weeklyInterval}
                    onChange={(e) => setWeeklyInterval(Number(e.target.value) as 1 | 2)}
                    className="w-full px-2.5 py-2 rounded-lg border border-amber-300/80 dark:border-amber-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs"
                  >
                    <option value={1}>Seminggu Sekali (1x / pekan)</option>
                    <option value={2}>Dua Minggu Sekali (1x / 2 pekan)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] text-slate-600 dark:text-slate-300 mb-1 font-medium">
                    Pilihan Hari
                  </label>
                  <select
                    value={weeklyDay}
                    onChange={(e) => setWeeklyDay(Number(e.target.value))}
                    className="w-full px-2.5 py-2 rounded-lg border border-amber-300/80 dark:border-amber-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs"
                  >
                    <option value={0}>Setiap Hari Minggu</option>
                    <option value={1}>Setiap Hari Senin</option>
                    <option value={2}>Setiap Hari Selasa</option>
                    <option value={3}>Setiap Hari Rabu</option>
                    <option value={4}>Setiap Hari Kamis</option>
                    <option value={5}>Setiap Hari Jumat</option>
                    <option value={6}>Setiap Hari Sabtu</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Tanggal & Jam Tenggat */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                Tanggal Tenggat
              </label>
              <input
                type="date"
                required
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-xs font-mono"
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                Jam (Opsional)
              </label>
              <input
                type="time"
                value={dueTime}
                onChange={(e) => setDueTime(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-xs font-mono"
              />
            </div>
          </div>

          {/* Pengingat Sebelum Jam Deadline */}
          {dueTime && (
            <div className="space-y-1.5 p-3 rounded-xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-900/60">
              <label className="font-semibold text-amber-950 dark:text-amber-200 flex items-center justify-between text-xs">
                <span>Waktu Pengingat Notifikasi</span>
                <span className="text-[10px] text-amber-600 dark:text-amber-400 font-normal">Alarm & getar otomatis</span>
              </label>
              <select
                value={reminderMinutesBefore}
                onChange={(e) => setReminderMinutesBefore(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-lg border border-amber-300/80 dark:border-amber-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs font-medium"
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

          {/* Catatan Tambahan & Link */}
          <div className="space-y-1.5">
            <label className="font-semibold text-slate-700 dark:text-slate-200 flex items-center justify-between">
              <span>Catatan / Link Pekerjaan</span>
              <span className="text-[10px] text-slate-400 font-normal">Google Docs, Drive, web, dll</span>
            </label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Contoh: Kerjakan di https://docs.google.com/... atau catatan penting"
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-xs resize-none"
            />
            {notes && <QuickUrlButtons text={notes} />}
          </div>

          {/* Action buttons */}
          <div className="pt-2 flex items-center gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700/80 text-slate-700 dark:text-slate-200 font-semibold text-xs transition-colors min-h-[44px]"
            >
              Batal
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-bold text-xs shadow-xs transition-colors flex items-center justify-center gap-1.5 min-h-[44px]"
            >
              <Check className="w-4 h-4" />
              Simpan Perubahan
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
