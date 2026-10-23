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
  const [priority, setPriority] = useState<ActivityItem['priority']>('sedang');
  const [notes, setNotes] = useState('');

  // Sync state whenever active activity changes
  useEffect(() => {
    if (activity) {
      setTitle(activity.title || '');
      setCategory(activity.category || 'kerjaan');
      setDueDate(activity.dueDate || getTodayDateString(0));
      setDueTime(activity.dueTime || '');
      setPriority(activity.priority || 'sedang');
      setNotes(activity.notes || '');
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
      dueDate: dueDate || getTodayDateString(0),
      dueTime: dueTime ? dueTime : undefined,
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

          {/* Kategori & Prioritas */}
          <div className="grid grid-cols-2 gap-3">
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
                <option value="kesehatan">Kesehatan</option>
                <option value="pribadi">Pribadi</option>
                <option value="keuangan">Keuangan</option>
                <option value="belajar">Belajar</option>
                <option value="lainnya">Lainnya</option>
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
