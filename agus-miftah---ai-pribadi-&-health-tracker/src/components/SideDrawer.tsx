import React, { useEffect, useRef } from 'react';
import {
  X,
  Shield,
  Lock,
  Cloud,
  CloudOff,
  RefreshCw,
  Sun,
  Moon,
  Volume2,
  VolumeX,
  Laptop,
  Smartphone,
  Bell,
  CheckSquare,
  HeartPulse,
  Wallet,
  Home,
  UserCheck,
  ChevronRight,
  Sparkles,
  ExternalLink
} from 'lucide-react';
import { JarvisLogo } from './JarvisLogo';
import { MainTabType } from './MobileBottomNav';
import { AccessProfile } from '../types';
import { SyncStateStatus } from '../utils/sync';

interface SideDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  currentTab: MainTabType;
  onSelectTab: (tab: MainTabType) => void;
  syncStatus: SyncStateStatus;
  onOpenSyncModal: () => void;
  isDark: boolean;
  onToggleDark: () => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
  displayMode: 'auto' | 'mobile' | 'laptop';
  onChangeDisplayMode: (mode: 'auto' | 'mobile' | 'laptop') => void;
  onLockApp: () => void;
  onOpenPasscodeManager: () => void;
  activeProfile?: AccessProfile | null;
  notificationsEnabled: boolean;
  onRequestNotifications?: () => void;
  pendingActivitiesCount?: number;
  remindersCount?: number;
}

export function SideDrawer({
  isOpen,
  onClose,
  currentTab,
  onSelectTab,
  syncStatus,
  onOpenSyncModal,
  isDark,
  onToggleDark,
  soundEnabled,
  onToggleSound,
  displayMode,
  onChangeDisplayMode,
  onLockApp,
  onOpenPasscodeManager,
  activeProfile,
  notificationsEnabled,
  onRequestNotifications,
  pendingActivitiesCount = 0,
  remindersCount = 0
}: SideDrawerProps) {
  const drawerRef = useRef<HTMLDivElement>(null);
  const touchStartXRef = useRef<number>(0);
  const touchStartYRef = useRef<number>(0);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Touch handlers to swipe left to close drawer
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartXRef.current = e.touches[0].clientX;
    touchStartYRef.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const deltaX = e.changedTouches[0].clientX - touchStartXRef.current;
    const deltaY = Math.abs(e.changedTouches[0].clientY - touchStartYRef.current);
    // If swiped left by more than 50px and horizontally dominant
    if (deltaX < -50 && deltaY < 100) {
      onClose();
    }
  };

  const isMaster = Boolean(activeProfile?.isMaster);

  const getSyncLabel = () => {
    if (syncStatus === 'syncing') return 'Sedang menyinkronkan data...';
    if (syncStatus === 'synced') return 'Tersinkronisasi otomatis (Cloud)';
    return 'Mode Offline / Belum tersinkron';
  };

  const handleNavigate = (tab: MainTabType) => {
    onSelectTab(tab);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
        aria-hidden="true"
      />

      {/* Drawer Container */}
      <div
        ref={drawerRef}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        className="relative w-80 max-w-[85vw] h-full bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col justify-between overflow-y-auto z-10 transition-transform animate-in slide-in-from-left duration-250 ease-out"
      >
        {/* Drawer Header */}
        <div>
          <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800/80 bg-gradient-to-br from-slate-50 to-indigo-50/40 dark:from-slate-900 dark:to-slate-800/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <JarvisLogo size="md" variant="hybrid" animated={true} />
                <div>
                  <h2 className="text-base font-black tracking-wider text-slate-900 dark:text-white font-mono flex items-center gap-2">
                    JARVIS
                    <span className="w-2 h-2 rounded-full bg-cyan-400 shadow-xs shadow-cyan-400 animate-pulse" />
                  </h2>
                  <p className="text-[11px] text-cyan-600 dark:text-cyan-400 font-mono">
                    Personal Assistant
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors"
                aria-label="Tutup Menu"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Active User / Profile Card */}
            {activeProfile && (
              <div className="mt-3.5 p-2.5 rounded-xl bg-white/80 dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700/80 flex items-center justify-between shadow-2xs">
                <div className="flex items-center gap-2 overflow-hidden">
                  <div className={`p-1.5 rounded-lg ${
                    isMaster
                      ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300'
                      : 'bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300'
                  }`}>
                    <UserCheck className="w-4 h-4" />
                  </div>
                  <div className="overflow-hidden">
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium leading-none">
                      Profil Aktif
                    </p>
                    <p className="text-xs font-bold text-slate-900 dark:text-white truncate mt-0.5">
                      {isMaster ? '👑 ' + activeProfile.name : activeProfile.name}
                    </p>
                  </div>
                </div>

                {isMaster && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                    Master
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Quick Actions Navigation */}
          <div className="p-3 border-b border-slate-100 dark:border-slate-800">
            <p className="px-2 pb-1.5 text-[10px] font-bold tracking-wider text-slate-400 uppercase font-mono">
              Menu & Fitur Khusus
            </p>

            <div className="space-y-1">
              {/* Pengingat (Reminders) Button */}
              <button
                onClick={() => handleNavigate('reminders')}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  currentTab === 'reminders'
                    ? 'bg-amber-500 text-white shadow-xs'
                    : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/70'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`p-1.5 rounded-lg ${currentTab === 'reminders' ? 'bg-amber-600 text-white' : 'bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400'}`}>
                    <Bell className="w-4 h-4" />
                  </div>
                  <span>Pengingat & Alarm</span>
                </div>
                {remindersCount > 0 ? (
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${currentTab === 'reminders' ? 'bg-amber-700 text-white' : 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300'}`}>
                    {remindersCount}
                  </span>
                ) : (
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                )}
              </button>

              {/* Chat JARVIS AI */}
              <button
                onClick={() => handleNavigate('ai')}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  currentTab === 'ai'
                    ? 'bg-cyan-600 text-white shadow-xs'
                    : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/70'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`p-1.5 rounded-lg ${currentTab === 'ai' ? 'bg-cyan-700 text-white' : 'bg-cyan-100 dark:bg-cyan-950/60 text-cyan-600 dark:text-cyan-400'}`}>
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <span>Tanya JARVIS AI</span>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </button>
            </div>
          </div>

          {/* Keamanan & Akun */}
          <div className="p-3 border-b border-slate-100 dark:border-slate-800">
            <p className="px-2 pb-1.5 text-[10px] font-bold tracking-wider text-slate-400 uppercase font-mono">
              Keamanan & Password
            </p>

            <div className="space-y-1">
              {/* Atur Password & Hak Akses (Master) */}
              <button
                onClick={() => {
                  onClose();
                  onOpenPasscodeManager();
                }}
                className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/70 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="p-1.5 rounded-lg bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
                    <Shield className="w-4 h-4" />
                  </div>
                  <div className="text-left">
                    <p>Atur Password & Akses</p>
                    <p className="text-[10px] text-slate-400 font-normal">
                      {isMaster ? 'Kelola PIN & izin profil' : 'Lihat status keamanan'}
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </button>

              {/* Kunci Aplikasi Sekarang */}
              <button
                onClick={() => {
                  onClose();
                  onLockApp();
                }}
                className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="p-1.5 rounded-lg bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <span>Kunci Aplikasi Sekarang</span>
                </div>
                <span className="text-[10px] font-mono text-rose-500">Kunci PIN</span>
              </button>
            </div>
          </div>

          {/* Sinkronisasi Data */}
          <div className="p-3 border-b border-slate-100 dark:border-slate-800">
            <p className="px-2 pb-1.5 text-[10px] font-bold tracking-wider text-slate-400 uppercase font-mono">
              Sinkronisasi Cloud
            </p>

            <button
              onClick={() => {
                onClose();
                onOpenSyncModal();
              }}
              className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/70 transition-colors text-left"
            >
              <div className="flex items-center gap-3">
                <div className={`p-1.5 rounded-lg ${
                  syncStatus === 'synced'
                    ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400'
                    : syncStatus === 'syncing'
                    ? 'bg-cyan-100 dark:bg-cyan-950/60 text-cyan-600 dark:text-cyan-400'
                    : 'bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400'
                }`}>
                  {syncStatus === 'syncing' ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : syncStatus === 'synced' ? (
                    <Cloud className="w-4 h-4" />
                  ) : (
                    <CloudOff className="w-4 h-4" />
                  )}
                </div>
                <div>
                  <p>Sinkron HP & Laptop</p>
                  <p className="text-[10px] text-slate-400 font-normal">
                    {getSyncLabel()}
                  </p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </button>
          </div>

          {/* Pengaturan Tampilan & Preferensi */}
          <div className="p-3">
            <p className="px-2 pb-1.5 text-[10px] font-bold tracking-wider text-slate-400 uppercase font-mono">
              Tampilan & Preferensi
            </p>

            <div className="space-y-1">
              {/* Tema Gelap / Terang */}
              <div className="flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200">
                <div className="flex items-center gap-3">
                  <div className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                    {isDark ? <Moon className="w-4 h-4 text-cyan-400" /> : <Sun className="w-4 h-4 text-amber-500" />}
                  </div>
                  <span>Mode Gelap</span>
                </div>
                <button
                  onClick={onToggleDark}
                  className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors ${
                    isDark ? 'bg-indigo-600' : 'bg-slate-300'
                  }`}
                  aria-label="Ubah Tema"
                >
                  <div
                    className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                      isDark ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* Mode Tampilan (Laptop / HP / Auto) */}
              <div className="flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200">
                <div className="flex items-center gap-3">
                  <div className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                    {displayMode === 'laptop' ? (
                      <Laptop className="w-4 h-4 text-indigo-500" />
                    ) : (
                      <Smartphone className="w-4 h-4 text-emerald-500" />
                    )}
                  </div>
                  <span>Tampilan Layar</span>
                </div>
                <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-lg p-0.5 border border-slate-200 dark:border-slate-700">
                  <button
                    onClick={() => onChangeDisplayMode('auto')}
                    className={`px-2 py-0.5 text-[10px] rounded-md font-medium transition-all ${
                      displayMode === 'auto'
                        ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-2xs font-bold'
                        : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                    }`}
                  >
                    Auto
                  </button>
                  <button
                    onClick={() => onChangeDisplayMode('mobile')}
                    className={`px-2 py-0.5 text-[10px] rounded-md font-medium transition-all ${
                      displayMode === 'mobile'
                        ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-300 shadow-2xs font-bold'
                        : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                    }`}
                  >
                    HP
                  </button>
                  <button
                    onClick={() => onChangeDisplayMode('laptop')}
                    className={`px-2 py-0.5 text-[10px] rounded-md font-medium transition-all ${
                      displayMode === 'laptop'
                        ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-2xs font-bold'
                        : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                    }`}
                  >
                    Laptop
                  </button>
                </div>
              </div>

              {/* Suara Notifikasi / Audio Toggle */}
              <div className="flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200">
                <div className="flex items-center gap-3">
                  <div className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                    {soundEnabled ? <Volume2 className="w-4 h-4 text-emerald-500" /> : <VolumeX className="w-4 h-4 text-slate-400" />}
                  </div>
                  <span>Efek Suara Audio</span>
                </div>
                <button
                  onClick={onToggleSound}
                  className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors ${
                    soundEnabled ? 'bg-emerald-600' : 'bg-slate-300'
                  }`}
                  aria-label="Toggle Suara"
                >
                  <div
                    className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                      soundEnabled ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* Notifikasi Deadline */}
              {onRequestNotifications && (
                <div className="flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200">
                  <div className="flex items-center gap-3">
                    <div className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                      <Bell className={`w-4 h-4 ${notificationsEnabled ? 'text-amber-500' : 'text-slate-400'}`} />
                    </div>
                    <span>Notifikasi Browser/HP</span>
                  </div>
                  <button
                    onClick={onRequestNotifications}
                    className={`px-2.5 py-1 text-[10px] font-bold rounded-lg border transition-all ${
                      notificationsEnabled
                        ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    {notificationsEnabled ? 'Aktif' : 'Izinkan'}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Drawer Footer */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex items-center justify-between text-[11px] text-slate-400">
            <span>JARVIS Personal Life v2.4</span>
            <span className="flex items-center gap-1 font-mono text-[10px] text-emerald-500">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
              Terkunci & Aman
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
