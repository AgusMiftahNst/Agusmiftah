import React, { useState } from 'react';
import { Bell, Plus, Trash2, Clock, Volume2, CheckCircle2, Smartphone } from 'lucide-react';
import { ReminderItem } from '../types';
import { sound } from '../utils/audio';
import {
  requestNotificationPermission,
  getNotificationPermissionStatus,
  sendLocalNotification
} from '../utils/notifications';

interface RemindersViewProps {
  reminders: ReminderItem[];
  onAddReminder: (reminder: Omit<ReminderItem, 'id'>) => void;
  onToggleReminder: (id: string) => void;
  onDeleteReminder: (id: string) => void;
  soundEnabled: boolean;
}

export function RemindersView({
  reminders,
  onAddReminder,
  onToggleReminder,
  onDeleteReminder,
  soundEnabled
}: RemindersViewProps) {
  const [permissionStatus, setPermissionStatus] = useState<string>(() =>
    getNotificationPermissionStatus()
  );
  const [isAdding, setIsAdding] = useState(false);
  const [title, setTitle] = useState('');
  const [time, setTime] = useState('07:00');
  const [note, setNote] = useState('');
  const [toastMessage, setToastMessage] = useState('');

  const handleRequestPermission = async () => {
    const granted = await requestNotificationPermission();
    setPermissionStatus(granted ? 'granted' : 'denied');
    if (granted) {
      sendLocalNotification('Agus Miftah: Notifikasi Aktif', {
        body: 'Pengingat harianmu siap berbunyi di HP dan laptop!'
      });
      if (soundEnabled) sound.playReminderAlert();
    }
  };

  const handleTestChime = () => {
    sound.playReminderAlert();
    setToastMessage('Nada alarm pengingat berhasil diputar.');
    setTimeout(() => setToastMessage(''), 2500);

    if (permissionStatus === 'granted') {
      sendLocalNotification('Uji Pengingat Agus Miftah', {
        body: 'Waktunya minum air dan cek tensi!'
      });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !time) return;

    onAddReminder({
      title: title.trim(),
      time,
      category: 'kesehatan',
      days: [1, 2, 3, 4, 5, 6, 0],
      enabled: true,
      note: note.trim() || 'Jaga kesehatan dan kebiasaan baikmu!'
    });

    if (soundEnabled) sound.playSuccess();
    setTitle('');
    setTime('07:00');
    setNote('');
    setIsAdding(false);
  };

  return (
    <div className="space-y-4 pb-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Bell className="w-5 h-5 text-indigo-600" />
            Pengingat Harian
          </h2>
          <span className="text-[11px] text-slate-500">
            Alarm otomatis di HP & Laptop
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={handleTestChime}
            title="Tes Nada"
            className="p-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs flex items-center gap-1"
          >
            <Volume2 className="w-3.5 h-3.5 text-indigo-500" />
            <span className="text-[10px] hidden sm:inline">Tes Nada</span>
          </button>
          <button
            onClick={() => setIsAdding(!isAdding)}
            className="px-3 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 active:scale-95 rounded-xl shadow-xs flex items-center gap-1 transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            Tambah
          </button>
        </div>
      </div>

      {toastMessage && (
        <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs flex items-center gap-2 animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Browser Notification Banner if not granted */}
      {permissionStatus !== 'granted' && (
        <div className="p-3 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/40 flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <Smartphone className="w-4 h-4 text-indigo-600 shrink-0" />
            <span className="text-[11px] text-slate-700 dark:text-slate-300">
              Aktifkan notifikasi browser agar alarm berbunyi tepat waktu di HP.
            </span>
          </div>
          <button
            onClick={handleRequestPermission}
            className="px-2.5 py-1 text-[11px] font-semibold text-white bg-indigo-600 rounded-lg whitespace-nowrap shrink-0"
          >
            Aktifkan
          </button>
        </div>
      )}

      {/* Add Reminder Form */}
      {isAdding && (
        <form
          onSubmit={handleSubmit}
          className="p-4 bg-white dark:bg-slate-900 border border-indigo-200 dark:border-indigo-900/60 rounded-2xl shadow-sm space-y-3 animate-fade-in"
        >
          <h3 className="text-xs font-bold text-slate-900 dark:text-white">
            Buat Pengingat Baru
          </h3>

          <div className="grid grid-cols-3 gap-2">
            <div className="col-span-2">
              <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                Judul Pengingat
              </label>
              <input
                type="text"
                required
                placeholder="Misal: Cek Tensi, Minum Air..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
              />
            </div>

            <div>
              <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                Jam (HH:MM)
              </label>
              <input
                type="time"
                required
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs font-mono tabular-nums bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
              Pesan / Catatan
            </label>
            <input
              type="text"
              placeholder="Catatan pendorong..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
            />
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="px-3 py-1.5 text-xs text-slate-500"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs"
            >
              Simpan
            </button>
          </div>
        </form>
      )}

      {/* Reminders List */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 shadow-xs space-y-2">
        <h3 className="text-xs font-bold text-slate-900 dark:text-white mb-1">
          Daftar Pengingat ({reminders.length})
        </h3>

        <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
          {reminders.map((rem) => (
            <div
              key={rem.id}
              className="py-3 flex items-center justify-between gap-3 text-xs"
            >
              <div className="flex items-start gap-2.5 min-w-0">
                <div className="px-2 py-1 bg-indigo-50 dark:bg-indigo-950/50 rounded-lg text-indigo-700 dark:text-indigo-300 font-mono font-bold text-xs shrink-0 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {rem.time}
                </div>
                <div className="truncate">
                  <span className="font-semibold text-slate-900 dark:text-white block truncate">
                    {rem.title}
                  </span>
                  <span className="text-[10px] text-slate-400 block truncate">
                    {rem.note}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => onToggleReminder(rem.id)}
                  className={`px-2 py-1 text-[11px] font-semibold rounded-lg border transition-colors ${
                    rem.enabled
                      ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-400 border-slate-200 dark:border-slate-700'
                  }`}
                >
                  {rem.enabled ? 'Aktif' : 'Mati'}
                </button>

                <button
                  onClick={() => onDeleteReminder(rem.id)}
                  className="p-1 text-slate-400 hover:text-red-500 rounded transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
