import React, { useState, useEffect, useRef } from 'react';
import {
  Moon,
  Clock,
  Volume2,
  Upload,
  Play,
  Square,
  Trash2,
  RotateCcw,
  Check,
  X,
  AlertCircle,
  Music,
  MapPin,
  Sparkles
} from 'lucide-react';
import { PrayerTimes, PrayerLocationSettings } from '../types';
import { sound } from '../utils/audio';
import { saveCustomAudio, getCustomAudio, deleteCustomAudio } from '../utils/audioStorage';

interface PrayerSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  prayerLocation: PrayerLocationSettings;
  defaultTimes: PrayerTimes;
  customTimes?: Partial<PrayerTimes>;
  useManual: boolean;
  onSavePrayerTimes: (customTimes: Partial<PrayerTimes>, useManual: boolean) => void;
  adhanSoundEnabled: boolean;
  onToggleAdhanSound: () => void;
  isAdhanPlaying: boolean;
  onTestAdhan: () => void;
  onStopAdhan: () => void;
}

export function PrayerSettingsModal({
  isOpen,
  onClose,
  prayerLocation,
  defaultTimes,
  customTimes = {},
  useManual = false,
  onSavePrayerTimes,
  adhanSoundEnabled,
  onToggleAdhanSound,
  isAdhanPlaying,
  onTestAdhan,
  onStopAdhan
}: PrayerSettingsModalProps) {
  const [isManualMode, setIsManualMode] = useState(useManual);
  const [subuh, setSubuh] = useState(customTimes.subuh || defaultTimes.subuh);
  const [dzuhur, setDzuhur] = useState(customTimes.dzuhur || defaultTimes.dzuhur);
  const [ashar, setAshar] = useState(customTimes.ashar || defaultTimes.ashar);
  const [maghrib, setMaghrib] = useState(customTimes.maghrib || defaultTimes.maghrib);
  const [isya, setIsya] = useState(customTimes.isya || defaultTimes.isya);

  const [customAudioInfo, setCustomAudioInfo] = useState<{ dataUrl: string; fileName: string } | null>(null);
  const [uploadToast, setUploadToast] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync state on open
  useEffect(() => {
    if (isOpen) {
      setIsManualMode(useManual);
      setSubuh(customTimes.subuh || defaultTimes.subuh);
      setDzuhur(customTimes.dzuhur || defaultTimes.dzuhur);
      setAshar(customTimes.ashar || defaultTimes.ashar);
      setMaghrib(customTimes.maghrib || defaultTimes.maghrib);
      setIsya(customTimes.isya || defaultTimes.isya);

      getCustomAudio('custom_adhan').then((res) => {
        setCustomAudioInfo(res);
      });
      setUploadToast(null);
    }
  }, [isOpen, defaultTimes, customTimes, useManual]);

  if (!isOpen) return null;

  const handleSaveTimes = (e: React.FormEvent) => {
    e.preventDefault();
    onSavePrayerTimes(
      {
        subuh,
        dzuhur,
        ashar,
        maghrib,
        isya
      },
      isManualMode
    );
    setUploadToast('Jadwal sholat berhasil diperbarui!');
    setTimeout(() => {
      setUploadToast(null);
      onClose();
    }, 1200);
  };

  const handleResetToAuto = () => {
    setIsManualMode(false);
    setSubuh(defaultTimes.subuh);
    setDzuhur(defaultTimes.dzuhur);
    setAshar(defaultTimes.ashar);
    setMaghrib(defaultTimes.maghrib);
    setIsya(defaultTimes.isya);
    onSavePrayerTimes({}, false);
    setUploadToast('Jadwal sholat direset ke hitungan astronomis otomatis.');
    setTimeout(() => setUploadToast(null), 3000);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('audio/') && !file.name.match(/\.(mp3|wav|m4a|ogg|aac)$/i)) {
      alert('Format file tidak didukung. Mohon gunakan file .mp3, .m4a, atau .wav.');
      return;
    }

    setIsUploading(true);
    const reader = new FileReader();
    reader.onload = async () => {
      const dataUrl = reader.result as string;
      await saveCustomAudio('custom_adhan', dataUrl, file.name, file.size);
      setCustomAudioInfo({ dataUrl, fileName: file.name });
      setIsUploading(false);
      setUploadToast(`Suara "${file.name}" berhasil di-upload ke HP!`);
      setTimeout(() => setUploadToast(null), 3500);
    };
    reader.readAsDataURL(file);
  };

  const handleDeleteAudio = async () => {
    onStopAdhan();
    await deleteCustomAudio('custom_adhan');
    setCustomAudioInfo(null);
    setUploadToast('Suara kustom dihapus. Kembali ke suara azan standar.');
    setTimeout(() => setUploadToast(null), 3000);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs transition-opacity animate-in fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onStopAdhan();
          onClose();
        }
      }}
    >
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-linear-to-r from-emerald-500/10 to-teal-500/10 dark:from-emerald-950/40 dark:to-slate-900">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
              <Moon className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5 font-mono">
                Jadwal Sholat & Azan
                <Sparkles className="w-3 h-3 text-emerald-500" />
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
                <MapPin className="w-3 h-3 text-emerald-600" />
                {prayerLocation.cityName}
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              onStopAdhan();
              onClose();
            }}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-5 space-y-4 overflow-y-auto flex-1">
          {uploadToast && (
            <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs flex items-center gap-2 animate-in fade-in">
              <Check className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{uploadToast}</span>
            </div>
          )}

          {/* SECTION 1: EDIT JAM SHOLAT */}
          <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-850 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-emerald-500" />
                  Jam Waktu Sholat 5 Waktu
                </h3>
                <p className="text-[10px] text-slate-500 dark:text-slate-400">
                  {isManualMode ? 'Mode Manual: Jam disesuaikan sendiri oleh Anda' : 'Mode Otomatis: Dihitung sesuai koordinat Nabire'}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setIsManualMode(!isManualMode)}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-all ${
                  isManualMode
                    ? 'bg-amber-500 text-white border-amber-600 shadow-2xs'
                    : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                }`}
              >
                {isManualMode ? '✏️ Mode Manual' : '🌐 Mode Otomatis'}
              </button>
            </div>

            {/* Prayer time inputs */}
            <form onSubmit={handleSaveTimes} className="space-y-2.5">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-300 mb-0.5">
                    Subuh
                  </label>
                  <input
                    type="time"
                    disabled={!isManualMode}
                    value={subuh}
                    onChange={(e) => setSubuh(e.target.value)}
                    className="w-full px-2 py-1.5 text-xs font-mono rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white disabled:opacity-60"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-300 mb-0.5">
                    Dzuhur
                  </label>
                  <input
                    type="time"
                    disabled={!isManualMode}
                    value={dzuhur}
                    onChange={(e) => setDzuhur(e.target.value)}
                    className="w-full px-2 py-1.5 text-xs font-mono rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white disabled:opacity-60"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-300 mb-0.5">
                    Ashar
                  </label>
                  <input
                    type="time"
                    disabled={!isManualMode}
                    value={ashar}
                    onChange={(e) => setAshar(e.target.value)}
                    className="w-full px-2 py-1.5 text-xs font-mono rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white disabled:opacity-60"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-300 mb-0.5">
                    Maghrib
                  </label>
                  <input
                    type="time"
                    disabled={!isManualMode}
                    value={maghrib}
                    onChange={(e) => setMaghrib(e.target.value)}
                    className="w-full px-2 py-1.5 text-xs font-mono rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white disabled:opacity-60"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-300 mb-0.5">
                    Isya
                  </label>
                  <input
                    type="time"
                    disabled={!isManualMode}
                    value={isya}
                    onChange={(e) => setIsya(e.target.value)}
                    className="w-full px-2 py-1.5 text-xs font-mono rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white disabled:opacity-60"
                  />
                </div>
              </div>

              {isManualMode ? (
                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="submit"
                    className="flex-1 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition-colors"
                  >
                    Simpan Jam Sholat Manual
                  </button>
                  <button
                    type="button"
                    onClick={handleResetToAuto}
                    className="px-3 py-2 text-xs font-medium text-slate-600 dark:text-slate-300 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 rounded-xl transition-colors flex items-center gap-1"
                    title="Reset ke jam otomatis Nabire"
                  >
                    <RotateCcw className="w-3 h-3" />
                    Reset
                  </button>
                </div>
              ) : (
                <p className="text-[10px] text-slate-400">
                  💡 Ingin ubah jamnya sesuai masjid daerahmu? Klik tombol <strong>Mode Manual</strong> di atas, lalu ubah jam sholatnya.
                </p>
              )}
            </form>
          </div>

          {/* SECTION 2: SUARA AZAN & UPLOAD AUDIO */}
          <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-850 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
                  <Volume2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-slate-900 dark:text-white">
                    Suara Azan Otomatis
                  </h3>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400">
                    {adhanSoundEnabled ? 'Berbunyi saat jam sholat tiba' : 'Suara dibisukan'}
                  </p>
                </div>
              </div>

              <button
                onClick={onToggleAdhanSound}
                className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors ${
                  adhanSoundEnabled ? 'bg-emerald-600' : 'bg-slate-300 dark:bg-slate-700'
                }`}
                aria-label="Toggle Suara Azan"
              >
                <div
                  className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                    adhanSoundEnabled ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Test Audio Button & Status */}
            <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2 overflow-hidden pr-2">
                <Music className="w-4 h-4 text-emerald-600 shrink-0" />
                <div className="overflow-hidden">
                  <p className="text-[11px] font-bold text-slate-800 dark:text-slate-200 truncate">
                    {customAudioInfo ? customAudioInfo.fileName : 'Azan Standar (Makkah / Al-Afasy)'}
                  </p>
                  <p className="text-[10px] text-slate-400">
                    {customAudioInfo ? 'Suara kustom dari HP Anda' : 'Suara muadzin bawaan'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                {isAdhanPlaying ? (
                  <button
                    onClick={onStopAdhan}
                    className="px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs flex items-center gap-1"
                  >
                    <Square className="w-3 h-3 fill-current" />
                    <span>Stop</span>
                  </button>
                ) : (
                  <button
                    onClick={onTestAdhan}
                    className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1 shadow-2xs"
                  >
                    <Play className="w-3 h-3 fill-current" />
                    <span>Tes Suara</span>
                  </button>
                )}

                {customAudioInfo && (
                  <button
                    onClick={handleDeleteAudio}
                    className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/50"
                    title="Hapus dan kembali ke azan standar"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Upload File Audio Sendiri */}
            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept="audio/*,.mp3,.wav,.m4a,.ogg"
                onChange={handleFileUpload}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="w-full py-2.5 px-3 rounded-xl border border-dashed border-emerald-300 dark:border-emerald-700 bg-emerald-50/40 dark:bg-emerald-950/20 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-emerald-800 dark:text-emerald-200 text-xs font-semibold flex items-center justify-center gap-2 transition-colors"
              >
                <Upload className={`w-4 h-4 text-emerald-600 ${isUploading ? 'animate-bounce' : ''}`} />
                <span>{isUploading ? 'Menyimpan...' : 'Upload File Suara Azan Sendiri dari HP'}</span>
              </button>
              <p className="text-[10px] text-slate-400 mt-1 text-center">
                Mendukung file .mp3, .m4a, atau .wav dari HP Anda
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900 flex justify-end">
          <button
            onClick={() => {
              onStopAdhan();
              onClose();
            }}
            className="px-4 py-1.5 text-xs font-bold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}
