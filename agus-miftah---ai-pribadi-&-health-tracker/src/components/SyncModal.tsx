import React, { useState, useEffect } from 'react';
import {
  X,
  RefreshCw,
  Download,
  Upload,
  QrCode,
  Link as LinkIcon,
  CheckCircle2,
  AlertCircle,
  Laptop,
  Smartphone,
  Copy,
  Check,
  ShieldCheck,
  Sparkles
} from 'lucide-react';
import { AppState } from '../types';
import {
  SyncStateStatus,
  generateSyncQrDataUrl,
  generateSyncUrl,
  exportStateToJsonFile,
  parseStateFromJsonFile,
  getLastServerTimestamp,
  getLastSyncRevision
} from '../utils/sync';
import { sound } from '../utils/audio';

interface SyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  appState: AppState;
  syncStatus: SyncStateStatus;
  onForcePull: () => Promise<boolean>;
  onForcePush: () => Promise<boolean>;
  onImportState: (imported: AppState) => void;
}

export function SyncModal({
  isOpen,
  onClose,
  appState,
  syncStatus,
  onForcePull,
  onForcePush,
  onImportState
}: SyncModalProps) {
  const [activeTab, setActiveTab] = useState<'cloud' | 'qr' | 'backup'>('cloud');
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [copiedLink, setCopiedLink] = useState(false);
  const [isPulling, setIsPulling] = useState(false);
  const [isPushing, setIsPushing] = useState(false);
  const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Generate QR code whenever modal opens
  useEffect(() => {
    if (isOpen) {
      generateSyncQrDataUrl(appState).then((url) => {
        setQrDataUrl(url);
      });
      setActionMessage(null);
    }
  }, [isOpen, appState]);

  if (!isOpen) return null;

  const handleForcePull = async () => {
    setIsPulling(true);
    setActionMessage(null);
    try {
      const ok = await onForcePull();
      if (ok) {
        sound.playBreathCue(true);
        setActionMessage({
          type: 'success',
          text: 'Berhasil! Data terbaru dari laptop/server telah ditarik ke perangkat ini.'
        });
      } else {
        setActionMessage({
          type: 'error',
          text: 'Gagal menarik data dari server. Pastikan server aktif atau gunakan QR Code.'
        });
      }
    } catch {
      setActionMessage({
        type: 'error',
        text: 'Terjadi kesalahan jaringan saat menarik data.'
      });
    } finally {
      setIsPulling(false);
    }
  };

  const handleForcePush = async () => {
    setIsPushing(true);
    setActionMessage(null);
    try {
      const ok = await onForcePush();
      if (ok) {
        sound.playBreathCue(true);
        setActionMessage({
          type: 'success',
          text: 'Berhasil! Data perangkat ini telah tersimpan di server untuk disinkronkan ke HP.'
        });
      } else {
        setActionMessage({
          type: 'error',
          text: 'Gagal mengirim data ke server.'
        });
      }
    } catch {
      setActionMessage({
        type: 'error',
        text: 'Terjadi kesalahan jaringan saat mengirim data.'
      });
    } finally {
      setIsPushing(false);
    }
  };

  const handleCopyLink = () => {
    const url = generateSyncUrl(appState);
    if (!url) return;
    navigator.clipboard.writeText(url).then(() => {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const imported = await parseStateFromJsonFile(file);
      onImportState(imported);
      sound.playBreathCue(true);
      setActionMessage({
        type: 'success',
        text: 'Data berhasil dipulihkan dari file cadangan!'
      });
    } catch (err: any) {
      setActionMessage({
        type: 'error',
        text: err?.message || 'Gagal memulihkan file cadangan.'
      });
    }
    e.target.value = '';
  };

  const serverTime = getLastServerTimestamp();
  const formattedServerTime = serverTime > 0 ? new Date(serverTime).toLocaleTimeString('id-ID') : '-';
  const revision = getLastSyncRevision();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/70 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/40">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-cyan-500/10 dark:bg-cyan-500/20 text-cyan-600 dark:text-cyan-400 flex items-center justify-center font-bold">
              <RefreshCw className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                Sinkronisasi HP & Laptop
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Pastikan data kesehatan & kegiatan selalu sama di semua layar
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-100 dark:border-slate-800 text-xs font-semibold px-4 pt-2 gap-2 bg-slate-50/30 dark:bg-slate-800/20">
          <button
            onClick={() => setActiveTab('cloud')}
            className={`pb-2.5 px-3 border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'cloud'
                ? 'border-cyan-500 text-cyan-600 dark:text-cyan-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Sinkron Server
          </button>
          <button
            onClick={() => setActiveTab('qr')}
            className={`pb-2.5 px-3 border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'qr'
                ? 'border-cyan-500 text-cyan-600 dark:text-cyan-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <QrCode className="w-3.5 h-3.5" />
            Buka di HP (QR / Link)
          </button>
          <button
            onClick={() => setActiveTab('backup')}
            className={`pb-2.5 px-3 border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'backup'
                ? 'border-cyan-500 text-cyan-600 dark:text-cyan-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Download className="w-3.5 h-3.5" />
            Cadangan (.JSON)
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 overflow-y-auto space-y-4">
          {actionMessage && (
            <div
              className={`p-3 rounded-xl text-xs flex items-start gap-2.5 ${
                actionMessage.type === 'success'
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/50'
                  : 'bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-800/50'
              }`}
            >
              {actionMessage.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
              )}
              <span className="leading-relaxed">{actionMessage.text}</span>
            </div>
          )}

          {/* TAB 1: SERVER SYNC */}
          {activeTab === 'cloud' && (
            <div className="space-y-4">
              {/* Device Comparison Card */}
              <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800 p-4 rounded-xl space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <Laptop className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                    <span className="font-semibold text-slate-800 dark:text-slate-200">Laptop / Desktop</span>
                  </div>
                  <span className="text-slate-400 font-mono">⟷</span>
                  <div className="flex items-center gap-2">
                    <Smartphone className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    <span className="font-semibold text-slate-800 dark:text-slate-200">HP Smartphone</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between text-[11px]">
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`w-2 h-2 rounded-full ${
                        syncStatus === 'synced'
                          ? 'bg-emerald-500 shadow-xs shadow-emerald-400'
                          : syncStatus === 'syncing'
                          ? 'bg-amber-500 animate-ping'
                          : 'bg-slate-400'
                      }`}
                    />
                    <span className="text-slate-600 dark:text-slate-300 font-medium">
                      {syncStatus === 'synced'
                        ? '🟢 Server Terhubung'
                        : syncStatus === 'syncing'
                        ? '🟡 Menyinkronkan...'
                        : '⚪ Offline / Standalone'}
                    </span>
                  </div>
                  <span className="text-slate-400 dark:text-slate-500 font-mono">
                    {revision > 0 ? `Revisi #${revision}` : ''} {formattedServerTime !== '-' ? `· ${formattedServerTime}` : ''}
                  </span>
                </div>
              </div>

              {/* Data Summary Stats */}
              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                <div className="p-2.5 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-100 dark:border-slate-800">
                  <p className="text-[10px] text-slate-400 uppercase tracking-wider font-mono">Tugas</p>
                  <p className="text-base font-bold text-slate-800 dark:text-white mt-0.5">
                    {appState.activities?.length || 0}
                  </p>
                </div>
                <div className="p-2.5 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-100 dark:border-slate-800">
                  <p className="text-[10px] text-slate-400 uppercase tracking-wider font-mono">Kebiasaan</p>
                  <p className="text-base font-bold text-slate-800 dark:text-white mt-0.5">
                    {appState.habits?.length || 0}
                  </p>
                </div>
                <div className="p-2.5 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-100 dark:border-slate-800">
                  <p className="text-[10px] text-slate-400 uppercase tracking-wider font-mono">Skrining</p>
                  <p className="text-base font-bold text-slate-800 dark:text-white mt-0.5">
                    {appState.healthChecks?.length || 0}
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2 pt-1">
                <button
                  onClick={handleForcePull}
                  disabled={isPulling}
                  className="w-full py-3 px-4 bg-cyan-600 hover:bg-cyan-700 active:bg-cyan-800 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all disabled:opacity-50"
                >
                  <RefreshCw className={`w-4 h-4 ${isPulling ? 'animate-spin' : ''}`} />
                  {isPulling ? 'Menarik Data Terbaru...' : 'Tarik Data dari Laptop Sekarang'}
                </button>
                <p className="text-[11px] text-center text-slate-500 dark:text-slate-400">
                  Tekan tombol di atas pada HP jika tampilan di HP belum sama dengan di Laptop.
                </p>

                <div className="pt-2">
                  <button
                    onClick={handleForcePush}
                    disabled={isPushing}
                    className="w-full py-2.5 px-4 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl font-medium text-xs flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                  >
                    <Upload className={`w-3.5 h-3.5 ${isPushing ? 'animate-spin' : ''}`} />
                    {isPushing ? 'Menyimpan ke Server...' : 'Simpan Data Perangkat Ini ke Server'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: QR CODE & INSTANT LINK */}
          {activeTab === 'qr' && (
            <div className="space-y-4 text-center">
              <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 flex flex-col items-center">
                <p className="text-xs font-semibold text-slate-700 dark:text-slate-200 mb-2">
                  📱 Arahkan Kamera HP ke QR Code ini:
                </p>

                {qrDataUrl ? (
                  <div className="p-2.5 bg-white rounded-2xl shadow-md border border-slate-200">
                    <img src={qrDataUrl} alt="QR Code Sinkronisasi HP" className="w-52 h-52 object-contain" />
                  </div>
                ) : (
                  <div className="w-52 h-52 bg-slate-200 dark:bg-slate-700 rounded-2xl flex items-center justify-center">
                    <RefreshCw className="w-6 h-6 animate-spin text-slate-400" />
                  </div>
                )}

                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-3 max-w-xs leading-normal">
                  Kamera HP akan otomatis membuka aplikasi dan langsung memuat seluruh data kegiatan, kesehatan, dan keuangan dari laptop Anda.
                </p>
              </div>

              {/* Instant Link Copy */}
              <div className="space-y-2 text-left">
                <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                  <LinkIcon className="w-3.5 h-3.5 text-cyan-500" />
                  Atau kirim tautan ke WhatsApp / Email sendiri:
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    readOnly
                    value={generateSyncUrl(appState)}
                    className="flex-1 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-[11px] font-mono text-slate-600 dark:text-slate-400 truncate"
                  />
                  <button
                    onClick={handleCopyLink}
                    className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 dark:bg-cyan-600 dark:hover:bg-cyan-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors shrink-0"
                  >
                    {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    {copiedLink ? 'Tersalin!' : 'Salin'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: BACKUP / RESTORE */}
          {activeTab === 'backup' && (
            <div className="space-y-4">
              <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200/80 dark:border-slate-800 space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-800 dark:text-slate-200">
                  <ShieldCheck className="w-4 h-4 text-emerald-500" />
                  Cadangan Aman Data Pribadi
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                  Simpan file cadangan data berkala (.json) agar catatan riwayat tensi darah, asam urat, obat, checklist kebiasaan, dan transaksi keuangan Pak Agus tetap aman selamanya.
                </p>
              </div>

              <div className="space-y-2.5">
                <button
                  onClick={() => exportStateToJsonFile(appState)}
                  className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition-colors"
                >
                  <Download className="w-4 h-4" />
                  Download File Cadangan Data (.json)
                </button>

                <label className="w-full py-2.5 px-4 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl font-medium text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer">
                  <Upload className="w-4 h-4" />
                  Pulihkan / Unggah dari File (.json)
                  <input type="file" accept=".json,application/json" onChange={handleFileUpload} className="hidden" />
                </label>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3.5 bg-slate-50/80 dark:bg-slate-850 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
          <span className="flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-cyan-500" />
            JARVIS Auto-Sync Engine
          </span>
          <button
            onClick={onClose}
            className="px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg transition-colors"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}
