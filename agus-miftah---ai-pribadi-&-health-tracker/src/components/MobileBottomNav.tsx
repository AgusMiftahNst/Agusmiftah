import React from 'react';
import { Home, HeartPulse, Wallet, CheckSquare, Bell } from 'lucide-react';
import { JarvisLogo } from './JarvisLogo';
import { AppFeatureTab } from '../types';

export type MainTabType = 'home' | 'activities' | 'ai' | 'health' | 'finance' | 'reminders';

interface MobileBottomNavProps {
  currentTab: MainTabType;
  onSelectTab: (tab: MainTabType) => void;
  pendingActivitiesCount?: number;
  allowedTabs?: AppFeatureTab[];
}

export function MobileBottomNav({
  currentTab,
  onSelectTab,
  pendingActivitiesCount = 0,
  allowedTabs
}: MobileBottomNavProps) {
  const allTabs: {
    id: MainTabType;
    label: string;
    icon?: any;
    isSpecial?: boolean;
    badge?: number;
  }[] = [
    { id: 'home', label: 'Beranda', icon: Home },
    {
      id: 'activities',
      label: 'Aktifitas',
      icon: CheckSquare,
      badge: pendingActivitiesCount > 0 ? pendingActivitiesCount : undefined
    },
    { id: 'ai', label: 'JARVIS', isSpecial: true },
    { id: 'health', label: 'Kesehatan', icon: HeartPulse },
    { id: 'finance', label: 'Keuangan', icon: Wallet },
    { id: 'reminders', label: 'Pengingat', icon: Bell }
  ];

  // Filter tabs based on active profile permissions if specified
  const visibleTabs = allowedTabs && allowedTabs.length > 0
    ? allTabs.filter((t) => allowedTabs.includes(t.id))
    : allTabs.filter((t) => t.id !== 'reminders'); // default view excludes standalone reminders button if 5 tabs already show

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200/80 dark:border-slate-800 transition-colors">
      <div className="max-w-lg mx-auto flex items-center justify-around px-2 py-1.5 h-16">
        {visibleTabs.map((tab) => {
          const isActive = currentTab === tab.id;

          if (tab.isSpecial) {
            return (
              <button
                key={tab.id}
                onClick={() => onSelectTab(tab.id)}
                className="flex flex-col items-center justify-center -mt-4 relative group"
                aria-label="Tanya JARVIS"
              >
                <div
                  className={`rounded-full transition-all ${
                    isActive
                      ? 'scale-110 ring-4 ring-cyan-400/40'
                      : 'hover:scale-105'
                  }`}
                >
                  <JarvisLogo size="lg" variant="hybrid" animated={true} />
                </div>
                <span className="text-[10px] font-bold text-cyan-600 dark:text-cyan-400 mt-1 font-mono tracking-wider">
                  JARVIS
                </span>
              </button>
            );
          }

          const Icon = tab.icon!;

          return (
            <button
              key={tab.id}
              onClick={() => onSelectTab(tab.id)}
              className={`flex-1 flex flex-col items-center justify-center py-1 transition-colors relative ${
                isActive
                  ? 'text-indigo-600 dark:text-indigo-400 font-semibold'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <div className="relative">
                <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5]' : 'stroke-2'}`} />
                {tab.badge !== undefined && tab.badge > 0 && (
                  <span className="absolute -top-1 -right-2 bg-rose-600 text-white text-[9px] font-bold px-1 min-w-[15px] h-[15px] rounded-full flex items-center justify-center shadow-xs">
                    {tab.badge > 9 ? '9+' : tab.badge}
                  </span>
                )}
              </div>
              <span className="text-[10px] mt-0.5">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
