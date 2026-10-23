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
  activityType?: 'deadline' | 'rutin_harian' | 'rutin_bulanan';
  routineCompletions?: Record<string, boolean>; // 'YYYY-MM-DD' => true for daily, 'YYYY-MM' => true for monthly
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

export interface UserSettings {
  userName: string;
  soundEnabled: boolean;
  notificationsEnabled: boolean;
  displayMode?: 'auto' | 'mobile' | 'laptop';
  appPin?: string;
  isPinRequired?: boolean;
  notifyHoursBefore?: number;
  accessProfiles?: AccessProfile[];
}

export interface AppState {
  activities: ActivityItem[];
  habits: HabitItem[];
  reminders: ReminderItem[];
  healthChecks: HealthCheckRecord[];
  transactions: TransactionLog[];
  financialTargets?: FinancialGoal[];
  chatMessages: ChatMessage[];
  settings: UserSettings;
  serverUpdatedAt?: number;
  syncRevision?: number;
}
