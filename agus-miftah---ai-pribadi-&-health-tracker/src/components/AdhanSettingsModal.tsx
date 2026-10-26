import React, { useState, useRef, useEffect } from 'react';
import {
  Upload,
  Music,
  Play,
  Square,
  Trash2,
  X,
  Check,
  AlertCircle,
  Volume2,
  Sparkles
} from 'lucide-react';
import { sound } from '../utils/audio';
import { saveCustomAudio, getCustomAudio, deleteCustomAudio } from '../utils/audioStorage';

interface AdhanSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  cityName: string;
  adhanSoundEnabled: boolean;
  onToggleAdhanSound: () => void;
  onCustomAudioChanged: () => void;
}

export function AdhanSettingsModal({
  isOpen,
  onClose,
  cityName,
  adhanSoundEnabled,
  onToggleAdhanSound,
  onCustomAudioChanged
}: AdhanSettingsModalProps) {
  const [customAudioInfo, setCustomAudioInfo] = useState<{ dataUrl: string; fileName: string } | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load saved custom audio on mount or when modal opens
  useEffect(() => {
    if (isOpen) {
      getCustomAudio('custom_adhan').then((result) => {
        setCustomAudioInfo(result);
      });
      setIsPlaying(false);
      setUploadSuccess(null);
      setErrorMessage(null);
    }
  }, [isOpen]);

  // Cleanup sound if modal closes
  useEffect(() => {
    if (!isOpen) {
      sound.stopAdhan();
      setIsPlaying(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file type
    if (!file.type.startsWith('audio/') && !file.name.match(/\.(mp3|wav|m4a|ogg|aac)$/i)) {
      setErrorMessage('Format file tidak didukung. Mohon pilih file audio seperti .mp3, .m4a, atau .wav.');
      return;
    }

    // Limit to 15MB for optimal mobile performance
    if (file.size > 15 * 1024 * 1024) {
      setErrorMessage('Ukuran file terlalu besar (maksimal 15 MB).');
      return;
    }

    setIsUploading(true);
    setErrorMessage(null);

    const reader = new FileReader();
    reader.onload = async () => {
      const dataUrl = reader.result as string;
      const success = await saveCustomAudio('custom_adhan', dataUrl, file.name, file.size);
      setIsUploading(false);

      if (success) {
        setCustomAudioInfo({ dataUrl, fileName: file.name });
        setUploadSuccess(`Suara "${file.name}" berhasil disimpan di HP Anda!`);
        onCustomAudioChanged();
        setTimeout(() => setUploadSuccess(null), 4000);
      } else {
        setErrorMessage('Gagal menyimpan file audio ke memori browser.');
      }
    };

    reader.onerror = () => {
      setIsUploading(false);
      setErrorMessage('Terjadi kesalahan saat membaca file audio.');
    };

    reader.readAsDataURL(file);
  };

  const handleTogglePlay = () => {
    if (isPlaying) {
      sound.stopAdhan();
      setIsPlaying(false);
    } else {
      sound.playAdhan(customAudioInfo?.dataUrl || null, () => {
        setIsPlaying(false);
      });
      setIsPlaying(true);
    }
  };

  const handleDeleteAudio = async () => {
    sound.stopAdhan();
    setIsPlaying(false);
    await deleteCustomAudio('custom_adhan');
    setCustomAudioInfo(null);
    onCustomAudioChanged();
    setUploadSuccess('Suara kustom dihapus. Menggunakan suara azan standar.');
    setTimeout(() => setUploadSuccess(null), 3500);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-3.5 sm:p-4 bg-slate-900/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          sound.stopAdhan();
          onClose();
        }
      }}
    >
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-linear-to-r from-emerald-500/10 via-teal-500/10 to-indigo-500/10 dark:from-emerald-950/40 dark:to-slate-900">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
              <Music className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                Pengaturan Suara Azan
                <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Panggilan Sholat 5 Waktu di {cityName}
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              sound.stopAdhan();
              onClose();
            }}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 overflow-y-auto">
          {/* Status Saklar Azan */}
          <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200/80 dark:border-slate-700">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
                <Volume2 className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-900 dark:text-white">
                  Bunyikan Suara Azan Otomatis
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  {adhanSoundEnabled ? 'Suara azan berbunyi saat masuk waktu sholat' : 'Suara azan dibisukan (hanya notifikasi teks)'}
                </p>
              </div>
            </div>

            <button
              onClick={onToggleAdhanSound}
              className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors ${
                adhanSoundEnabled ? 'bg-emerald-600' : 'bg-slate-300 dark:bg-slate-600'
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

          {/* Alert Messages */}
          {uploadSuccess && (
            <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{uploadSuccess}</span>
            </div>
          )}

          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-300 dark:border-rose-800 text-rose-800 dark:text-rose-200 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Status Suara Saat Ini (Kustom vs Standar) */}
          <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-850 space-y-3">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Sumber Suara Azan Saat Ini:
            </span>

            {customAudioInfo ? (
              <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60">
                <div className="flex items-center gap-2.5 overflow-hidden pr-2">
                  <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0">
                    <Music className="w-4 h-4" />
                  </div>
                  <div className="overflow-hidden">
                    <p className="text-xs font-bold text-emerald-900 dark:text-emerald-200 truncate">
                      {customAudioInfo.fileName}
                    </p>
                    <p className="text-[10px] text-emerald-700 dark:text-emerald-400">
                      File audio kustom tersimpan di HP Anda
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={handleTogglePlay}
                    className="p-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white transition-colors"
                    title={isPlaying ? 'Hentikan' : 'Putar Audio'}
                  >
                    {isPlaying ? <Square className="w-3.5 h-3.5 fill-current" /> : <Play className="w-3.5 h-3.5 fill-current" />}
                  </button>
                  <button
                    onClick={handleDeleteAudio}
                    className="p-2 rounded-lg bg-rose-100 hover:bg-rose-200 dark:bg-rose-950/80 dark:hover:bg-rose-900 text-rose-600 dark:text-rose-300 transition-colors"
                    title="Hapus dan kembali ke azan standar"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 flex items-center justify-center shrink-0">
                    <Volume2 className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      Azan Standar (Makkah / Al-Afasy)
                    </p>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400">
                      Suara muadzin asli bawaan sistem
                    </p>
                  </div>
                </div>

                <button
                  onClick={handleTogglePlay}
                  className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center gap-1.5 transition-colors"
                >
                  {isPlaying ? (
                    <>
                      <Square className="w-3 h-3 fill-current" />
                      <span>Stop</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-3 h-3 fill-current" />
                      <span>Tes</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>

          {/* Area Upload File Audio Sendiri */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-800 dark:text-slate-200">
              Upload File Audio Sendiri dari HP:
            </label>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Kamu bisa mengunggah rekaman azan, adhan dari file download, atau suara takbiran/notifikasi favoritmu (format .mp3, .m4a, atau .wav).
            </p>

            <input
              ref={fileInputRef}
              type="file"
              accept="audio/*,.mp3,.wav,.m4a,.ogg,.aac"
              onChange={handleFileUpload}
              className="hidden"
            />

            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="w-full py-3.5 px-4 rounded-xl border-2 border-dashed border-emerald-300 dark:border-emerald-700 hover:border-emerald-500 dark:hover:border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-emerald-800 dark:text-emerald-200 font-bold text-xs flex flex-col items-center justify-center gap-1.5 transition-all active:scale-99"
            >
              <Upload className={`w-5 h-5 text-emerald-600 dark:text-emerald-400 ${isUploading ? 'animate-bounce' : ''}`} />
              <span>{isUploading ? 'Menyimpan audio ke HP...' : 'Pilih File Suara dari HP / Komputer'}</span>
              <span className="text-[10px] text-slate-400 font-normal">
                Mendukung .mp3, .m4a, .wav (Maksimal 15 MB)
              </span>
            </button>
          </div>

          <div className="p-3 rounded-xl bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/60 text-[11px] text-amber-900 dark:text-amber-200">
            💡 <strong>Info:</strong> File audio yang kamu upload disimpan secara privat langsung di dalam memori penyimpanan browser HP (IndexedDB). Tidak memakan kuota internet dan otomatis siap berbunyi setiap waktu sholat tiba!
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900 flex justify-end">
          <button
            onClick={() => {
              sound.stopAdhan();
              onClose();
            }}
            className="px-4 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors"
          >
            Selesai
          </button>
        </div>
      </div>
    </div>
  );
}
