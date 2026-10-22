import React, { useEffect } from 'react';
import { CheckCircle2, Calendar, Clock, X } from 'lucide-react';
import { ActivityItem } from '../types';
import { getActivityUrgency, formatDateIndonesian } from '../utils/storage';

interface ConfirmCompleteModalProps {
  isOpen: boolean;
  activity: ActivityItem | null;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmCompleteModal({
  isOpen,
  activity,
  onConfirm,
  onCancel
}: ConfirmCompleteModalProps) {
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

  const urgency = getActivityUrgency(activity.dueDate, activity.dueTime, activity.completed);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-complete-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs transition-opacity duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onCancel();
      }}
    >
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden p-5 flex flex-col text-center space-y-4 animate-in fade-in zoom-in-95 duration-150">
        {/* Top Close Button */}
        <div className="flex justify-end -mt-1 -mr-1">
          <button
            onClick={onCancel}
            aria-label="Tutup"
            className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Success Icon Badge */}
        <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto border border-emerald-100 dark:border-emerald-900/40 shadow-xs">
          <CheckCircle2 className="w-6 h-6 stroke-[2.2]" />
        </div>

        {/* Header */}
        <div className="space-y-1">
          <h3
            id="confirm-complete-title"
            className="text-base font-bold text-slate-900 dark:text-white"
          >
            Tandai Selesai Kegiatan?
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Apakah kegiatan ini sudah benar-benar selesai Anda kerjakan?
          </p>
        </div>

        {/* Activity Details Preview */}
        <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 p-3.5 rounded-xl text-left space-y-2">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full border uppercase tracking-wider bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border-indigo-200/60">
              {activity.category}
            </span>
            <span className={`text-[10px] px-2 py-0.5 rounded-full border ${urgency.badgeClass}`}>
              {urgency.label}
            </span>
          </div>

          <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 leading-snug">
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

          {activity.notes && (
            <p className="text-[11px] text-slate-500 dark:text-slate-400 bg-white/80 dark:bg-slate-900/80 p-2 rounded-lg border border-slate-200/60 dark:border-slate-800/60 line-clamp-2 italic">
              "{activity.notes}"
            </p>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5 pt-1">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 py-2.5 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700/80 text-slate-700 dark:text-slate-200 font-semibold text-xs transition-colors min-h-[44px]"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="flex-1 py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold text-xs shadow-xs shadow-emerald-600/20 transition-colors flex items-center justify-center gap-1.5 min-h-[44px]"
          >
            <CheckCircle2 className="w-4 h-4" />
            Ya, Selesai!
          </button>
        </div>
      </div>
    </div>
  );
}
