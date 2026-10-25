import React from 'react';
import {
  Menu,
  Cloud,
  CloudOff,
  RefreshCw,
  UserCheck
} from 'lucide-react';
import { SyncStateStatus } from '../utils/sync';
import { JarvisLogo } from './JarvisLogo';
import { AccessProfile } from '../types';

interface MobileHeaderProps {
  onOpenSideMenu: () => void;
  syncStatus: SyncStateStatus;
  activeProfile?: AccessProfile | null;
  displayMode: 'auto' | 'mobile' | 'laptop';
}

export function MobileHeader({
  onOpenSideMenu,
  syncStatus,
  activeProfile,
  displayMode
}: MobileHeaderProps) {
  const isMaster = Boolean(activeProfile?.isMaster);

  return (
    <header className="sticky top-0 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 transition-colors px-3 sm:px-6 py-2.5">
      <div className={`mx-auto flex items-center justify-between gap-2 transition-all ${
        displayMode === 'laptop' ? 'max-w-6xl' : displayMode === 'mobile' ? 'max-w-lg' : 'max-w-lg lg:max-w-6xl'
      }`}>
        {/* Left: Hamburger Menu & JARVIS Avatar Button - Tapping opens side drawer */}
        <button
          onClick={onOpenSideMenu}
          className="flex items-center gap-2.5 sm:gap-3 text-left group p-1 -ml-1 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-all"
          title="Buka Menu & Pengaturan JARVIS"
          aria-label="Buka Menu Navigasi"
        >
          <div className="p-1 rounded-lg text-slate-500 group-hover:text-cyan-600 dark:text-slate-400 dark:group-hover:text-cyan-400 transition-colors">
            <Menu className="w-5 h-5" />
          </div>

          <div className="flex items-center gap-2">
            <div className="transition-transform group-hover:scale-105">
              <JarvisLogo size="md" variant="hybrid" animated={true} />
            </div>
            <div>
              <h1 className="text-sm font-black tracking-wider text-slate-900 dark:text-white leading-tight flex items-center gap-1.5 font-mono">
                JARVIS
                <span className="w-2 h-2 rounded-full bg-cyan-400 shadow-xs shadow-cyan-400 animate-pulse" title="JARVIS Aktif" />
              </h1>
              <span className="text-[10px] text-cyan-600 dark:text-cyan-400 font-mono tracking-tight hidden xs:inline">
                Personal Assistant
              </span>
            </div>
          </div>
        </button>

        {/* Right: Clean & Minimalist Profile & Sync Status - Tapping opens drawer */}
        <button
          onClick={onOpenSideMenu}
          className="flex items-center gap-2 px-2.5 py-1.5 rounded-full bg-slate-100/80 dark:bg-slate-800/80 hover:bg-slate-200/80 dark:hover:bg-slate-700/80 border border-slate-200/80 dark:border-slate-700/80 transition-all"
          title="Buka Menu Pengaturan & Profil"
        >
          {/* Sync indicator */}
          <div className="flex items-center gap-1" title={syncStatus === 'synced' ? 'Tersinkron Cloud' : syncStatus === 'syncing' ? 'Menyinkronkan...' : 'Offline'}>
            {syncStatus === 'syncing' ? (
              <RefreshCw className="w-3.5 h-3.5 text-cyan-500 animate-spin" />
            ) : syncStatus === 'synced' ? (
              <Cloud className="w-3.5 h-3.5 text-emerald-500" />
            ) : (
              <CloudOff className="w-3.5 h-3.5 text-amber-500" />
            )}
          </div>

          {/* Profile label */}
          {activeProfile && (
            <div className="flex items-center gap-1 text-[11px] font-bold text-slate-700 dark:text-slate-200 border-l border-slate-300 dark:border-slate-600 pl-2">
              <UserCheck className="w-3 h-3 text-indigo-500" />
              <span className="truncate max-w-[85px] sm:max-w-[120px]">
                {isMaster ? 'Master' : activeProfile.name}
              </span>
            </div>
          )}
        </button>
      </div>
    </header>
  );
}
