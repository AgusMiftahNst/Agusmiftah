import React, { useState, useEffect, useRef } from 'react';
import { Lock, Unlock, Eye, EyeOff, ShieldCheck, KeyRound, AlertCircle, Sparkles } from 'lucide-react';
import { sound } from '../utils/audio';
import { AccessProfile } from '../types';

interface LockScreenProps {
  isLocked: boolean;
  accessProfiles?: AccessProfile[];
  savedPin?: string;
  onUnlock: (profile: AccessProfile) => void;
  onResetToDefault?: () => void;
}

export function LockScreen({
  isLocked,
  accessProfiles = [],
  savedPin = 'agus123',
  onUnlock,
  onResetToDefault
}: LockScreenProps) {
  const [inputCode, setInputCode] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isShaking, setIsShaking] = useState(false);
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);
  const [unlockedProfileName, setUnlockedProfileName] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input whenever locked
  useEffect(() => {
    if (isLocked) {
      setInputCode('');
      setErrorMsg('');
      setIsResetConfirmOpen(false);
      setUnlockedProfileName(null);
      setTimeout(() => {
        inputRef.current?.focus();
      }, 150);
    }
  }, [isLocked]);

  if (!isLocked) return null;

  const handleVerify = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const candidate = inputCode.trim();
    if (!candidate) {
      setErrorMsg('Masukkan kode sandi atau kata sandi Anda.');
      return;
    }

    // Find profile matching the entered passcode (case-insensitive for convenience)
    const matched = accessProfiles.find(
      (p) => p.code.trim().toLowerCase() === candidate.toLowerCase()
    );

    if (matched) {
      sound.playSuccess();
      setUnlockedProfileName(matched.name);
      setErrorMsg('');
      setTimeout(() => {
        onUnlock(matched);
      }, 350);
    } else if (savedPin && savedPin.trim().toLowerCase() === candidate.toLowerCase()) {
      // Legacy fallback
      sound.playSuccess();
      const fallbackMaster: AccessProfile = {
        id: 'prof-master-fallback',
        name: 'Master (Pak Agus)',
        code: savedPin,
        isMaster: true,
        allowedTabs: ['home', 'activities', 'health', 'finance', 'reminders', 'ai'],
        createdAt: Date.now()
      };
      setUnlockedProfileName(fallbackMaster.name);
      setErrorMsg('');
      setTimeout(() => {
        onUnlock(fallbackMaster);
      }, 350);
    } else {
      sound.playBreathCue(true);
      setErrorMsg('Password / Kode akses tidak cocok. Periksa kembali.');
      setIsShaking(true);
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        navigator.vibrate([100, 50, 100]);
      }
      setTimeout(() => {
        setIsShaking(false);
      }, 500);
    }
  };

  const executeReset = () => {
    if (onResetToDefault) {
      onResetToDefault();
      setIsResetConfirmOpen(false);
      sound.playZenChime();
      // Unlock as master
      const defaultMaster: AccessProfile = {
        id: 'prof-master-default',
        name: 'Master (Pak Agus)',
        code: 'agus123',
        isMaster: true,
        allowedTabs: ['home', 'activities', 'health', 'finance', 'reminders', 'ai'],
        createdAt: Date.now()
      };
      onUnlock(defaultMaster);
    }
  };

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-slate-950/95 backdrop-blur-md text-white animate-fade-in select-none">
      {/* Background ambient lighting */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/2 -translate-x-1/2 w-72 h-72 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

      <div
        className={`w-full max-w-sm bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-7 shadow-2xl flex flex-col items-center text-center relative z-10 transition-transform ${
          isShaking ? 'animate-shake' : ''
        }`}
      >
        {/* Shield / Lock Icon */}
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-indigo-500/20 border border-cyan-500/40 text-cyan-400 flex items-center justify-center shadow-lg shadow-cyan-500/10 mb-4 relative">
          <Lock className="w-8 h-8 stroke-[2.2]" />
          <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-cyan-400 rounded-full animate-ping opacity-75" />
          <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-cyan-400 rounded-full shadow-xs shadow-cyan-400" />
        </div>

        <h2 className="text-base font-bold tracking-wide font-mono text-slate-100 flex items-center gap-1.5">
          SECURITY ACCESS GATE
          <ShieldCheck className="w-4 h-4 text-cyan-400" />
        </h2>
        <p className="text-xs text-slate-400 mt-1 mb-5 leading-relaxed">
          Masukkan kata sandi profil Anda untuk membuka fitur aplikasi yang diizinkan
        </p>

        {/* Unlocked feedback */}
        {unlockedProfileName ? (
          <div className="w-full py-4 mb-4 rounded-2xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 animate-pulse flex flex-col items-center gap-1">
            <Sparkles className="w-6 h-6 text-emerald-400 animate-spin" />
            <span className="text-xs font-bold">Kunci Terbuka!</span>
            <span className="text-[11px] text-emerald-200">
              Masuk sebagai: <strong>{unlockedProfileName}</strong>
            </span>
          </div>
        ) : (
          <form onSubmit={handleVerify} className="w-full space-y-3.5">
            {/* Alphanumeric Password Input Field */}
            <div className="relative w-full">
              <input
                ref={inputRef}
                type={showPassword ? 'text' : 'password'}
                autoCapitalize="none"
                autoComplete="off"
                spellCheck={false}
                value={inputCode}
                onChange={(e) => {
                  setInputCode(e.target.value);
                  if (errorMsg) setErrorMsg('');
                }}
                placeholder="Ketik password atau kode..."
                className="w-full pl-4 pr-11 py-3 text-sm font-medium tracking-wider bg-slate-800/90 text-slate-100 border border-slate-700 rounded-2xl focus:outline-hidden focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/30 placeholder-slate-500 transition-all text-center"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition-colors p-1"
                title={showPassword ? 'Sembunyikan' : 'Tampilkan'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            {/* Error Message */}
            {errorMsg && (
              <div className="p-2.5 rounded-xl bg-rose-950/70 border border-rose-800/60 text-xs text-rose-300 flex items-center justify-center gap-1.5 animate-pulse">
                <AlertCircle className="w-3.5 h-3.5 shrink-0 text-rose-400" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={!inputCode.trim()}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-500 hover:from-cyan-400 hover:to-indigo-400 active:scale-98 disabled:opacity-40 disabled:pointer-events-none text-slate-950 font-bold text-xs shadow-md shadow-cyan-500/20 transition-all flex items-center justify-center gap-2"
            >
              <Unlock className="w-4 h-4" />
              Buka Kunci Aplikasi
            </button>
          </form>
        )}

        {/* Hints / Profiles overview */}
        <div className="mt-5 pt-3 border-t border-slate-800/80 w-full flex flex-col gap-2 text-[11px] text-slate-400">
          <div className="flex items-center justify-between text-[11px] text-slate-500">
            <span>Kode sandi bebas (huruf & angka)</span>
            <button
              type="button"
              onClick={() => setIsResetConfirmOpen(true)}
              className="hover:text-cyan-400 underline underline-offset-2 transition-colors"
            >
              Reset ke agus123
            </button>
          </div>
        </div>

        {/* Reset Confirmation Dialog */}
        {isResetConfirmOpen && (
          <div className="absolute inset-0 bg-slate-950/95 rounded-3xl p-5 flex flex-col justify-center items-center text-center animate-fade-in z-20">
            <KeyRound className="w-10 h-10 text-amber-400 mb-2" />
            <h4 className="text-xs font-bold text-white mb-1">Reset Password Master?</h4>
            <p className="text-[11px] text-slate-400 mb-4 leading-relaxed">
              Password Master akan dikembalikan ke default: <strong className="text-cyan-300 font-mono">agus123</strong> dengan akses ke semua fitur.
            </p>
            <div className="flex gap-2 w-full">
              <button
                type="button"
                onClick={() => setIsResetConfirmOpen(false)}
                className="flex-1 py-2 text-xs font-semibold bg-slate-800 hover:bg-slate-700 rounded-xl"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={executeReset}
                className="flex-1 py-2 text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl shadow-xs"
              >
                Ya, Reset
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
