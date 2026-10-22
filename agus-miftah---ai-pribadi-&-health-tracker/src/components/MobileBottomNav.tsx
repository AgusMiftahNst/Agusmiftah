import React from 'react';
import { Home, HeartPulse, Wallet, Bot, CheckSquare } from 'lucide-react';

export type MainTabType = 'home' | 'activities' | 'ai' | 'health' | 'finance' | 'reminders';

interface MobileBottomNavProps {
  currentTab: MainTabType;
  onSelectTab: (tab: MainTabType) => void;
  pendingActivitiesCount?: number;
}

export function MobileBottomNav({
  currentTab,
  onSelectTab,
  pendingActivitiesCount = 0
}: MobileBottomNavProps) {
  const tabs = [
    { id: 'home' as const, label: 'Beranda', icon: Home },
    {
      id: 'activities' as const,
      label: 'Aktifitas',
      icon: CheckSquare,
      badge: pendingActivitiesCount > 0 ? pendingActivitiesCount : undefined
    },
    { id: 'ai' as const, label: 'AI Agus', icon: Bot, isSpecial: true },
    { id: 'health' as const, label: 'Kesehatan', icon: HeartPulse },
    { id: 'finance' as const, label: 'Keuangan', icon: Wallet }
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200/80 dark:border-slate-800 transition-colors">
      <div className="max-w-lg mx-auto flex items-center justify-around px-2 py-1.5 h-16">
        {tabs.map((tab) => {
          const isActive = currentTab === tab.id;
          const Icon = tab.icon;

          if (tab.isSpecial) {
            return (
              <button
                key={tab.id}
                onClick={() => onSelectTab(tab.id)}
                className="flex flex-col items-center justify-center -mt-4 relative group"
                aria-label="Tanya AI Agus"
              >
                <div
                  className={`w-12 h-12 rounded-full flex items-center justify-center shadow-md transition-all ${
                    isActive
                      ? 'bg-linear-to-tr from-rose-500 to-indigo-600 text-white scale-105 ring-3 ring-rose-200 dark:ring-rose-950'
                      : 'bg-linear-to-tr from-rose-500 to-indigo-600 text-white hover:scale-105'
                  }`}
                >
                  <Icon className="w-6 h-6" />
                </div>
                <span className="text-[10px] font-semibold text-rose-600 dark:text-rose-400 mt-1">
                  AI Agus
                </span>
              </button>
            );
          }

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
