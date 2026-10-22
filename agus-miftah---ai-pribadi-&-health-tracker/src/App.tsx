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
import { SyncModal } from './components/SyncModal';
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
  normalizeAppState,
  getTodayDateString
} from './utils/storage';
import {
  fetchServerStateDetailed,
  fetchServerState,
  pushServerState,
  subscribeToServerState,
  SyncStateStatus,
  decodeSyncHash
} from './utils/sync';
import { generateContextualJarvisReply } from './utils/jarvisBrain';
import { sound } from './utils/audio';
import { sendLocalNotification } from './utils/notifications';

export default function App() {
  const [appState, setAppState] = useState<AppState>(() => loadAppState());
  const [currentTab, setCurrentTab] = useState<MainTabType>('home');
  const [syncStatus, setSyncStatus] = useState<SyncStateStatus>('synced');
  const [isHealthCheckOpen, setIsHealthCheckOpen] = useState(false);
  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);
  const [syncToast, setSyncToast] = useState<string | null>(null);
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

  // Check URL hash on load for instant QR Code / Sync Link pairing from Laptop to HP
  useEffect(() => {
    if (typeof window !== 'undefined' && window.location.hash.includes('sync=')) {
      const decoded = decodeSyncHash(window.location.hash);
      if (decoded) {
        const normalized = normalizeAppState(decoded);
        setAppState(normalized);
        saveAppState(normalized);
        pushServerState(normalized);
        sound.playBreathCue(true);
        setSyncToast('Data dari Laptop berhasil disinkronkan ke HP Anda!');
        window.history.replaceState(null, '', window.location.pathname);
        const timer = setTimeout(() => setSyncToast(null), 5000);
        return () => clearTimeout(timer);
      }
    }
  }, []);

  // Initial and background server sync across HP and laptop
  const performServerSync = useCallback(
    async (isUserInitiated = false, isForcePull = false): Promise<boolean> => {
      try {
        if (isUserInitiated) {
          setSyncStatus('syncing');
        }
        const res = await fetchServerStateDetailed();

        if (res.isHtmlFallback) {
          setSyncStatus('offline');
          return false;
        }

        if (res.empty) {
          // Server has no data file yet: seed server with current state if local has real data
          if ((stateRef.current.serverUpdatedAt || 0) > 0) {
            const pushRes = await pushServerState(stateRef.current);
            if (pushRes.success && pushRes.serverUpdatedAt) {
              setAppState((prev) => {
                const next = { ...prev, serverUpdatedAt: pushRes.serverUpdatedAt!, syncRevision: pushRes.syncRevision };
                saveAppState(next);
                return next;
              });
            }
          }
          setSyncStatus('synced');
          return true;
        }

        if (res.state && (typeof res.state.serverUpdatedAt === 'number' || typeof res.state.syncRevision === 'number')) {
          const localTime = stateRef.current.serverUpdatedAt || 0;
          const localRevision = stateRef.current.syncRevision || 0;
          const serverRevision = res.state.syncRevision || 0;
          const serverTime = res.state.serverUpdatedAt || 0;

          // Check if server has activities or checks that local doesn't have completed
          const serverHasCompletedActs = (res.state.activities || []).some((a) => a.completed);
          const localHasNoCompletedActs = !(stateRef.current.activities || []).some((a) => a.completed);

          const shouldAdoptServer =
            isForcePull ||
            serverRevision > localRevision ||
            serverTime > localTime ||
            (localTime === 0 && localRevision === 0) ||
            (serverHasCompletedActs && localHasNoCompletedActs);

          if (shouldAdoptServer) {
            const normalized = normalizeAppState(res.state);
            setAppState(normalized);
            saveAppState(normalized);
            setSyncStatus('synced');
            return true;
          } else if (localRevision > serverRevision || localTime > serverTime) {
            // Local has newer un-pushed changes, sync up to server
            const pushRes = await pushServerState(stateRef.current);
            setSyncStatus(pushRes.success ? 'synced' : 'offline');
            return pushRes.success;
          }
        }
        setSyncStatus('synced');
        return true;
      } catch {
        setSyncStatus('offline');
        return false;
      }
    },
    []
  );

  // Real-time synchronization via Server-Sent Events (SSE) + fast polling backup
  useEffect(() => {
    // 1. Initial sync on mount
    performServerSync();

    // 2. Real-time stream: immediately receives updates made on Laptop when viewed on HP, and vice versa!
    const unsubscribeSSE = subscribeToServerState(
      (incomingState) => {
        const currentTimestamp = stateRef.current.serverUpdatedAt || 0;
        const currentRevision = stateRef.current.syncRevision || 0;
        const incomingRev = incomingState.syncRevision || 0;
        const incomingTime = incomingState.serverUpdatedAt || 0;

        const serverHasCompletedActs = (incomingState.activities || []).some((a) => a.completed);
        const localHasNoCompletedActs = !(stateRef.current.activities || []).some((a) => a.completed);

        if (
          incomingRev > currentRevision ||
          incomingTime > currentTimestamp ||
          currentTimestamp === 0 ||
          (serverHasCompletedActs && localHasNoCompletedActs)
        ) {
          setAppState(incomingState);
          saveAppState(incomingState);
          setSyncStatus('synced');
        }
      },
      (status) => {
        setSyncStatus(status);
      }
    );

    // 3. Fallback fast poll (every 3 seconds) for mobile network changes
    const interval = window.setInterval(() => {
      performServerSync();
    }, 3000);

    // 4. On tab focus, screen wake-up, or online event, immediately trigger sync
    const onVisibilityOrFocus = () => {
      if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
        performServerSync();
      }
    };

    window.addEventListener('focus', onVisibilityOrFocus);
    window.addEventListener('online', onVisibilityOrFocus);
    document.addEventListener('visibilitychange', onVisibilityOrFocus);

    return () => {
      unsubscribeSSE();
      clearInterval(interval);
      window.removeEventListener('focus', onVisibilityOrFocus);
      window.removeEventListener('online', onVisibilityOrFocus);
      document.removeEventListener('visibilitychange', onVisibilityOrFocus);
    };
  }, [performServerSync]);

  // Force push current state to server
  const handleForcePush = async (): Promise<boolean> => {
    setSyncStatus('syncing');
    const newTimestamp = Date.now();
    const updatedState: AppState = {
      ...stateRef.current,
      serverUpdatedAt: newTimestamp
    };
    const res = await pushServerState(updatedState);
    if (res.success) {
      const next = {
        ...updatedState,
        serverUpdatedAt: res.serverUpdatedAt || newTimestamp,
        syncRevision: res.syncRevision
      };
      setAppState(next);
      saveAppState(next);
      setSyncStatus('synced');
      return true;
    }
    setSyncStatus('offline');
    return false;
  };

  // Import state from backup file
  const handleImportState = (imported: AppState) => {
    const normalized = normalizeAppState(imported);
    setAppState(normalized);
    saveAppState(normalized);
    pushServerState(normalized);
    setSyncToast('Data cadangan berhasil dipulihkan!');
    setTimeout(() => setSyncToast(null), 4000);
  };

  // Push state to server and save to localStorage on every local change
  const updateAndSyncState = (updater: (prev: AppState) => AppState) => {
    setAppState((prev) => {
      const next = updater(prev);
      const newTimestamp = Math.max(Date.now(), (prev.serverUpdatedAt || 0) + 1);
      const withTimestamp: AppState = {
        ...next,
        serverUpdatedAt: newTimestamp
      };
      saveAppState(withTimestamp);
      setSyncStatus('syncing');

      pushServerState(withTimestamp).then((res) => {
        if (res.success) {
          setSyncStatus('synced');
          if (res.serverUpdatedAt || res.syncRevision) {
            setAppState((current) => {
              const updated = {
                ...current,
                serverUpdatedAt: res.serverUpdatedAt || current.serverUpdatedAt,
                syncRevision: res.syncRevision || current.syncRevision
              };
              saveAppState(updated);
              return updated;
            });
          }
        } else {
          setSyncStatus('offline');
        }
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
      const habits = (prev.habits || []).map((h) => {
        if (h.id !== habitId) return h;
        const historyObj = (h.history && typeof h.history === 'object') ? h.history : {};
        const current = historyObj[todayDate] || 0;
        const target = h.targetCount || 1;
        const isDone = current >= target;
        const nextVal = isDone ? 0 : target;
        return {
          ...h,
          history: { ...historyObj, [todayDate]: nextVal },
          currentStreak: !isDone ? (h.currentStreak || 0) + 1 : Math.max(0, (h.currentStreak || 0) - 1)
        };
      });
      return { ...prev, habits };
    });
  };

  const handleIncrementHabit = (habitId: string, delta: number) => {
    updateAndSyncState((prev) => {
      const habits = (prev.habits || []).map((h) => {
        if (h.id !== habitId) return h;
        const historyObj = (h.history && typeof h.history === 'object') ? h.history : {};
        const current = historyObj[todayDate] || 0;
        const nextVal = Math.max(0, current + delta);
        return {
          ...h,
          history: { ...historyObj, [todayDate]: nextVal }
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
      todayHabits: (appState.habits || []).map((h) => ({
        title: h.title,
        progress: `${(h.history && h.history[todayDate]) || 0}/${h.targetCount || 1} ${h.unit || ''}`
      })),
      recentTransactions: appState.transactions.slice(0, 5)
    };

    let replyText: string | null = null;

    try {
      const controller = new AbortController();
      const timeoutTimer = window.setTimeout(() => controller.abort(), 5000);

      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          messages: newMessages.map((m) => ({ role: m.role, text: m.text })),
          userContext
        }),
        signal: controller.signal
      });

      window.clearTimeout(timeoutTimer);

      const contentType = res.headers.get('content-type') || '';
      if (res.ok && contentType.includes('application/json')) {
        const data = await res.json();
        if (data && typeof data.reply === 'string' && data.reply.trim()) {
          replyText = data.reply;
        }
      }
    } catch {
      // Offline, network drop, timeout, or HTML SPA fallback on static host
    }

    // Seamless instant fallback to built-in intelligent JARVIS brain
    if (!replyText || !replyText.trim()) {
      replyText = generateContextualJarvisReply(userText, userContext);
    }

    const modelMsg: ChatMessage = {
      id: `mod-${Date.now()}`,
      role: 'model',
      text: replyText,
      timestamp: Date.now()
    };

    updateAndSyncState((prev) => ({
      ...prev,
      chatMessages: [...prev.chatMessages, modelMsg]
    }));

    if (appState.settings.soundEnabled) {
      sound.playBreathCue(false);
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
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 flex flex-col font-sans transition-colors relative">
      {/* Toast Alert for Sync */}
      {syncToast && (
        <div className="fixed top-14 left-1/2 -translate-x-1/2 z-50 max-w-sm w-[92%] bg-emerald-600 dark:bg-emerald-500 text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-xl flex items-center justify-between border border-emerald-400">
          <span>{syncToast}</span>
          <button onClick={() => setSyncToast(null)} className="ml-2 p-1 hover:bg-emerald-700 rounded-md">
            ✕
          </button>
        </div>
      )}

      {/* Mobile-Friendly Top Bar */}
      <MobileHeader
        syncStatus={syncStatus}
        onOpenSyncModal={() => setIsSyncModalOpen(true)}
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

      {/* Sync HP & Laptop Modal */}
      <SyncModal
        isOpen={isSyncModalOpen}
        onClose={() => setIsSyncModalOpen(false)}
        appState={appState}
        syncStatus={syncStatus}
        onForcePull={() => performServerSync(true, true)}
        onForcePush={handleForcePush}
        onImportState={handleImportState}
      />

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
