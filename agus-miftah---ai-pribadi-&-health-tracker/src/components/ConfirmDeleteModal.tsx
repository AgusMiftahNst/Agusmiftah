import React, { useEffect } from 'react';
import { AlertTriangle, Trash2, X } from 'lucide-react';

interface ConfirmDeleteModalProps {
  isOpen: boolean;
  title: string;
  itemName: string;
  itemDetails?: string;
  categoryLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDeleteModal({
  isOpen,
  title,
  itemName,
  itemDetails,
  categoryLabel,
  onConfirm,
  onCancel
}: ConfirmDeleteModalProps) {
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

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-delete-title"
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

        {/* Warning Icon Badge */}
        <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto border border-rose-100 dark:border-rose-900/40 shadow-xs">
          <AlertTriangle className="w-6 h-6 stroke-[2.2]" />
        </div>

        {/* Header & Item info */}
        <div className="space-y-1.5">
          <h3
            id="confirm-delete-title"
            className="text-base font-bold text-slate-900 dark:text-white"
          >
            {title}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Apakah Anda yakin ingin menghapus data ini?
          </p>
        </div>

        {/* Item Preview Card */}
        <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 p-3 rounded-xl text-left space-y-1">
          {categoryLabel && (
            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 block">
              {categoryLabel}
            </span>
          )}
          <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 line-clamp-2">
            {itemName}
          </p>
          {itemDetails && (
            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
              {itemDetails}
            </p>
          )}
        </div>

        {/* Reassurance text */}
        <p className="text-[11px] text-slate-400 dark:text-slate-500 leading-relaxed">
          Tindakan ini permanen dan akan menghapus catatan ini di semua perangkat Anda.
        </p>

        {/* Buttons */}
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
            className="flex-1 py-2.5 px-3 rounded-xl bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white font-bold text-xs shadow-xs transition-colors flex items-center justify-center gap-1.5 min-h-[44px]"
          >
            <Trash2 className="w-4 h-4" />
            Ya, Hapus
          </button>
        </div>
      </div>
    </div>
  );
}
