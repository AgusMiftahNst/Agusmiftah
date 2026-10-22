import React from 'react';
import {
  HeartPulse,
  Droplet,
  Moon,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Bot
} from 'lucide-react';
import { HabitItem, HealthCheckRecord } from '../types';
import { formatDateIndonesian } from '../utils/storage';
import { generateComprehensiveAnalysis, HealthStatusLevel } from '../utils/healthAnalysis';
import { sound } from '../utils/audio';

interface HealthViewProps {
  todayDate: string;
  habits: HabitItem[];
  healthChecks: HealthCheckRecord[];
  onToggleHabit: (habitId: string) => void;
  onIncrementHabit: (habitId: string, delta: number) => void;
  onOpenHealthCheckModal: () => void;
  onDeleteHealthCheck: (id: string) => void;
  onOpenAIChat: () => void;
  soundEnabled: boolean;
}

export function HealthView({
  todayDate,
  habits,
  healthChecks,
  onIncrementHabit,
  onOpenHealthCheckModal,
  onDeleteHealthCheck,
  onOpenAIChat,
  soundEnabled
}: HealthViewProps) {
  const sortedChecks = [...healthChecks].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );
  const latestCheck = sortedChecks[0];
  const analysis = latestCheck ? generateComprehensiveAnalysis(latestCheck) : null;

  const waterHabit = habits.find((h) => h.id === 'h-1');
  const currentWater = waterHabit?.history[todayDate] || 0;
  const targetWater = waterHabit?.targetCount || 8;

  const getBadge = (status: HealthStatusLevel, label: string) => {
    if (status === 'optimal' || status === 'normal') {
      return (
        <span className="text-[10px] font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded flex items-center gap-1">
          <CheckCircle2 className="w-3 h-3" />
          {label}
        </span>
      );
    }
    if (status === 'waspada') {
      return (
        <span className="text-[10px] font-semibold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/60 px-2 py-0.5 rounded flex items-center gap-1">
          <AlertCircle className="w-3 h-3" />
          {label}
        </span>
      );
    }
    return (
      <span className="text-[10px] font-semibold text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/60 px-2 py-0.5 rounded flex items-center gap-1">
        <AlertTriangle className="w-3 h-3" />
        {label}
      </span>
    );
  };

  return (
    <div className="space-y-4 pb-4">
      {/* Top Header Card */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <HeartPulse className="w-5 h-5 text-rose-600" />
            Cek Kesehatan
          </h2>
          <span className="text-[11px] text-slate-500">
            Tensi, Asam Urat, Kolesterol & Gula Darah
          </span>
        </div>

        <button
          onClick={onOpenHealthCheckModal}
          className="px-3 py-1.5 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 active:scale-95 rounded-xl shadow-xs flex items-center gap-1 transition-all"
        >
          <Plus className="w-3.5 h-3.5" />
          Cek Baru
        </button>
      </div>

      {/* Latest Analysis Summary Card */}
      {latestCheck && analysis ? (
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-900 dark:text-white">
                Hasil Terakhir: {formatDateIndonesian(latestCheck.date)}
              </span>
              {latestCheck.time && (
                <span className="text-[10px] text-slate-400">({latestCheck.time})</span>
              )}
            </div>

            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                analysis.overallStatus === 'prima'
                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                  : analysis.overallStatus === 'perhatian'
                  ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                  : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
              }`}
            >
              {analysis.overallStatus === 'prima'
                ? 'Kondisi Prima'
                : analysis.overallStatus === 'perhatian'
                ? 'Perlu Perhatian'
                : 'Waspada Tinggi'}
            </span>
          </div>

          {/* 4 Cards Grid */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            {/* Tensi */}
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-slate-400 block">Tensi</span>
                {getBadge(analysis.parameters.bloodPressure.status, analysis.parameters.bloodPressure.statusLabel)}
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-lg font-bold font-mono tabular-nums text-slate-900 dark:text-white">
                  {latestCheck.systolic}/{latestCheck.diastolic}
                </span>
                <span className="text-[10px] text-slate-400 font-mono">mmHg</span>
              </div>
              <p className="text-[10px] text-slate-500 leading-tight">
                {analysis.parameters.bloodPressure.selfControlAction}
              </p>
            </div>

            {/* Asam Urat */}
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-slate-400 block">Asam Urat</span>
                {analysis.parameters.uricAcid &&
                  getBadge(analysis.parameters.uricAcid.status, analysis.parameters.uricAcid.statusLabel)}
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-lg font-bold font-mono tabular-nums text-slate-900 dark:text-white">
                  {latestCheck.uricAcid ?? '-'}
                </span>
                <span className="text-[10px] text-slate-400 font-mono">mg/dL</span>
              </div>
              <p className="text-[10px] text-slate-500 leading-tight">
                {analysis.parameters.uricAcid?.selfControlAction || 'Jaga asupan air putih.'}
              </p>
            </div>

            {/* Kolesterol */}
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-slate-400 block">Kolesterol</span>
                {analysis.parameters.cholesterol &&
                  getBadge(analysis.parameters.cholesterol.status, analysis.parameters.cholesterol.statusLabel)}
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-lg font-bold font-mono tabular-nums text-slate-900 dark:text-white">
                  {latestCheck.cholesterol ?? '-'}
                </span>
                <span className="text-[10px] text-slate-400 font-mono">mg/dL</span>
              </div>
              <p className="text-[10px] text-slate-500 leading-tight">
                {analysis.parameters.cholesterol?.selfControlAction || 'Hindari gorengan berlebih.'}
              </p>
            </div>

            {/* Gula Darah */}
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-slate-400 block">
                  Gula ({latestCheck.bloodSugarType || 'puasa'})
                </span>
                {analysis.parameters.bloodSugar &&
                  getBadge(analysis.parameters.bloodSugar.status, analysis.parameters.bloodSugar.statusLabel)}
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-lg font-bold font-mono tabular-nums text-slate-900 dark:text-white">
                  {latestCheck.bloodSugar ?? '-'}
                </span>
                <span className="text-[10px] text-slate-400 font-mono">mg/dL</span>
              </div>
              <p className="text-[10px] text-slate-500 leading-tight">
                {analysis.parameters.bloodSugar?.selfControlAction || 'Kurangi minuman manis.'}
              </p>
            </div>
          </div>

          {/* AI Advice Bubble */}
          <div className="p-3 bg-linear-to-r from-rose-50 to-indigo-50 dark:from-rose-950/40 dark:to-indigo-950/40 border border-rose-100 dark:border-rose-900/40 rounded-xl flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <Bot className="w-4 h-4 text-rose-600 shrink-0" />
              <span className="text-[11px] text-slate-700 dark:text-slate-200">
                Mau saran makanan atau penjelasan dari AI Agus Miftah?
              </span>
            </div>
            <button
              onClick={onOpenAIChat}
              className="text-[11px] font-bold text-rose-600 dark:text-rose-400 hover:underline shrink-0"
            >
              Tanya AI &rarr;
            </button>
          </div>
        </div>
      ) : (
        <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-center space-y-2">
          <p className="text-xs text-slate-500">Belum ada catatan tensi, asam urat, kolesterol & gula darah.</p>
          <button
            onClick={onOpenHealthCheckModal}
            className="px-4 py-2 text-xs font-semibold text-white bg-rose-600 rounded-xl"
          >
            + Catat Sekarang
          </button>
        </div>
      )}

      {/* Simple Water Glasses Tracker */}
      {waterHabit && (
        <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Droplet className="w-4 h-4 text-cyan-500" />
              <span className="text-xs font-bold text-slate-900 dark:text-white">
                Minum Air Putih ({currentWater}/{targetWater} Gelas)
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => onIncrementHabit(waterHabit.id, -1)}
                disabled={currentWater <= 0}
                className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 text-xs font-bold text-slate-600 dark:text-slate-300 disabled:opacity-30"
              >
                -
              </button>
              <button
                onClick={() => {
                  if (soundEnabled) sound.playSuccess();
                  onIncrementHabit(waterHabit.id, 1);
                }}
                className="px-2.5 h-7 rounded-lg bg-cyan-600 text-white text-xs font-bold shadow-xs active:scale-95"
              >
                +1 Gelas
              </button>
            </div>
          </div>

          {/* Simple Glasses Pill Row */}
          <div className="flex gap-1.5">
            {Array.from({ length: targetWater }).map((_, idx) => (
              <div
                key={idx}
                className={`flex-1 h-3 rounded-full transition-colors ${
                  idx < currentWater ? 'bg-cyan-500' : 'bg-slate-100 dark:bg-slate-800'
                }`}
              />
            ))}
          </div>
        </div>
      )}

      {/* Riwayat Pemeriksaan Medis */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 shadow-xs space-y-3">
        <h3 className="text-xs font-bold text-slate-900 dark:text-white">
          Riwayat Cek ({sortedChecks.length})
        </h3>

        <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
          {sortedChecks.map((item) => (
            <div key={item.id} className="py-2.5 flex items-center justify-between text-xs gap-3">
              <div>
                <span className="font-semibold text-slate-800 dark:text-slate-200 block text-xs">
                  {formatDateIndonesian(item.date)} {item.time && `· ${item.time}`}
                </span>
                <span className="text-[11px] font-mono text-slate-500">
                  Tensi {item.systolic}/{item.diastolic} · Asam Urat {item.uricAcid ?? '-'} · Kolesterol {item.cholesterol ?? '-'} · Gula {item.bloodSugar ?? '-'}
                </span>
              </div>

              <button
                onClick={() => onDeleteHealthCheck(item.id)}
                className="p-1 text-slate-400 hover:text-red-500 transition-colors"
                title="Hapus"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
