import {
  AppState,
  ActivityItem,
  HabitItem,
  ReminderItem,
  HealthCheckRecord,
  TransactionLog,
  ChatMessage,
  UserSettings
} from '../types';

const STORAGE_KEY = 'agus_miftah_app_state_v3';
const LEGACY_STORAGE_KEY = 'agus_miftah_app_state_v2';

export function getTodayDateString(offsetDays = 0): string {
  const d = new Date();
  if (offsetDays !== 0) {
    d.setDate(d.getDate() + offsetDays);
  }
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function formatDateIndonesian(dateString: string): string {
  try {
    const parts = dateString.split('-');
    if (parts.length === 3) {
      const d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
      return d.toLocaleDateString('id-ID', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      });
    }
  } catch {}
  return dateString;
}

export function formatRupiah(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0
  }).format(amount);
}

export interface ActivityUrgencyInfo {
  label: string;
  badgeClass: string;
  isOverdue: boolean;
  isToday: boolean;
  daysDiff: number;
}

export function getActivityUrgency(dueDate: string, dueTime?: string, completed?: boolean): ActivityUrgencyInfo {
  if (completed) {
    return {
      label: 'Selesai',
      badgeClass: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400 border-emerald-200/50',
      isOverdue: false,
      isToday: false,
      daysDiff: 0
    };
  }

  const todayStr = getTodayDateString(0);
  const now = new Date();
  const [tY, tM, tD] = todayStr.split('-').map(Number);
  const todayMidnight = new Date(tY, tM - 1, tD).getTime();

  const [dY, dM, dD] = dueDate.split('-').map(Number);
  const targetMidnight = new Date(dY, dM - 1, dD).getTime();

  const diffMs = targetMidnight - todayMidnight;
  const daysDiff = Math.round(diffMs / (1000 * 60 * 60 * 24));

  const timeLabel = dueTime ? ` · ${dueTime}` : '';

  if (daysDiff < 0) {
    const absDays = Math.abs(daysDiff);
    return {
      label: `Terlewat ${absDays} hari${timeLabel}`,
      badgeClass: 'bg-rose-50 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400 border-rose-200/80 font-bold',
      isOverdue: true,
      isToday: false,
      daysDiff
    };
  }

  if (daysDiff === 0) {
    return {
      label: `Hari Ini${timeLabel}`,
      badgeClass: 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400 border-amber-200 font-bold animate-pulse',
      isOverdue: false,
      isToday: true,
      daysDiff: 0
    };
  }

  if (daysDiff === 1) {
    return {
      label: `Besok${timeLabel}`,
      badgeClass: 'bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400 border-blue-200',
      isOverdue: false,
      isToday: false,
      daysDiff: 1
    };
  }

  if (daysDiff <= 7) {
    return {
      label: `${daysDiff} hari lagi${timeLabel}`,
      badgeClass: 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400 border-indigo-200',
      isOverdue: false,
      isToday: false,
      daysDiff
    };
  }

  return {
    label: `${formatDateIndonesian(dueDate)}${timeLabel}`,
    badgeClass: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border-slate-200',
    isOverdue: false,
    isToday: false,
    daysDiff
  };
}

export function getInitialDefaultState(): AppState {
  const today = getTodayDateString(0);
  const tomorrow = getTodayDateString(1);
  const inTwoDays = getTodayDateString(2);
  const inThreeDays = getTodayDateString(3);
  const dMinus1 = getTodayDateString(-1);
  const dMinus2 = getTodayDateString(-2);

  const defaultActivities: ActivityItem[] = [
    {
      id: 'act-1',
      title: 'Kirim laporan progres mingguan ke tim',
      category: 'kerjaan',
      dueDate: today,
      dueTime: '17:00',
      completed: false,
      priority: 'tinggi',
      notes: 'Rekap poin pencapaian minggu ini dan lampirkan file spreadsheet pendukung.',
      createdAt: Date.now() - 86400000
    },
    {
      id: 'act-2',
      title: 'Beli strip refill tes tensi darah & gula',
      category: 'kesehatan',
      dueDate: tomorrow,
      dueTime: '10:00',
      completed: false,
      priority: 'sedang',
      notes: 'Beli di apotek terdekat atau checkout via online shop.',
      createdAt: Date.now() - 43200000
    },
    {
      id: 'act-3',
      title: 'Follow up konfirmasi invoice & pembayaran klien',
      category: 'kerjaan',
      dueDate: inTwoDays,
      dueTime: '14:00',
      completed: false,
      priority: 'sedang',
      notes: 'Cek WhatsApp atau email jika belum ada kabar.',
      createdAt: Date.now() - 20000000
    },
    {
      id: 'act-4',
      title: 'Rapikan file backup laptop & cloud storage',
      category: 'pribadi',
      dueDate: inThreeDays,
      completed: false,
      priority: 'rendah',
      createdAt: Date.now() - 10000000
    },
    {
      id: 'act-5',
      title: 'Rekap hasil cek tensi & asam urat bulan ini',
      category: 'kesehatan',
      dueDate: dMinus1,
      completed: true,
      priority: 'sedang',
      createdAt: Date.now() - 120000000,
      completedAt: Date.now() - 86400000
    }
  ];

  const defaultHabits: HabitItem[] = [
    {
      id: 'h-1',
      title: 'Minum Air Putih 2.5L',
      category: 'kesehatan',
      targetCount: 8,
      unit: 'gelas',
      iconName: 'Droplet',
      color: '#06B6D4',
      history: {
        [dMinus2]: 8,
        [dMinus1]: 8,
        [today]: 6
      },
      currentStreak: 5
    },
    {
      id: 'h-2',
      title: 'Tidur Cukup 7-8 Jam',
      category: 'kesehatan',
      targetCount: 7,
      unit: 'jam',
      iconName: 'Moon',
      color: '#6366F1',
      history: {
        [dMinus2]: 7,
        [dMinus1]: 8,
        [today]: 7
      },
      currentStreak: 4
    },
    {
      id: 'h-3',
      title: 'Aktivitas / Jalan 30 Menit',
      category: 'kesehatan',
      targetCount: 30,
      unit: 'menit',
      iconName: 'Activity',
      color: '#10B981',
      history: {
        [dMinus2]: 30,
        [dMinus1]: 35,
        [today]: 30
      },
      currentStreak: 3
    },
    {
      id: 'h-4',
      title: 'Hindari Jeroan & Gorengan',
      category: 'kesehatan',
      targetCount: 1,
      unit: 'centang',
      iconName: 'Apple',
      color: '#F59E0B',
      history: {
        [dMinus2]: 1,
        [dMinus1]: 1,
        [today]: 1
      },
      currentStreak: 6
    }
  ];

  const defaultHealthChecks: HealthCheckRecord[] = [
    {
      id: 'hc-1',
      date: today,
      time: '08:30',
      systolic: 122,
      diastolic: 78,
      heartRate: 72,
      uricAcid: 6.4,
      cholesterol: 192,
      bloodSugar: 94,
      bloodSugarType: 'puasa',
      gender: 'pria',
      notes: 'Pemeriksaan rutin mandiri pagi hari. Semua indikator aman terkendali.'
    },
    {
      id: 'hc-2',
      date: getTodayDateString(-25),
      time: '09:00',
      systolic: 134,
      diastolic: 84,
      heartRate: 78,
      uricAcid: 7.3,
      cholesterol: 218,
      bloodSugar: 108,
      bloodSugarType: 'puasa',
      gender: 'pria',
      notes: 'Bulan lalu sempat agak tinggi setelah sering makan emping dan begadang.'
    }
  ];

  const defaultTransactions: TransactionLog[] = [
    {
      id: 'tx-1',
      date: today,
      title: 'Makan siang sehat (Sayur + tahu tempe)',
      amount: 25000,
      type: 'pengeluaran',
      category: 'Makanan'
    },
    {
      id: 'tx-2',
      date: today,
      title: 'Beli buah segar (Pisang & apel)',
      amount: 30000,
      type: 'pengeluaran',
      category: 'Kesehatan'
    },
    {
      id: 'tx-3',
      date: dMinus1,
      title: 'Honor proyek / Gaji freelance',
      amount: 1500000,
      type: 'pemasukan',
      category: 'Pemasukan'
    }
  ];

  const defaultReminders: ReminderItem[] = [
    {
      id: 'rem-1',
      title: 'Bangun Pagi & 1 Gelas Air Hangat',
      time: '06:00',
      category: 'kesehatan',
      days: [1, 2, 3, 4, 5, 6, 0],
      enabled: true,
      note: 'Minum air hangat untuk mengaktifkan organ tubuh dan ginjal.'
    },
    {
      id: 'rem-2',
      title: 'Cek Tensi & Hidrasi Siang',
      time: '12:30',
      category: 'kesehatan',
      days: [1, 2, 3, 4, 5, 6, 0],
      enabled: true,
      note: 'Sudah minum berapa gelas hari ini? Pilih menu makan siang rendah garam & minyak.'
    },
    {
      id: 'rem-3',
      title: 'Waktunya Gerak Badan Sore',
      time: '17:00',
      category: 'kesehatan',
      days: [1, 2, 3, 4, 5, 6],
      enabled: true,
      note: 'Jalan santai 30 menit atau stretching ringan.'
    },
    {
      id: 'rem-4',
      title: 'Istirahat Malam & Bebas Gadget',
      time: '21:30',
      category: 'kesehatan',
      days: [1, 2, 3, 4, 5, 6, 0],
      enabled: true,
      note: 'Tutup hari dengan tenang, tidur cukup 7-8 jam.'
    }
  ];

  const defaultChatMessages: ChatMessage[] = [
    {
      id: 'msg-1',
      role: 'model',
      text: 'JARVIS online. Halo Agus! Sistem siap membantu Anda memantau skrining kesehatan (tensi, asam urat, gula darah), target harian, serta melacak kegiatan dan deadline yang belum selesai. Ada yang perlu saya proses hari ini?',
      timestamp: Date.now() - 3600000
    }
  ];

  const defaultSettings: UserSettings = {
    userName: 'Agus',
    soundEnabled: true,
    notificationsEnabled: true
  };

  return {
    activities: defaultActivities,
    habits: defaultHabits,
    reminders: defaultReminders,
    healthChecks: defaultHealthChecks,
    transactions: defaultTransactions,
    chatMessages: defaultChatMessages,
    settings: defaultSettings,
    serverUpdatedAt: 0
  };
}

export function loadAppState(): AppState {
  if (typeof window === 'undefined') {
    return getInitialDefaultState();
  }
  try {
    let raw = localStorage.getItem(STORAGE_KEY);
    let isLegacy = false;
    if (!raw) {
      raw = localStorage.getItem(LEGACY_STORAGE_KEY);
      isLegacy = true;
    }

    if (!raw) {
      const initial = getInitialDefaultState();
      saveAppState(initial);
      return initial;
    }

    const parsed = JSON.parse(raw) as Partial<AppState>;
    const defaultState = getInitialDefaultState();

    const loaded: AppState = {
      activities: Array.isArray(parsed.activities) && parsed.activities.length > 0 ? parsed.activities : defaultState.activities,
      habits: Array.isArray(parsed.habits) && parsed.habits.length > 0 ? parsed.habits : defaultState.habits,
      reminders: Array.isArray(parsed.reminders) ? parsed.reminders : defaultState.reminders,
      healthChecks: Array.isArray(parsed.healthChecks) && parsed.healthChecks.length > 0 ? parsed.healthChecks : defaultState.healthChecks,
      transactions: Array.isArray(parsed.transactions) ? parsed.transactions : defaultState.transactions,
      chatMessages: Array.isArray(parsed.chatMessages) && parsed.chatMessages.length > 0 ? parsed.chatMessages : defaultState.chatMessages,
      settings: { ...defaultState.settings, ...(parsed.settings || {}) },
      // If migrated from legacy, reset serverUpdatedAt to 0 so fresh server data can sync
      serverUpdatedAt: isLegacy ? 0 : (typeof parsed.serverUpdatedAt === 'number' ? parsed.serverUpdatedAt : 0)
    };

    if (isLegacy) {
      saveAppState(loaded);
    }

    return loaded;
  } catch (e) {
    console.error('Failed to load local state, using initial state:', e);
    return getInitialDefaultState();
  }
}


export function saveAppState(state: AppState): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.error('Failed to save state to localStorage:', e);
  }
}

export function resetAppState(): AppState {
  const fresh = getInitialDefaultState();
  saveAppState(fresh);
  return fresh;
}
