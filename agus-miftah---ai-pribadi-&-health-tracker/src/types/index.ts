export type CategoryType = 'kesehatan' | 'keuangan' | 'harian';

export interface ActivityItem {
  id: string;
  title: string;
  category: 'kerjaan' | 'pribadi' | 'kesehatan' | 'keuangan' | 'belajar' | 'lainnya';
  dueDate: string; // 'YYYY-MM-DD'
  dueTime?: string; // 'HH:MM'
  completed: boolean;
  priority: 'tinggi' | 'sedang' | 'rendah';
  notes?: string;
  createdAt: number;
  completedAt?: number;
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
}

export interface AppState {
  activities: ActivityItem[];
  habits: HabitItem[];
  reminders: ReminderItem[];
  healthChecks: HealthCheckRecord[];
  transactions: TransactionLog[];
  chatMessages: ChatMessage[];
  settings: UserSettings;
  serverUpdatedAt?: number;
}

