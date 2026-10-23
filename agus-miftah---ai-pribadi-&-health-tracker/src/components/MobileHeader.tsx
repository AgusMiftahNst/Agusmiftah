import React from 'react';
import {
  Cloud,
  CloudOff,
  RefreshCw,
  Sun,
  Moon,
  Volume2,
  VolumeX,
  Laptop,
  Smartphone,
  Lock,
  Bell,
  Shield,
  UserCheck
} from 'lucide-react';
import { SyncStateStatus } from '../utils/sync';
import { JarvisLogo } from './JarvisLogo';
import { AccessProfile } from '../types';

interface MobileHeaderProps {
  syncStatus: SyncStateStatus;
  onOpenSyncModal: () => void;
  isDark: boolean;
  onToggleDark: () => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
  onOpenAIChat: () => void;
  displayMode: 'auto' | 'mobile' | 'laptop';
  onChangeDisplayMode: (mode: 'auto' | 'mobile' | 'laptop') => void;
  onLockApp: () => void;
  onOpenPasscodeManager: () => void;
  onRequestNotifications?: () => void;
  notificationsEnabled: boolean;
  activeProfile?: AccessProfile | null;
}

export function MobileHeader({
  syncStatus,
  onOpenSyncModal,
  isDark,
  onToggleDark,
  soundEnabled,
  onToggleSound,
  onOpenAIChat,
  displayMode,
  onChangeDisplayMode,
  onLockApp,
  onOpenPasscodeManager,
  onRequestNotifications,
  notificationsEnabled,
  activeProfile
}: MobileHeaderProps) {
  const cycleDisplayMode = () => {
    if (displayMode === 'auto') onChangeDisplayMode('laptop');
    else if (displayMode === 'laptop') onChangeDisplayMode('mobile');
    else onChangeDisplayMode('auto');
  };

  const getDisplayModeLabel = () => {
    if (displayMode === 'laptop') return 'Laptop';
    if (displayMode === 'mobile') return 'HP';
    return 'Auto';
  };

  const isMaster = Boolean(activeProfile?.isMaster);

  return (
    <header className="sticky top-0 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 transition-colors px-3 sm:px-6 py-2.5">
      <div className={`mx-auto flex items-center justify-between gap-2 transition-all ${
        displayMode === 'laptop' ? 'max-w-6xl' : displayMode === 'mobile' ? 'max-w-lg' : 'max-w-lg lg:max-w-6xl'
      }`}>
        {/* Brand & Jarvis Avatar + Active Profile badge */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <button
            onClick={onOpenAIChat}
            className="flex items-center gap-2 text-left group"
            title="Buka Chat JARVIS"
          >
            <JarvisLogo size="md" variant="hybrid" animated={true} />
            <div>
              <h1 className="text-sm font-black tracking-wider text-slate-900 dark:text-white leading-tight flex items-center gap-1.5 font-mono">
                JARVIS
                <span className="w-2 h-2 rounded-full bg-cyan-400 shadow-xs shadow-cyan-400 animate-pulse" title="JARVIS Aktif" />
              </h1>
              <span className="text-[10px] text-cyan-600 dark:text-cyan-400 font-mono tracking-tight hidden xs:inline">
                Personal Assistant
              </span>
            </div>
          </button>

          {/* Active Profile Pill */}
          {activeProfile && (
            <div
              className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border transition-all ${
                isMaster
                  ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800'
                  : 'bg-cyan-50 dark:bg-cyan-950/60 text-cyan-700 dark:text-cyan-300 border-cyan-200 dark:border-cyan-800'
              }`}
              title={`Profil Aktif: ${activeProfile.name}`}
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span className="truncate max-w-[120px]">
                {isMaster ? '👑 Master' : activeProfile.name}
              </span>
            </div>
          )}
        </div>

        {/* Right Tools: Display Mode, Sync, Lock, Sound, Theme */}
        <div className="flex items-center gap-1 sm:gap-1.5">
          {/* Opsi Mode Tampilan (Laptop vs HP vs Auto) */}
          <button
            onClick={cycleDisplayMode}
            title={`Ubah Tampilan (Saat ini: Mode ${getDisplayModeLabel()})`}
            className="flex items-center gap-1 px-2 py-1 text-[11px] font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800/80 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg border border-slate-200 dark:border-slate-700 transition-colors"
          >
            {displayMode === 'laptop' ? (
              <Laptop className="w-3.5 h-3.5 text-indigo-500" />
            ) : displayMode === 'mobile' ? (
              <Smartphone className="w-3.5 h-3.5 text-emerald-500" />
            ) : (
              <Laptop className="w-3.5 h-3.5 text-cyan-500" />
            )}
            <span className="hidden sm:inline text-[11px]">
              {getDisplayModeLabel()}
            </span>
          </button>

          {/* Sync Button */}
          <button
            onClick={onOpenSyncModal}
            title="Buka Menu Sinkronisasi HP & Laptop"
            className="flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800/80 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg border border-slate-200 dark:border-slate-700 transition-colors"
          >
            {syncStatus === 'syncing' ? (
              <RefreshCw className="w-3.5 h-3.5 text-cyan-500 animate-spin" />
            ) : syncStatus === 'synced' ? (
              <Cloud className="w-3.5 h-3.5 text-emerald-500" />
            ) : (
              <CloudOff className="w-3.5 h-3.5 text-amber-500" />
            )}
            <span className="text-[11px] font-medium hidden md:inline">
              {syncStatus === 'syncing' ? 'Sinkron...' : 'Sinkron'}
            </span>
          </button>

          {/* Notification Button */}
          {onRequestNotifications && (
            <button
              onClick={onRequestNotifications}
              title={notificationsEnabled ? 'Notifikasi Aktif' : 'Aktifkan Notifikasi Deadline'}
              className="p-1.5 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <Bell className={`w-4 h-4 ${notificationsEnabled ? 'text-amber-500' : 'text-slate-400'}`} />
            </button>
          )}

          {/* Kunci Aplikasi / Ganti Profil Button */}
          <button
            onClick={onLockApp}
            title="Kunci Aplikasi / Ganti Password Profil"
            className="p-1.5 text-slate-500 hover:text-cyan-600 dark:text-slate-400 dark:hover:text-cyan-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <Lock className="w-4 h-4" />
          </button>

          {/* Pengaturan Keamanan & Password Profiles (Master Only) */}
          {isMaster && (
            <button
              onClick={onOpenPasscodeManager}
              title="Atur Password & Hak Akses Fitur (Master)"
              className="p-1.5 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 rounded-lg border border-indigo-200/60 dark:border-indigo-800/60 transition-colors"
            >
              <Shield className="w-4 h-4" />
            </button>
          )}

          {/* Sound Toggle */}
          <button
            onClick={onToggleSound}
            title={soundEnabled ? 'Matikan Suara' : 'Aktifkan Suara'}
            className="p-1.5 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            {soundEnabled ? <Volume2 className="w-4 h-4 text-slate-700 dark:text-slate-200" /> : <VolumeX className="w-4 h-4 text-slate-400" />}
          </button>

          {/* Dark Mode Toggle */}
          <button
            onClick={onToggleDark}
            title={isDark ? 'Mode Terang' : 'Mode Gelap'}
            className="p-1.5 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            {isDark ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 text-slate-700" />
            )}
          </button>
        </div>
      </div>
    </header>
  );
}
