import React from 'react';
import { Bot, Cloud, CloudOff, RefreshCw, Sun, Moon, Volume2, VolumeX } from 'lucide-react';
import { SyncStateStatus } from '../utils/sync';

interface MobileHeaderProps {
  syncStatus: SyncStateStatus;
  onManualSync: () => void;
  isDark: boolean;
  onToggleDark: () => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
  onOpenAIChat: () => void;
}

export function MobileHeader({
  syncStatus,
  onManualSync,
  isDark,
  onToggleDark,
  soundEnabled,
  onToggleSound,
  onOpenAIChat
}: MobileHeaderProps) {
  return (
    <header className="sticky top-0 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 transition-colors px-4 py-2.5">
      <div className="max-w-lg mx-auto flex items-center justify-between gap-3">
        {/* Brand & AI Avatar */}
        <button
          onClick={onOpenAIChat}
          className="flex items-center gap-2.5 text-left group"
          title="Buka Chat AI Agus Miftah"
        >
          <div className="w-9 h-9 rounded-full bg-linear-to-tr from-rose-500 to-indigo-600 flex items-center justify-center text-white shadow-xs group-hover:scale-105 transition-transform">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-sm font-bold tracking-tight text-slate-900 dark:text-white leading-tight flex items-center gap-1.5">
              Agus Miftah
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" title="AI Aktif" />
            </h1>
            <span className="text-[10px] text-slate-500 dark:text-slate-400">
              AI Pribadi Ramah
            </span>
          </div>
        </button>

        {/* Right Tools: Sync, Sound, Theme */}
        <div className="flex items-center gap-1">
          {/* Sync Button / Indicator */}
          <button
            onClick={onManualSync}
            title={
              syncStatus === 'syncing'
                ? 'Sedang sinkronisasi HP & Laptop...'
                : syncStatus === 'synced'
                ? 'Tersinkron otomatis antara HP & Laptop'
                : 'Offline'
            }
            className="flex items-center gap-1 px-2 py-1 text-[11px] font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
          >
            {syncStatus === 'syncing' ? (
              <RefreshCw className="w-3.5 h-3.5 text-indigo-500 animate-spin" />
            ) : syncStatus === 'synced' ? (
              <Cloud className="w-3.5 h-3.5 text-emerald-500" />
            ) : (
              <CloudOff className="w-3.5 h-3.5 text-slate-400" />
            )}
            <span className="hidden sm:inline text-[10px]">
              {syncStatus === 'syncing' ? 'Sinkron...' : 'Sinkron'}
            </span>
          </button>

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
