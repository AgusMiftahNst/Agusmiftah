import React, { useState } from 'react';
import { X, HeartPulse, CheckCircle2, Sparkles, AlertCircle } from 'lucide-react';
import { HealthCheckRecord } from '../types';
import { analyzeBloodPressure, analyzeUricAcid, analyzeCholesterol, analyzeBloodSugar } from '../utils/healthAnalysis';
import { sound } from '../utils/audio';

interface HealthCheckModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (record: Omit<HealthCheckRecord, 'id'>) => void;
  initialRecord?: HealthCheckRecord;
}

export function HealthCheckModal({ isOpen, onClose, onSave, initialRecord }: HealthCheckModalProps) {
  const now = new Date();
  const defaultDate = now.toISOString().split('T')[0];
  const defaultTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

  const [date, setDate] = useState(initialRecord?.date || defaultDate);
  const [time, setTime] = useState(initialRecord?.time || defaultTime);
  const [gender, setGender] = useState<'pria' | 'wanita'>(initialRecord?.gender || 'pria');

  // Blood Pressure
  const [systolic, setSystolic] = useState(initialRecord?.systolic ? String(initialRecord.systolic) : '120');
  const [diastolic, setDiastolic] = useState(initialRecord?.diastolic ? String(initialRecord.diastolic) : '80');
  const [heartRate, setHeartRate] = useState(initialRecord?.heartRate ? String(initialRecord.heartRate) : '72');

  // Uric Acid
  const [uricAcid, setUricAcid] = useState(initialRecord?.uricAcid ? String(initialRecord.uricAcid) : '6.0');

  // Cholesterol
  const [cholesterol, setCholesterol] = useState(initialRecord?.cholesterol ? String(initialRecord.cholesterol) : '190');

  // Blood Sugar
  const [bloodSugar, setBloodSugar] = useState(initialRecord?.bloodSugar ? String(initialRecord.bloodSugar) : '95');
  const [bloodSugarType, setBloodSugarType] = useState<'puasa' | 'sewaktu' | 'setelah_makan'>(
    initialRecord?.bloodSugarType || 'puasa'
  );

  const [notes, setNotes] = useState(initialRecord?.notes || '');

  if (!isOpen) return null;

  // Real-time live analysis previews
  const bpAnalysis = systolic && diastolic ? analyzeBloodPressure(Number(systolic), Number(diastolic)) : null;
  const uricAnalysis = uricAcid ? analyzeUricAcid(Number(uricAcid), gender) : null;
  const cholAnalysis = cholesterol ? analyzeCholesterol(Number(cholesterol)) : null;
  const bsAnalysis = bloodSugar ? analyzeBloodSugar(Number(bloodSugar), bloodSugarType) : null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!systolic || !diastolic) return;

    onSave({
      date,
      time,
      systolic: Number(systolic),
      diastolic: Number(diastolic),
      heartRate: heartRate ? Number(heartRate) : undefined,
      uricAcid: uricAcid ? Number(uricAcid) : undefined,
      cholesterol: cholesterol ? Number(cholesterol) : undefined,
      bloodSugar: bloodSugar ? Number(bloodSugar) : undefined,
      bloodSugarType,
      gender,
      notes: notes.trim()
    });

    sound.playSuccess();
    onClose();
  };

  const getStatusBadge = (status: 'optimal' | 'normal' | 'waspada' | 'tinggi' | 'rendah', label: string) => {
    if (status === 'optimal' || status === 'normal') {
      return (
        <span className="text-[10px] font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded">
          ✓ {label}
        </span>
      );
    }
    if (status === 'waspada') {
      return (
        <span className="text-[10px] font-semibold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/60 px-2 py-0.5 rounded">
          ⚠ {label}
        </span>
      );
    }
    return (
      <span className="text-[10px] font-semibold text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-950/60 px-2 py-0.5 rounded">
        ! {label}
      </span>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl overflow-hidden max-h-[92vh] flex flex-col">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 rounded-lg">
              <HeartPulse className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                Catat Hasil Cek Kesehatan
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Tensi Darah, Asam Urat, Kolesterol, dan Gula Darah
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto flex-1">
          {/* Tanggal, Waktu & Gender */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Tanggal Cek *
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Jam Pengukuran
              </label>
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full px-3 py-2 text-xs font-mono tabular-nums bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Jenis Kelamin (Acuan)
              </label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value as 'pria' | 'wanita')}
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg"
              >
                <option value="pria">Pria</option>
                <option value="wanita">Wanita</option>
              </select>
            </div>
          </div>

          {/* Section 1: Tensi Darah */}
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-200">
                1. Tekanan Darah (Tensi)
              </span>
              {bpAnalysis && getStatusBadge(bpAnalysis.status, bpAnalysis.statusLabel)}
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] text-slate-500 mb-1">Sistolik (mmHg) *</label>
                <input
                  type="number"
                  min="60"
                  max="260"
                  required
                  placeholder="120"
                  value={systolic}
                  onChange={(e) => setSystolic(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs font-mono tabular-nums bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-[11px] text-slate-500 mb-1">Diastolik (mmHg) *</label>
                <input
                  type="number"
                  min="40"
                  max="160"
                  required
                  placeholder="80"
                  value={diastolic}
                  onChange={(e) => setDiastolic(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs font-mono tabular-nums bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-[11px] text-slate-500 mb-1">Detak Nadi (bpm)</label>
                <input
                  type="number"
                  min="40"
                  max="200"
                  placeholder="72"
                  value={heartRate}
                  onChange={(e) => setHeartRate(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs font-mono tabular-nums bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Asam Urat */}
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-200">
                2. Asam Urat (Uric Acid)
              </span>
              {uricAnalysis && getStatusBadge(uricAnalysis.status, uricAnalysis.statusLabel)}
            </div>

            <div className="grid grid-cols-2 gap-3 items-center">
              <div>
                <label className="block text-[11px] text-slate-500 mb-1">Kadar (mg/dL)</label>
                <input
                  type="number"
                  step="0.1"
                  min="1"
                  max="20"
                  placeholder="6.0"
                  value={uricAcid}
                  onChange={(e) => setUricAcid(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs font-mono tabular-nums bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg"
                />
              </div>
              <div className="text-[11px] text-slate-500">
                <span className="block font-medium">Batas Normal:</span>
                <span>{gender === 'wanita' ? '2.5 - 6.0 mg/dL' : '3.5 - 7.0 mg/dL'}</span>
              </div>
            </div>
          </div>

          {/* Section 3: Kolesterol Total */}
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-200">
                3. Kolesterol Total
              </span>
              {cholAnalysis && getStatusBadge(cholAnalysis.status, cholAnalysis.statusLabel)}
            </div>

            <div className="grid grid-cols-2 gap-3 items-center">
              <div>
                <label className="block text-[11px] text-slate-500 mb-1">Kadar (mg/dL)</label>
                <input
                  type="number"
                  min="50"
                  max="500"
                  placeholder="190"
                  value={cholesterol}
                  onChange={(e) => setCholesterol(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs font-mono tabular-nums bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg"
                />
              </div>
              <div className="text-[11px] text-slate-500">
                <span className="block font-medium">Batas Aman:</span>
                <span>Normal &lt; 200 mg/dL (Waspada: 200-239)</span>
              </div>
            </div>
          </div>

          {/* Section 4: Gula Darah */}
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-200">
                4. Gula Darah (Blood Glucose)
              </span>
              {bsAnalysis && getStatusBadge(bsAnalysis.status, bsAnalysis.statusLabel)}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] text-slate-500 mb-1">Kadar (mg/dL)</label>
                <input
                  type="number"
                  min="30"
                  max="600"
                  placeholder="95"
                  value={bloodSugar}
                  onChange={(e) => setBloodSugar(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs font-mono tabular-nums bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-[11px] text-slate-500 mb-1">Kondisi Saat Cek</label>
                <select
                  value={bloodSugarType}
                  onChange={(e) =>
                    setBloodSugarType(e.target.value as 'puasa' | 'sewaktu' | 'setelah_makan')
                  }
                  className="w-full px-3 py-1.5 text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg"
                >
                  <option value="puasa">Puasa (Minimal 8 Jam)</option>
                  <option value="setelah_makan">2 Jam Setelah Makan</option>
                  <option value="sewaktu">Sewaktu (Acak)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Catatan / Keluhan */}
          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Catatan / Kondisi Tubuh Saat Pengecekan
            </label>
            <textarea
              rows={2}
              placeholder="Contoh: Sempat pusing setelah makan siang bersantan, cek rutin bulanan di klinik..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500"
            />
          </div>

          {/* Footer buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-sm transition-colors flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              Simpan & Analisis
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
