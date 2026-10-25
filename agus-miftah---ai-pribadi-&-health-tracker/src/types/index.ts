export type CategoryType = 'kesehatan' | 'keuangan' | 'harian' | 'ibadah';

export type AppFeatureTab = 'home' | 'activities' | 'health' | 'finance' | 'reminders' | 'ai';

export interface AccessProfile {
  id: string;
  name: string; // e.g. 'Master (Pemilik)', 'Kerja / Asisten', 'Keluarga'
  code: string; // alphanumeric passcode, case-insensitive or exact
  isMaster?: boolean; // Master has full access and can manage security/passcodes
  allowedTabs: AppFeatureTab[];
  createdAt: number;
}

export interface ActivityItem {
  id: string;
  title: string;
  category: 'kerjaan' | 'pribadi' | 'kesehatan' | 'keuangan' | 'belajar' | 'ibadah' | 'lainnya';
  dueDate: string; // 'YYYY-MM-DD'
  dueTime?: string; // 'HH:MM'
  completed: boolean;
  priority: 'tinggi' | 'sedang' | 'rendah';
  notes?: string;
  createdAt: number;
  completedAt?: number;
  activityType?: 'deadline' | 'rutin_harian' | 'rutin_mingguan' | 'rutin_bulanan';
  weeklyInterval?: 1 | 2; // 1 = seminggu sekali, 2 = dua minggu sekali
  weeklyDay?: number; // 0 = Minggu, 1 = Senin, ... 6 = Sabtu
  prayerType?: 'subuh' | 'dzuhur' | 'ashar' | 'maghrib' | 'isya';
  routineCompletions?: Record<string, boolean>; // 'YYYY-MM-DD' => daily, 'YYYY-Wxx' / 'YYYY-2Wxx' => weekly, 'YYYY-MM' => monthly
}

export interface HabitItem {
  id: string;
  title: string;
  category: CategoryType;
  targetCount: number;
  unit: string; // e.g. 'gelas', 'jam', 'menit', 'centang'
  iconName?: string;
  color?: string;
  history: Record<string, number>; // 'YYYY-MM-DD' => count
  currentStreak: number;
}

export interface ReminderItem {
  id: string;
  title: string;
  time: string; // 'HH:MM'
  category: CategoryType | 'umum';
  days: number[]; // 0 = Min, 1 = Sen, ... 6 = Sab
  enabled: boolean;
  note: string;
}

export interface HealthCheckRecord {
  id: string;
  date: string; // 'YYYY-MM-DD'
  time?: string; // 'HH:MM'
  systolic: number; // mmHg
  diastolic: number; // mmHg
  heartRate?: number; // bpm
  uricAcid?: number; // mg/dL
  cholesterol?: number; // mg/dL
  bloodSugar?: number; // mg/dL
  bloodSugarType?: 'puasa' | 'sewaktu' | 'setelah_makan';
  gender?: 'pria' | 'wanita';
  notes?: string;
}

export interface TransactionLog {
  id: string;
  date: string; // 'YYYY-MM-DD'
  title: string;
  amount: number;
  type: 'pengeluaran' | 'pemasukan';
  category?: string;
  wallet?: string; // 'BCA' | 'Mandiri' | 'BRI' | 'BNI' | 'DANA' | 'OVO' | 'GoPay' | 'ShopeePay' | 'Tunai'
}

export interface GoldAsset {
  id: string;
  type: 'antam' | 'galeri24' | 'ubs' | 'pegadaian' | 'perhiasan' | 'lainnya';
  title: string; // e.g. 'Emas Antam LM 5 Gram', 'Emas Galeri 24 10 Gram'
  weightGrams: number; // e.g. 5, 10.5
  purchaseDate: string; // 'YYYY-MM-DD'
  purchasePricePerGram: number; // e.g. 1250000
  totalPurchasePrice: number; // total cost
  currentEstPricePerGram?: number; // estimated current market / buyback price
  notes?: string;
  wallet?: string; // e.g. 'BCA', 'DANA', 'Tunai'
  createdAt: number;
}

export interface FinancialGoal {
  id: string;
  title: string;
  targetAmount: number;
  currentAmount: number;
  targetDate?: string; // 'YYYY-MM-DD'
  category?: string;
  notes?: string;
  wallet?: string;
  isCompleted?: boolean;
  createdAt: number;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: number;
}

export interface PrayerTimes {
  subuh: string;
  terbit: string;
  dzuhur: string;
  ashar: string;
  maghrib: string;
  isya: string;
}

export interface NextPrayerInfo {
  name: string;
  time: string;
  remainingMinutes: number;
  countdownText: string;
  isPassedToday: boolean;
}

export interface PrayerLocationSettings {
  cityName: string;
  latitude: number;
  longitude: number;
  timezone: number; // e.g. 7 for WIB, 8 for WITA, 9 for WIT
  autoLocation?: boolean;
}

export interface UserSettings {
  userName: string;
  soundEnabled: boolean;
  notificationsEnabled: boolean;
  displayMode?: 'auto' | 'mobile' | 'laptop';
  appPin?: string;
  isPinRequired?: boolean;
  notifyHoursBefore?: number;
  accessProfiles?: AccessProfile[];
  prayerLocation?: PrayerLocationSettings;
}

export interface AppState {
  activities: ActivityItem[];
  habits: HabitItem[];
  reminders: ReminderItem[];
  healthChecks: HealthCheckRecord[];
  transactions: TransactionLog[];
  financialTargets?: FinancialGoal[];
  goldAssets?: GoldAsset[];
  chatMessages: ChatMessage[];
  settings: UserSettings;
  serverUpdatedAt?: number;
  syncRevision?: number;
}
