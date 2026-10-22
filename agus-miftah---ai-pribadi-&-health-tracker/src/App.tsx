/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { MobileHeader } from './components/MobileHeader';
import { MobileBottomNav, MainTabType } from './components/MobileBottomNav';
import { HomeView } from './components/HomeView';
import { HealthView } from './components/HealthView';
import { SimpleFinanceView } from './components/SimpleFinanceView';
import { RemindersView } from './components/RemindersView';
import { ActivitiesView } from './components/ActivitiesView';
import { AIChatView } from './components/AIChatView';
import { HealthCheckModal } from './components/HealthCheckModal';
import {
  AppState,
  ActivityItem,
  HabitItem,
  ReminderItem,
  HealthCheckRecord,
  TransactionLog,
  ChatMessage
} from './types';
import {
  loadAppState,
  saveAppState,
  getTodayDateString
} from './utils/storage';
import {
  fetchServerState,
  pushServerState,
  SyncStateStatus,
  getLastServerTimestamp
} from './utils/sync';
import { sound } from './utils/audio';
import { sendLocalNotification } from './utils/notifications';

export default function App() {
  const [appState, setAppState] = useState<AppState>(() => loadAppState());
  const [currentTab, setCurrentTab] = useState<MainTabType>('home');
  const [syncStatus, setSyncStatus] = useState<SyncStateStatus>('synced');
  const [isHealthCheckOpen, setIsHealthCheckOpen] = useState(false);
  const [lastNotifiedTime, setLastNotifiedTime] = useState<string>('');

  // Dark mode state
  const [isDark, setIsDark] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('agus_miftah_theme');
      if (saved) return saved === 'dark';
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });

  const todayDate = getTodayDateString(0);
  const stateRef = useRef(appState);
  stateRef.current = appState;

  // Sync theme class
  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('agus_miftah_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('agus_miftah_theme', 'light');
    }
  }, [isDark]);

  const handleToggleDark = () => {
    setIsDark((prev) => !prev);
  };

  // Initial and background server sync across HP and laptop
  const performServerSync = useCallback(async () => {
    try {
      const serverData = await fetchServerState();
      if (serverData && serverData.serverUpdatedAt) {
        const localTime = stateRef.current.serverUpdatedAt || 0;
        // If server data is newer than local, adopt it
        if (serverData.serverUpdatedAt > localTime) {
          setAppState(serverData);
          saveAppState(serverData);
          setSyncStatus('synced');
          return;
        }
      }
      setSyncStatus('synced');
    } catch {
      setSyncStatus('offline');
    }
  }, []);

  // Poll server for changes every 4 seconds + on window focus/visibilitychange
  useEffect(() => {
    performServerSync();

    const interval = window.setInterval(performServerSync, 4000);
    const onFocus = () => performServerSync();
    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onFocus);

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onFocus);
    };
  }, [performServerSync]);

  // Push state to server and save to localStorage on every local change
  const updateAndSyncState = (updater: (prev: AppState) => AppState) => {
    setAppState((prev) => {
      const next = updater(prev);
      const withTimestamp = {
        ...next,
        serverUpdatedAt: Date.now()
      };
      saveAppState(withTimestamp);
      setSyncStatus('syncing');
      pushServerState(withTimestamp).then((ok) => {
        setSyncStatus(ok ? 'synced' : 'offline');
      });
      return withTimestamp;
    });
  };

  // Background reminder scheduler
  useEffect(() => {
    const checkReminders = () => {
      const now = new Date();
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      const timeStr = `${hours}:${minutes}`;
      const dayIndex = now.getDay();

      if (timeStr === lastNotifiedTime) return;

      const matched = appState.reminders.find(
        (r) => r.enabled && r.time === timeStr && r.days.includes(dayIndex)
      );

      if (matched) {
        setLastNotifiedTime(timeStr);
        if (appState.settings.soundEnabled) {
          sound.playReminderAlert();
        }
        sendLocalNotification(`Agus Miftah: ${matched.title}`, {
          body: matched.note || 'Waktunya menjaga kesehatanmu hari ini!'
        });
      }
    };

    const interval = window.setInterval(checkReminders, 25000);
    return () => clearInterval(interval);
  }, [appState.reminders, appState.settings.soundEnabled, lastNotifiedTime]);

  // Activity mutations
  const handleToggleActivity = (id: string) => {
    updateAndSyncState((prev) => {
      const activities = (prev.activities || []).map((a) => {
        if (a.id !== id) return a;
        const nextCompleted = !a.completed;
        return {
          ...a,
          completed: nextCompleted,
          completedAt: nextCompleted ? Date.now() : undefined
        };
      });
      return { ...prev, activities };
    });
  };

  const handleAddActivity = (newAct: Omit<ActivityItem, 'id' | 'createdAt'>) => {
    const item: ActivityItem = {
      ...newAct,
      id: `act-${Date.now()}`,
      createdAt: Date.now()
    };
    updateAndSyncState((prev) => ({
      ...prev,
      activities: [item, ...(prev.activities || [])]
    }));
  };

  const handleDeleteActivity = (id: string) => {
    updateAndSyncState((prev) => ({
      ...prev,
      activities: (prev.activities || []).filter((a) => a.id !== id)
    }));
  };

  // Habit mutations
  const handleToggleHabit = (habitId: string) => {
    updateAndSyncState((prev) => {
      const habits = prev.habits.map((h) => {
        if (h.id !== habitId) return h;
        const current = h.history[todayDate] || 0;
        const isDone = current >= h.targetCount;
        const nextVal = isDone ? 0 : h.targetCount;
        return {
          ...h,
          history: { ...h.history, [todayDate]: nextVal },
          currentStreak: !isDone ? h.currentStreak + 1 : Math.max(0, h.currentStreak - 1)
        };
      });
      return { ...prev, habits };
    });
  };

  const handleIncrementHabit = (habitId: string, delta: number) => {
    updateAndSyncState((prev) => {
      const habits = prev.habits.map((h) => {
        if (h.id !== habitId) return h;
        const current = h.history[todayDate] || 0;
        const nextVal = Math.max(0, current + delta);
        return {
          ...h,
          history: { ...h.history, [todayDate]: nextVal }
        };
      });
      return { ...prev, habits };
    });
  };

  // Health Check mutations
  const handleSaveHealthCheck = (record: Omit<HealthCheckRecord, 'id'>) => {
    const newRecord: HealthCheckRecord = {
      ...record,
      id: `hc-${Date.now()}`
    };
    updateAndSyncState((prev) => ({
      ...prev,
      healthChecks: [newRecord, ...(prev.healthChecks || [])]
    }));
  };

  const handleDeleteHealthCheck = (id: string) => {
    updateAndSyncState((prev) => ({
      ...prev,
      healthChecks: (prev.healthChecks || []).filter((h) => h.id !== id)
    }));
  };

  // Transaction mutations
  const handleAddTransaction = (tx: Omit<TransactionLog, 'id'>) => {
    const newTx: TransactionLog = {
      ...tx,
      id: `tx-${Date.now()}`
    };
    updateAndSyncState((prev) => ({
      ...prev,
      transactions: [newTx, ...prev.transactions]
    }));
  };

  const handleDeleteTransaction = (id: string) => {
    updateAndSyncState((prev) => ({
      ...prev,
      transactions: prev.transactions.filter((t) => t.id !== id)
    }));
  };

  // Reminder mutations
  const handleAddReminder = (reminder: Omit<ReminderItem, 'id'>) => {
    const newRem: ReminderItem = {
      ...reminder,
      id: `rem-${Date.now()}`
    };
    updateAndSyncState((prev) => ({
      ...prev,
      reminders: [...prev.reminders, newRem]
    }));
  };

  const handleToggleReminder = (id: string) => {
    updateAndSyncState((prev) => ({
      ...prev,
      reminders: prev.reminders.map((r) =>
        r.id === id ? { ...r, enabled: !r.enabled } : r
      )
    }));
  };

  const handleDeleteReminder = (id: string) => {
    updateAndSyncState((prev) => ({
      ...prev,
      reminders: prev.reminders.filter((r) => r.id !== id)
    }));
  };

  // AI Chat handler
  const handleSendMessage = async (userText: string) => {
    const userMsg: ChatMessage = {
      id: `usr-${Date.now()}`,
      role: 'user',
      text: userText,
      timestamp: Date.now()
    };

    const newMessages = [...appState.chatMessages, userMsg];

    // Optimistically update chat
    updateAndSyncState((prev) => ({
      ...prev,
      chatMessages: newMessages
    }));

    try {
      const userContext = {
        userName: appState.settings.userName,
        pendingActivities: (appState.activities || [])
          .filter((a) => !a.completed)
          .map((a) => ({
            title: a.title,
            deadline: `${a.dueDate}${a.dueTime ? ' ' + a.dueTime : ''}`,
            category: a.category,
            priority: a.priority
          })),
        latestHealthCheck: appState.healthChecks[0],
        todayHabits: appState.habits.map((h) => ({
          title: h.title,
          progress: `${h.history[todayDate] || 0}/${h.targetCount} ${h.unit}`
        })),
        recentTransactions: appState.transactions.slice(0, 5)
      };

      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newMessages.map((m) => ({ role: m.role, text: m.text })),
          userContext
        })
      });

      if (res.ok) {
        const data = await res.json();
        const modelMsg: ChatMessage = {
          id: `mod-${Date.now()}`,
          role: 'model',
          text: data.reply,
          timestamp: Date.now()
        };
        updateAndSyncState((prev) => ({
          ...prev,
          chatMessages: [...prev.chatMessages, modelMsg]
        }));
        if (appState.settings.soundEnabled) {
          sound.playBreathCue(false);
        }
      } else {
        throw new Error(`API error: ${res.status}`);
      }
    } catch (err) {
      console.error('Failed to get AI reply:', err);
      const errorMsg: ChatMessage = {
        id: `mod-${Date.now()}`,
        role: 'model',
        text: 'Maaf, terjadi gangguan jaringan saat menghubungi AI Agus Miftah. Coba lagi sebentar ya!',
        timestamp: Date.now()
      };
      updateAndSyncState((prev) => ({
        ...prev,
        chatMessages: [...prev.chatMessages, errorMsg]
      }));
    }
  };

  // Toggle sound
  const handleToggleSound = () => {
    updateAndSyncState((prev) => ({
      ...prev,
      settings: {
        ...prev.settings,
        soundEnabled: !prev.settings.soundEnabled
      }
    }));
  };

  const pendingActivitiesCount = (appState.activities || []).filter((a) => !a.completed).length;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 flex flex-col font-sans transition-colors">
      {/* Mobile-Friendly Top Bar */}
      <MobileHeader
        syncStatus={syncStatus}
        onManualSync={performServerSync}
        isDark={isDark}
        onToggleDark={handleToggleDark}
        soundEnabled={appState.settings.soundEnabled}
        onToggleSound={handleToggleSound}
        onOpenAIChat={() => setCurrentTab('ai')}
      />

      {/* Main Container - Optimized for mobile view */}
      <main className="flex-1 max-w-lg w-full mx-auto px-3.5 pt-3 pb-20">
        {currentTab === 'home' && (
          <HomeView
            todayDate={todayDate}
            activities={appState.activities || []}
            habits={appState.habits}
            healthChecks={appState.healthChecks}
            transactions={appState.transactions}
            reminders={appState.reminders}
            onToggleActivity={handleToggleActivity}
            onToggleHabit={handleToggleHabit}
            onIncrementHabit={handleIncrementHabit}
            onOpenHealthModal={() => setIsHealthCheckOpen(true)}
            onOpenTransactionModal={() => setCurrentTab('finance')}
            onNavigateTab={(tab) => setCurrentTab(tab)}
            soundEnabled={appState.settings.soundEnabled}
          />
        )}

        {currentTab === 'activities' && (
          <ActivitiesView
            activities={appState.activities || []}
            onToggleActivity={handleToggleActivity}
            onAddActivity={handleAddActivity}
            onDeleteActivity={handleDeleteActivity}
            onNavigateToReminders={() => setCurrentTab('reminders')}
            soundEnabled={appState.settings.soundEnabled}
          />
        )}

        {currentTab === 'health' && (
          <HealthView
            todayDate={todayDate}
            habits={appState.habits}
            healthChecks={appState.healthChecks}
            onToggleHabit={handleToggleHabit}
            onIncrementHabit={handleIncrementHabit}
            onOpenHealthCheckModal={() => setIsHealthCheckOpen(true)}
            onDeleteHealthCheck={handleDeleteHealthCheck}
            onOpenAIChat={() => setCurrentTab('ai')}
            soundEnabled={appState.settings.soundEnabled}
          />
        )}

        {currentTab === 'finance' && (
          <SimpleFinanceView
            transactions={appState.transactions}
            todayDate={todayDate}
            onAddTransaction={handleAddTransaction}
            onDeleteTransaction={handleDeleteTransaction}
            soundEnabled={appState.settings.soundEnabled}
          />
        )}

        {currentTab === 'reminders' && (
          <RemindersView
            reminders={appState.reminders}
            onAddReminder={handleAddReminder}
            onToggleReminder={handleToggleReminder}
            onDeleteReminder={handleDeleteReminder}
            soundEnabled={appState.settings.soundEnabled}
          />
        )}

        {currentTab === 'ai' && (
          <AIChatView
            messages={appState.chatMessages}
            onSendMessage={handleSendMessage}
            latestHealthCheck={appState.healthChecks[0]}
            habits={appState.habits}
            transactions={appState.transactions}
            activities={appState.activities || []}
            todayDate={todayDate}
          />
        )}
      </main>

      {/* Health Check Input Modal */}
      <HealthCheckModal
        isOpen={isHealthCheckOpen}
        onClose={() => setIsHealthCheckOpen(false)}
        onSave={handleSaveHealthCheck}
      />

      {/* Mobile-First Bottom Navigation */}
      <MobileBottomNav
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        pendingActivitiesCount={pendingActivitiesCount}
      />
    </div>
  );
}
