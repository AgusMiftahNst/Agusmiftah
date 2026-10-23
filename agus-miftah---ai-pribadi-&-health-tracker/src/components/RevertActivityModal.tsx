import React, { useState, useEffect } from 'react';
import { RotateCcw, Calendar, Clock, X, AlertCircle } from 'lucide-react';
import { ActivityItem } from '../types';
import { formatDateIndonesian } from '../utils/storage';

interface RevertActivityModalProps {
  isOpen: boolean;
  activity: ActivityItem | null;
  onConfirm: (activityId: string, reason: string) => void;
  onCancel: () => void;
}

const QUICK_REASONS = [
  'Keliru ketekan / kepencet',
  'Perlu revisi / tambahan',
  'Tugas dilanjutkan lagi',
  'Masih ada data yang kurang',
  'Pekerjaan belum tuntas'
];

export function RevertActivityModal({
  isOpen,
  activity,
  onConfirm,
  onCancel
}: RevertActivityModalProps) {
  const [reason, setReason] = useState('');

  // Reset reason when modal opens for a new activity
  useEffect(() => {
    if (isOpen) {
      setReason('');
    }
  }, [isOpen, activity?.id]);

  // Listen for Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onCancel();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onCancel]);

  if (!isOpen || !activity) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onConfirm(activity.id, reason.trim());
  };

  const handleChipClick = (chipText: string) => {
    setReason((prev) => (prev ? `${prev}, ${chipText}` : chipText));
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="revert-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs transition-opacity duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onCancel();
      }}
    >
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden p-5 flex flex-col space-y-4 animate-in fade-in zoom-in-95 duration-150">
        {/* Top Bar */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center border border-amber-200/60 dark:border-amber-900/50">
              <RotateCcw className="w-4 h-4 stroke-[2.3]" />
            </div>
            <div>
              <h3
                id="revert-modal-title"
                className="text-sm font-bold text-slate-900 dark:text-white"
              >
                Kembalikan ke Belum Selesai?
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Mitigasi bila tidak sengaja tertekan atau tugas berlanjut
              </p>
            </div>
          </div>

          <button
            onClick={onCancel}
            aria-label="Tutup"
            className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Activity Details Preview */}
        <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 p-3 rounded-xl text-left space-y-1.5">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full border uppercase tracking-wider bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 border-slate-200">
              {activity.category}
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-semibold border border-emerald-200 dark:border-emerald-900/50">
              Status Saat Ini: Selesai
            </span>
          </div>

          <p className="text-xs font-semibold text-slate-900 dark:text-white leading-snug">
            {activity.title}
          </p>

          <div className="flex items-center gap-3 text-[11px] text-slate-500 dark:text-slate-400 pt-0.5 font-mono">
            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3 text-slate-400" />
              {formatDateIndonesian(activity.dueDate)}
            </span>
            {activity.dueTime && (
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3 text-slate-400" />
                {activity.dueTime}
              </span>
            )}
          </div>
        </div>

        {/* Reason Form */}
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center justify-between">
              <span>Alasan Dibatalkan Selesai:</span>
              <span className="text-[10px] text-slate-400 font-normal">Opsional / Catatan</span>
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Contoh: Keliru ketekan, masih ada revisi berkas, atau tugas dilanjutkan..."
              rows={3}
              className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 resize-none"
              autoFocus
            />
          </div>

          {/* Quick Select Reason Chips */}
          <div>
            <p className="text-[10px] font-medium text-slate-400 mb-1.5 flex items-center gap-1">
              <AlertCircle className="w-3 h-3 text-amber-500" />
              Pilih cepat alasan:
            </p>
            <div className="flex flex-wrap gap-1.5">
              {QUICK_REASONS.map((chip) => (
                <button
                  key={chip}
                  type="button"
                  onClick={() => handleChipClick(chip)}
                  className="text-[10px] px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 hover:bg-amber-50 hover:border-amber-300 dark:hover:bg-amber-950/40 text-slate-600 dark:text-slate-300 transition-colors"
                >
                  + {chip}
                </button>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2.5 pt-2">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 py-2.5 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700/80 text-slate-700 dark:text-slate-200 font-semibold text-xs transition-colors min-h-[44px]"
            >
              Batal
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 px-3 rounded-xl bg-amber-600 hover:bg-amber-700 active:bg-amber-800 text-white font-bold text-xs shadow-xs shadow-amber-600/20 transition-colors flex items-center justify-center gap-1.5 min-h-[44px]"
            >
              <RotateCcw className="w-4 h-4" />
              Jadikan Belum Selesai
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
