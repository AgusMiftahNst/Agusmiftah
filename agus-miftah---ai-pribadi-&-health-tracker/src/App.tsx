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
import { ConfirmDeleteModal } from './components/ConfirmDeleteModal';
import { ConfirmCompleteModal } from './components/ConfirmCompleteModal';
import { RevertActivityModal } from './components/RevertActivityModal';
import { LockScreen } from './components/LockScreen';
import { PasscodeManagerModal } from './components/PasscodeManagerModal';
import {
  AppState,
  ActivityItem,
  HabitItem,
  ReminderItem,
  HealthCheckRecord,
  TransactionLog,
  FinancialGoal,
  ChatMessage,
  AccessProfile,
  AppFeatureTab
} from './types';
import {
  loadAppState,
  saveAppState,
  normalizeAppState,
  getTodayDateString,
  formatDateIndonesian,
  formatRupiah,
  DEFAULT_ACCESS_PROFILES
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
import { sendLocalNotification, requestNotificationPermission, vibrateMobile } from './utils/notifications';

interface DeleteConfirmTarget {
  type: 'activity' | 'healthCheck' | 'transaction' | 'reminder';
  id: string;
  title: string;
  itemName: string;
  itemDetails?: string;
  categoryLabel?: string;
}

export default function App() {
  const [appState, setAppState] = useState<AppState>(() => loadAppState());
  const [currentTab, setCurrentTab] = useState<MainTabType>('home');
  const [syncStatus, setSyncStatus] = useState<SyncStateStatus>('synced');
  const [isHealthCheckOpen, setIsHealthCheckOpen] = useState(false);
  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);
  const [isPasscodeManagerOpen, setIsPasscodeManagerOpen] = useState(false);
  const [isLocked, setIsLocked] = useState<boolean>(() => Boolean(loadAppState()?.settings?.isPinRequired));
  const [activeProfile, setActiveProfile] = useState<AccessProfile | null>(() => {
    const initial = loadAppState();
    const profiles = initial.settings?.accessProfiles || [];
    return profiles.find((p) => p.isMaster) || profiles[0] || DEFAULT_ACCESS_PROFILES[0];
  });
  const [deleteConfirmTarget, setDeleteConfirmTarget] = useState<DeleteConfirmTarget | null>(null);
  const [completeConfirmActivity, setCompleteConfirmActivity] = useState<ActivityItem | null>(null);
  const [revertConfirmActivity, setRevertConfirmActivity] = useState<ActivityItem | null>(null);
  const [syncToast, setSyncToast] = useState<string | null>(null);
  const [lastNotifiedTime, setLastNotifiedTime] = useState<string>('');
  const notifiedDeadlinesRef = useRef<Set<string>>(new Set());

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

        if (res.state) {
          const normalized = normalizeAppState(res.state);
          const localTime = stateRef.current.serverUpdatedAt || 0;
          const serverTime = normalized.serverUpdatedAt || 0;
          const localRevision = stateRef.current.syncRevision || 0;
          const serverRevision = normalized.syncRevision || 0;

          const serverHasCompletedActs = (normalized.activities || []).some((a) => a.completed);
          const localHasNoCompletedActs = !(stateRef.current.activities || []).some((a) => a.completed);

          const shouldAdoptServer =
            isForcePull ||
            serverRevision !== localRevision ||
            serverTime !== localTime ||
            localTime === 0 ||
            (serverHasCompletedActs && localHasNoCompletedActs);

          if (shouldAdoptServer) {
            setAppState(normalized);
            saveAppState(normalized);
          }
          setSyncStatus('synced');
          return true;
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

  // Real-time synchronization via Cloud Firestore onSnapshot
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

        if (
          incomingRev !== currentRevision ||
          incomingTime !== currentTimestamp ||
          currentTimestamp === 0
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

    // 3. Fallback poll (every 20 seconds) for mobile network changes
    const interval = window.setInterval(() => {
      performServerSync();
    }, 20000);

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
    const checkAlarmsAndDeadlines = () => {
      const now = new Date();
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      const timeStr = `${hours}:${minutes}`;
      const dayIndex = now.getDay();
      const currentMinutes = now.getHours() * 60 + now.getMinutes();

      // 1. Routine Reminders Check
      if (timeStr !== lastNotifiedTime) {
        const matched = appState.reminders.find(
          (r) => r.enabled && r.time === timeStr && r.days.includes(dayIndex)
        );

        if (matched) {
          setLastNotifiedTime(timeStr);
          if (appState.settings.soundEnabled) {
            sound.playReminderAlert();
          }
          vibrateMobile([250, 100, 250]);
          sendLocalNotification(`Agus Miftah: ${matched.title}`, {
            body: matched.note || 'Waktunya menjaga kesehatanmu hari ini!',
            vibrate: true
          });
          setSyncToast(`⏰ Pengingat: ${matched.title}`);
          setTimeout(() => setSyncToast(null), 5000);
        }
      }

      // 2. Activity Deadlines Check (1 hour / 60 minutes prior to deadline on HP & Laptop)
      const notifyWindowMinutes = (appState.settings.notifyHoursBefore || 1) * 60;
      (appState.activities || []).forEach((act) => {
        if (
          !act.completed &&
          (!act.activityType || act.activityType === 'deadline') &&
          act.dueDate === todayDate &&
          act.dueTime
        ) {
          const [dh, dm] = act.dueTime.split(':').map(Number);
          if (!isNaN(dh) && !isNaN(dm)) {
            const dueMins = dh * 60 + dm;
            const diffMins = dueMins - currentMinutes;
            const notificationKey = `${act.id}-${todayDate}-${act.dueTime}`;

            // Notify if within 60 minutes (e.g. 1 hour before) and not yet notified
            if (diffMins >= 0 && diffMins <= notifyWindowMinutes && !notifiedDeadlinesRef.current.has(notificationKey)) {
              notifiedDeadlinesRef.current.add(notificationKey);
              if (appState.settings.soundEnabled) {
                sound.playReminderAlert();
              }
              vibrateMobile([300, 150, 300]);
              const timeNotice = diffMins === 0 ? 'sekarang juga' : `${diffMins} menit lagi (pukul ${act.dueTime})`;
              sendLocalNotification(`🔔 Deadline Kegiatan: ${act.title}`, {
                body: `Tenggat waktu ${timeNotice}. Segera tuntaskan tugas ini!`,
                vibrate: true
              });
              setSyncToast(`🔔 Pengingat Deadline: ${act.title} (${timeNotice})`);
              setTimeout(() => setSyncToast(null), 7000);
            }
          }
        }
      });
    };

    const interval = window.setInterval(checkAlarmsAndDeadlines, 20000);
    return () => clearInterval(interval);
  }, [appState.reminders, appState.activities, appState.settings.soundEnabled, appState.settings.notifyHoursBefore, lastNotifiedTime, todayDate]);

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

  const handleUpdateActivity = (updatedAct: ActivityItem) => {
    updateAndSyncState((prev) => ({
      ...prev,
      activities: (prev.activities || []).map((a) => (a.id === updatedAct.id ? updatedAct : a))
    }));
  };

  const handleToggleRoutine = (id: string) => {
    const currentMonth = todayDate.slice(0, 7);
    updateAndSyncState((prev) => {
      const activities = (prev.activities || []).map((a) => {
        if (a.id !== id) return a;
        const comps = a.routineCompletions || {};
        const key = a.activityType === 'rutin_bulanan' ? currentMonth : todayDate;
        const isDone = Boolean(comps[key]);
        return {
          ...a,
          routineCompletions: {
            ...comps,
            [key]: !isDone
          }
        };
      });
      return { ...prev, activities };
    });
    if (appState.settings.soundEnabled) {
      sound.playSuccess();
    }
  };

  const requestToggleActivity = (id: string) => {
    const act = (appState.activities || []).find((a) => a.id === id);
    if (!act) return;

    if (act.activityType === 'rutin_harian' || act.activityType === 'rutin_bulanan') {
      handleToggleRoutine(id);
      return;
    }

    if (!act.completed) {
      // Prompt user confirmation before marking completed
      setCompleteConfirmActivity(act);
    } else {
      // Prompt user confirmation with reason before reverting back to incomplete
      setRevertConfirmActivity(act);
    }
  };

  const handleConfirmComplete = () => {
    if (!completeConfirmActivity) return;
    handleToggleActivity(completeConfirmActivity.id);
    if (appState.settings.soundEnabled) {
      sound.playSuccess();
    }
    setCompleteConfirmActivity(null);
  };

  const handleConfirmRevert = (activityId: string, reason: string) => {
    updateAndSyncState((prev) => {
      const activities = (prev.activities || []).map((a) => {
        if (a.id !== activityId) return a;
        let updatedNotes = a.notes || '';
        if (reason.trim()) {
          const now = new Date();
          const timeStr = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
          const dateStr = now.toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit' });
          const reasonEntry = `\n[Batal Selesai ${dateStr} ${timeStr}]: ${reason.trim()}`;
          updatedNotes = updatedNotes ? `${updatedNotes}${reasonEntry}` : reasonEntry.trim();
        }
        return {
          ...a,
          completed: false,
          completedAt: undefined,
          notes: updatedNotes
        };
      });
      return { ...prev, activities };
    });

    if (appState.settings.soundEnabled) {
      sound.playBreathCue(false);
    }
    setRevertConfirmActivity(null);
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

  // Financial Target mutations
  const handleAddFinancialTarget = (newTarget: Omit<FinancialGoal, 'id' | 'createdAt'>) => {
    const target: FinancialGoal = {
      ...newTarget,
      id: `goal-${Date.now()}`,
      createdAt: Date.now()
    };
    updateAndSyncState((prev) => ({
      ...prev,
      financialTargets: [target, ...(prev.financialTargets || [])]
    }));
  };

  const handleUpdateFinancialTarget = (updated: FinancialGoal) => {
    updateAndSyncState((prev) => ({
      ...prev,
      financialTargets: (prev.financialTargets || []).map((g) => (g.id === updated.id ? updated : g))
    }));
  };

  const handleDeleteFinancialTarget = (id: string) => {
    updateAndSyncState((prev) => ({
      ...prev,
      financialTargets: (prev.financialTargets || []).filter((g) => g.id !== id)
    }));
  };

  // Multi-Passcode Security & Profile Access Control
  const handleSaveAccessProfiles = (newProfiles: AccessProfile[], isRequired: boolean) => {
    const master = newProfiles.find((p) => p.isMaster) || newProfiles[0];
    updateAndSyncState((prev) => ({
      ...prev,
      settings: {
        ...prev.settings,
        isPinRequired: isRequired,
        appPin: master.code,
        accessProfiles: newProfiles
      }
    }));

    // Update active profile
    const currentId = activeProfile?.id;
    const updatedActive = newProfiles.find((p) => p.id === currentId) || master;
    setActiveProfile(updatedActive);

    // Redirect to allowed tab if currently on disallowed tab
    if (updatedActive.allowedTabs && !updatedActive.allowedTabs.includes(currentTab as any)) {
      setCurrentTab(updatedActive.allowedTabs[0] || 'home');
    }

    setSyncToast(
      isRequired
        ? `Kunci Password Aktif (${newProfiles.length} profil terkonfigurasi)`
        : 'Kunci Masuk Aplikasi dinonaktifkan.'
    );
    setTimeout(() => setSyncToast(null), 4000);
  };

  const handleResetSecurityToDefault = () => {
    updateAndSyncState((prev) => ({
      ...prev,
      settings: {
        ...prev.settings,
        appPin: 'agus123',
        isPinRequired: true,
        accessProfiles: DEFAULT_ACCESS_PROFILES
      }
    }));
    setActiveProfile(DEFAULT_ACCESS_PROFILES[0]);
    setIsLocked(false);
    setSyncToast('Password Master di-reset ke: agus123 (Akses Penuh)');
    setTimeout(() => setSyncToast(null), 4000);
  };

  const handleUnlock = (profile: AccessProfile) => {
    setActiveProfile(profile);
    setIsLocked(false);
    if (profile.allowedTabs && !profile.allowedTabs.includes(currentTab as any)) {
      setCurrentTab(profile.allowedTabs[0] || 'home');
    }
  };

  const handleSelectTab = (tab: MainTabType) => {
    if (activeProfile && activeProfile.allowedTabs && !activeProfile.allowedTabs.includes(tab as any)) {
      sound.playBreathCue(true);
      setSyncToast(`Menu ini tidak diizinkan untuk profil "${activeProfile.name}".`);
      setTimeout(() => setSyncToast(null), 3000);
      return;
    }
    setCurrentTab(tab);
  };

  const handleChangeDisplayMode = (mode: 'auto' | 'mobile' | 'laptop') => {
    updateAndSyncState((prev) => ({
      ...prev,
      settings: {
        ...prev.settings,
        displayMode: mode
      }
    }));
    if (appState.settings.soundEnabled) {
      sound.playSuccess();
    }
    const modeLabel = mode === 'laptop' ? 'Mode Laptop (Layar Lebar)' : mode === 'mobile' ? 'Mode HP (Compact)' : 'Mode Otomatis';
    setSyncToast(`Tampilan diubah ke ${modeLabel}`);
    setTimeout(() => setSyncToast(null), 3000);
  };

  const handleRequestNotifications = async () => {
    const granted = await requestNotificationPermission();
    if (granted) {
      updateAndSyncState((prev) => ({
        ...prev,
        settings: {
          ...prev.settings,
          notificationsEnabled: true
        }
      }));
      sendLocalNotification('JARVIS Aktif', {
        body: 'Notifikasi deadline dan pengingat siap dikirim ke HP Anda!'
      });
      vibrateMobile([200, 100, 200]);
      setSyncToast('Notifikasi di HP berhasil diaktifkan! 🔔');
    } else {
      setSyncToast('Izin notifikasi belum diaktifkan pada browser/HP.');
    }
    setTimeout(() => setSyncToast(null), 4000);
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

  // Safe Deletion Handlers with Confirmation Modal
  const requestDeleteActivity = (id: string) => {
    const act = (appState.activities || []).find((a) => a.id === id);
    setDeleteConfirmTarget({
      type: 'activity',
      id,
      title: 'Hapus Kegiatan?',
      itemName: act ? act.title : 'Kegiatan ini',
      itemDetails: act?.dueDate
        ? `Tenggat: ${formatDateIndonesian(act.dueDate)}${act.dueTime ? ` · ${act.dueTime}` : ''}`
        : undefined,
      categoryLabel: act?.category ? `Kategori: ${act.category}` : undefined
    });
  };

  const requestDeleteHealthCheck = (id: string) => {
    const hc = (appState.healthChecks || []).find((h) => h.id === id);
    setDeleteConfirmTarget({
      type: 'healthCheck',
      id,
      title: 'Hapus Catatan Skrining Kesehatan?',
      itemName: hc ? `Pemeriksaan ${formatDateIndonesian(hc.date)}` : 'Catatan pemeriksaan',
      itemDetails: hc
        ? `Tensi ${hc.systolic}/${hc.diastolic} mmHg · Asam Urat ${hc.uricAcid ?? '-'} · Gula ${hc.bloodSugar ?? '-'}`
        : undefined,
      categoryLabel: 'Catatan Kesehatan'
    });
  };

  const requestDeleteTransaction = (id: string) => {
    const tx = (appState.transactions || []).find((t) => t.id === id);
    setDeleteConfirmTarget({
      type: 'transaction',
      id,
      title: 'Hapus Catatan Transaksi?',
      itemName: tx ? tx.title : 'Catatan transaksi',
      itemDetails: tx
        ? `${tx.type === 'pemasukan' ? 'Pemasukan (+)' : 'Pengeluaran (-)'} ${formatRupiah(tx.amount)} · ${formatDateIndonesian(tx.date)}`
        : undefined,
      categoryLabel: tx?.category ? `Kategori: ${tx.category}` : undefined
    });
  };

  const requestDeleteReminder = (id: string) => {
    const rem = (appState.reminders || []).find((r) => r.id === id);
    setDeleteConfirmTarget({
      type: 'reminder',
      id,
      title: 'Hapus Pengingat Rutin?',
      itemName: rem ? rem.title : 'Pengingat rutin',
      itemDetails: rem ? `Pukul ${rem.time} WIB ${rem.note ? `· ${rem.note}` : ''}` : undefined,
      categoryLabel: 'Pengingat Rutin'
    });
  };

  const handleConfirmDelete = () => {
    if (!deleteConfirmTarget) return;
    const { type, id } = deleteConfirmTarget;
    if (type === 'activity') {
      handleDeleteActivity(id);
    } else if (type === 'healthCheck') {
      handleDeleteHealthCheck(id);
    } else if (type === 'transaction') {
      handleDeleteTransaction(id);
    } else if (type === 'reminder') {
      handleDeleteReminder(id);
    }
    setDeleteConfirmTarget(null);
    if (appState.settings.soundEnabled) {
      sound.playBreathCue(true);
    }
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
        onOpenAIChat={() => handleSelectTab('ai')}
        displayMode={appState.settings.displayMode || 'auto'}
        onChangeDisplayMode={handleChangeDisplayMode}
        onLockApp={() => setIsLocked(true)}
        onOpenPasscodeManager={() => setIsPasscodeManagerOpen(true)}
        onRequestNotifications={handleRequestNotifications}
        notificationsEnabled={Boolean(appState.settings.notificationsEnabled)}
        activeProfile={activeProfile}
      />

      {/* Main Container - Optimized for Mobile & Laptop Wide Views */}
      <main className={`flex-1 w-full mx-auto px-3.5 sm:px-6 pt-3 pb-20 transition-all ${
        (appState.settings.displayMode || 'auto') === 'laptop'
          ? 'max-w-6xl'
          : (appState.settings.displayMode || 'auto') === 'mobile'
          ? 'max-w-lg'
          : 'max-w-lg lg:max-w-6xl'
      }`}>
        {currentTab === 'home' && (
          <HomeView
            todayDate={todayDate}
            activities={appState.activities || []}
            habits={appState.habits}
            healthChecks={appState.healthChecks}
            transactions={appState.transactions}
            financialTargets={appState.financialTargets || []}
            reminders={appState.reminders}
            onToggleActivity={requestToggleActivity}
            onToggleRoutine={handleToggleRoutine}
            onToggleHabit={handleToggleHabit}
            onIncrementHabit={handleIncrementHabit}
            onOpenHealthModal={() => setIsHealthCheckOpen(true)}
            onOpenTransactionModal={() => handleSelectTab('finance')}
            onNavigateTab={(tab) => handleSelectTab(tab)}
            soundEnabled={appState.settings.soundEnabled}
            displayMode={appState.settings.displayMode || 'auto'}
            allowedTabs={activeProfile?.allowedTabs}
          />
        )}

        {currentTab === 'activities' && (
          <ActivitiesView
            activities={appState.activities || []}
            todayDate={todayDate}
            onToggleActivity={requestToggleActivity}
            onToggleRoutine={handleToggleRoutine}
            onAddActivity={handleAddActivity}
            onUpdateActivity={handleUpdateActivity}
            onDeleteActivity={requestDeleteActivity}
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
            onDeleteHealthCheck={requestDeleteHealthCheck}
            onOpenAIChat={() => setCurrentTab('ai')}
            soundEnabled={appState.settings.soundEnabled}
          />
        )}

        {currentTab === 'finance' && (
          <SimpleFinanceView
            transactions={appState.transactions}
            financialTargets={appState.financialTargets || []}
            todayDate={todayDate}
            onAddTransaction={handleAddTransaction}
            onDeleteTransaction={requestDeleteTransaction}
            onAddFinancialTarget={handleAddFinancialTarget}
            onUpdateFinancialTarget={handleUpdateFinancialTarget}
            onDeleteFinancialTarget={handleDeleteFinancialTarget}
            soundEnabled={appState.settings.soundEnabled}
          />
        )}

        {currentTab === 'reminders' && (
          <RemindersView
            reminders={appState.reminders}
            onAddReminder={handleAddReminder}
            onToggleReminder={handleToggleReminder}
            onDeleteReminder={requestDeleteReminder}
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

      {/* Confirmation Modal when marking activity as completed */}
      <ConfirmCompleteModal
        isOpen={!!completeConfirmActivity}
        activity={completeConfirmActivity}
        onConfirm={handleConfirmComplete}
        onCancel={() => setCompleteConfirmActivity(null)}
      />

      {/* Revert Activity Confirmation Modal with reason prompt */}
      <RevertActivityModal
        isOpen={!!revertConfirmActivity}
        activity={revertConfirmActivity}
        onConfirm={handleConfirmRevert}
        onCancel={() => setRevertConfirmActivity(null)}
      />

      {/* Universal Delete Confirmation Modal */}
      <ConfirmDeleteModal
        isOpen={!!deleteConfirmTarget}
        title={deleteConfirmTarget?.title || 'Konfirmasi Hapus'}
        itemName={deleteConfirmTarget?.itemName || ''}
        itemDetails={deleteConfirmTarget?.itemDetails}
        categoryLabel={deleteConfirmTarget?.categoryLabel}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteConfirmTarget(null)}
      />

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

      {/* Security & Multi-Passcode Profile Access Control Modal */}
      <PasscodeManagerModal
        isOpen={isPasscodeManagerOpen}
        accessProfiles={appState.settings.accessProfiles || []}
        isPinRequired={Boolean(appState.settings.isPinRequired)}
        onSave={handleSaveAccessProfiles}
        onClose={() => setIsPasscodeManagerOpen(false)}
      />

      {/* Security Passcode Gate Screen */}
      <LockScreen
        isLocked={isLocked}
        accessProfiles={appState.settings.accessProfiles || []}
        savedPin={appState.settings.appPin || 'agus123'}
        onUnlock={handleUnlock}
        onResetToDefault={handleResetSecurityToDefault}
      />

      {/* Mobile-First Bottom Navigation with role-based tab filtering */}
      <MobileBottomNav
        currentTab={currentTab}
        onSelectTab={handleSelectTab}
        pendingActivitiesCount={pendingActivitiesCount}
        allowedTabs={activeProfile?.allowedTabs}
      />
    </div>
  );
}
