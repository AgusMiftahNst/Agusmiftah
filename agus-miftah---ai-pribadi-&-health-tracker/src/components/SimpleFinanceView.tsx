import React, { useState } from 'react';
import {
  Wallet,
  Plus,
  Trash2,
  ArrowDownLeft,
  ArrowUpRight,
  Target,
  CreditCard,
  Building2,
  Banknote,
  Smartphone,
  TrendingUp,
  CheckCircle2,
  Calendar,
  X,
  Edit2
} from 'lucide-react';
import { TransactionLog, FinancialGoal } from '../types';
import { formatRupiah, formatDateIndonesian } from '../utils/storage';
import { sound } from '../utils/audio';

const WALLET_OPTIONS = [
  { id: 'BCA', name: 'Bank BCA', icon: Building2, color: 'text-blue-600 bg-blue-50 dark:bg-blue-950/60 dark:text-blue-300' },
  { id: 'Mandiri', name: 'Bank Mandiri', icon: Building2, color: 'text-amber-600 bg-amber-50 dark:bg-amber-950/60 dark:text-amber-300' },
  { id: 'BRI', name: 'Bank BRI', icon: Building2, color: 'text-sky-600 bg-sky-50 dark:bg-sky-950/60 dark:text-sky-300' },
  { id: 'BNI', name: 'Bank BNI', icon: Building2, color: 'text-teal-600 bg-teal-50 dark:bg-teal-950/60 dark:text-teal-300' },
  { id: 'DANA', name: 'DANA', icon: Smartphone, color: 'text-cyan-600 bg-cyan-50 dark:bg-cyan-950/60 dark:text-cyan-300' },
  { id: 'OVO', name: 'OVO', icon: Smartphone, color: 'text-purple-600 bg-purple-50 dark:bg-purple-950/60 dark:text-purple-300' },
  { id: 'GoPay', name: 'GoPay', icon: Smartphone, color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/60 dark:text-emerald-300' },
  { id: 'ShopeePay', name: 'ShopeePay', icon: Smartphone, color: 'text-orange-600 bg-orange-50 dark:bg-orange-950/60 dark:text-orange-300' },
  { id: 'Tunai', name: 'Kas / Tunai', icon: Banknote, color: 'text-slate-600 bg-slate-100 dark:bg-slate-800 dark:text-slate-300' },
  { id: 'Lainnya', name: 'Lainnya', icon: CreditCard, color: 'text-indigo-600 bg-indigo-50 dark:bg-indigo-950/60 dark:text-indigo-300' }
];

interface SimpleFinanceViewProps {
  transactions: TransactionLog[];
  financialTargets?: FinancialGoal[];
  todayDate: string;
  onAddTransaction: (tx: Omit<TransactionLog, 'id'>) => void;
  onDeleteTransaction: (id: string) => void;
  onAddFinancialTarget?: (target: Omit<FinancialGoal, 'id' | 'createdAt'>) => void;
  onUpdateFinancialTarget?: (target: FinancialGoal) => void;
  onDeleteFinancialTarget?: (id: string) => void;
  soundEnabled: boolean;
}

export function SimpleFinanceView({
  transactions,
  financialTargets = [],
  todayDate,
  onAddTransaction,
  onDeleteTransaction,
  onAddFinancialTarget,
  onUpdateFinancialTarget,
  onDeleteFinancialTarget,
  soundEnabled
}: SimpleFinanceViewProps) {
  const [activeTab, setActiveTab] = useState<'transaksi' | 'target'>('transaksi');
  const [isAddingTx, setIsAddingTx] = useState(false);
  const [isAddingTarget, setIsAddingTarget] = useState(false);
  const [editingTarget, setEditingTarget] = useState<FinancialGoal | null>(null);
  const [filterWallet, setFilterWallet] = useState<string>('all');

  // Transaction form state
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState<'pengeluaran' | 'pemasukan'>('pengeluaran');
  const [category, setCategory] = useState('Makanan');
  const [wallet, setWallet] = useState('BCA');

  // Target form state
  const [targetTitle, setTargetTitle] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [currentAmount, setCurrentAmount] = useState('');
  const [targetCategory, setTargetCategory] = useState('Tabungan');
  const [targetWallet, setTargetWallet] = useState('BCA');
  const [targetDate, setTargetDate] = useState('');
  const [targetNotes, setTargetNotes] = useState('');

  // Quick top-up modal state
  const [topUpTarget, setTopUpTarget] = useState<FinancialGoal | null>(null);
  const [topUpAmount, setTopUpAmount] = useState('');

  // Calculations
  const totalExpense = transactions
    .filter((t) => t.type === 'pengeluaran')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalIncome = transactions
    .filter((t) => t.type === 'pemasukan')
    .reduce((sum, t) => sum + t.amount, 0);

  const netBalance = totalIncome - totalExpense;

  // Wallet breakdown
  const walletBalances: Record<string, number> = {};
  transactions.forEach((tx) => {
    const w = tx.wallet || 'Tunai';
    const delta = tx.type === 'pemasukan' ? tx.amount : -tx.amount;
    walletBalances[w] = (walletBalances[w] || 0) + delta;
  });

  // Only display banks / e-wallets that actually have a balance
  const activeWallets = WALLET_OPTIONS.filter((w) => {
    const bal = walletBalances[w.id] || 0;
    return bal !== 0;
  });

  // Filtered transactions
  const filteredTransactions = transactions.filter((t) => {
    if (filterWallet === 'all') return true;
    return (t.wallet || 'Tunai') === filterWallet;
  });

  const handleTxSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !amount) return;

    // Parse exact number (including odd numbers like 8853063)
    const cleanAmount = parseFloat(amount.toString().replace(/[^0-9.]/g, ''));
    if (isNaN(cleanAmount) || cleanAmount <= 0) return;

    onAddTransaction({
      date: todayDate,
      title: title.trim(),
      amount: cleanAmount,
      type,
      category,
      wallet
    });

    if (soundEnabled) sound.playSuccess();
    setTitle('');
    setAmount('');
    setIsAddingTx(false);
  };

  const handleTargetSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetTitle.trim() || !targetAmount) return;

    const cleanTarget = parseFloat(targetAmount.toString().replace(/[^0-9.]/g, ''));
    const cleanCurrent = currentAmount ? parseFloat(currentAmount.toString().replace(/[^0-9.]/g, '')) : 0;

    if (isNaN(cleanTarget) || cleanTarget <= 0) return;

    if (editingTarget && onUpdateFinancialTarget) {
      onUpdateFinancialTarget({
        ...editingTarget,
        title: targetTitle.trim(),
        targetAmount: cleanTarget,
        currentAmount: isNaN(cleanCurrent) ? 0 : cleanCurrent,
        category: targetCategory,
        wallet: targetWallet,
        targetDate: targetDate || undefined,
        notes: targetNotes.trim() || undefined
      });
    } else if (onAddFinancialTarget) {
      onAddFinancialTarget({
        title: targetTitle.trim(),
        targetAmount: cleanTarget,
        currentAmount: isNaN(cleanCurrent) ? 0 : cleanCurrent,
        category: targetCategory,
        wallet: targetWallet,
        targetDate: targetDate || undefined,
        notes: targetNotes.trim() || undefined
      });
    }

    if (soundEnabled) sound.playSuccess();
    setTargetTitle('');
    setTargetAmount('');
    setCurrentAmount('');
    setTargetNotes('');
    setEditingTarget(null);
    setIsAddingTarget(false);
  };

  const handleQuickTopUp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!topUpTarget || !topUpAmount || !onUpdateFinancialTarget) return;

    const delta = parseFloat(topUpAmount.toString().replace(/[^0-9.]/g, ''));
    if (isNaN(delta) || delta <= 0) return;

    const newCurrent = topUpTarget.currentAmount + delta;
    onUpdateFinancialTarget({
      ...topUpTarget,
      currentAmount: newCurrent,
      isCompleted: newCurrent >= topUpTarget.targetAmount
    });

    if (soundEnabled) sound.playSuccess();
    setTopUpTarget(null);
    setTopUpAmount('');
  };

  const openEditTarget = (goal: FinancialGoal) => {
    setEditingTarget(goal);
    setTargetTitle(goal.title);
    setTargetAmount(goal.targetAmount.toString());
    setCurrentAmount(goal.currentAmount.toString());
    setTargetCategory(goal.category || 'Tabungan');
    setTargetWallet(goal.wallet || 'BCA');
    setTargetDate(goal.targetDate || '');
    setTargetNotes(goal.notes || '');
    setIsAddingTarget(true);
  };

  return (
    <div className="space-y-4 pb-4">
      {/* Top Navigation Tabs: Transaksi vs Target Keuangan */}
      <div className="flex bg-slate-100 dark:bg-slate-800/80 p-1 rounded-2xl border border-slate-200/80 dark:border-slate-800">
        <button
          onClick={() => setActiveTab('transaksi')}
          className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
            activeTab === 'transaksi'
              ? 'bg-white dark:bg-slate-900 text-amber-600 dark:text-amber-400 shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Wallet className="w-4 h-4" />
          Transaksi & Dompet
        </button>
        <button
          onClick={() => setActiveTab('target')}
          className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
            activeTab === 'target'
              ? 'bg-white dark:bg-slate-900 text-amber-600 dark:text-amber-400 shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Target className="w-4 h-4" />
          Target Keuangan ({financialTargets.length})
        </button>
      </div>

      {activeTab === 'transaksi' && (
        <>
          {/* Top Balance Summary Card */}
          <div className="p-4 bg-linear-to-br from-amber-500/10 via-slate-50 to-slate-100 dark:from-amber-950/30 dark:via-slate-900 dark:to-slate-900 border border-amber-200/80 dark:border-amber-900/40 rounded-2xl shadow-xs">
            <span className="text-[11px] text-slate-500 dark:text-slate-400 block mb-0.5 font-medium">
              Sisa Saldo Kas Bersih (Semua Rekening)
            </span>
            <div className="flex items-baseline justify-between mb-3 flex-wrap gap-2">
              <span
                className={`text-2xl font-bold font-mono tabular-nums ${
                  netBalance >= 0 ? 'text-slate-900 dark:text-white' : 'text-rose-600'
                }`}
              >
                {formatRupiah(netBalance)}
              </span>
              <button
                onClick={() => setIsAddingTx(!isAddingTx)}
                className="px-3.5 py-2 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 active:scale-95 rounded-xl shadow-xs flex items-center gap-1.5 transition-all min-h-[40px]"
              >
                <Plus className="w-4 h-4" />
                Catat Transaksi
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs pt-2.5 border-t border-slate-200/60 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                  <ArrowDownLeft className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block leading-tight">Total Pemasukan</span>
                  <span className="font-semibold font-mono text-emerald-600 dark:text-emerald-400">
                    {formatRupiah(totalIncome)}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
                  <ArrowUpRight className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block leading-tight">Total Pengeluaran</span>
                  <span className="font-semibold font-mono text-slate-800 dark:text-slate-200">
                    {formatRupiah(totalExpense)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Dompet & Bank Breakdown */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-3.5 shadow-xs">
            <div className="flex items-center justify-between mb-2.5">
              <h3 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <Building2 className="w-4 h-4 text-amber-500" />
                Saldo Per Bank & Dompet (E-Wallet)
              </h3>
              <span className="text-[10px] text-slate-400">BCA, Mandiri, DANA, OVO, dll</span>
            </div>

            {activeWallets.length === 0 ? (
              <div className="py-3 px-3 text-center bg-slate-50/60 dark:bg-slate-850/60 rounded-xl border border-dashed border-slate-200 dark:border-slate-800">
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Belum ada saldo terisi pada rekening bank atau e-wallet. Rekening akan otomatis muncul saat ada saldo.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {activeWallets.map((w) => {
                  const bal = walletBalances[w.id] || 0;
                  return (
                    <div
                      key={w.id}
                      onClick={() => setFilterWallet(filterWallet === w.id ? 'all' : w.id)}
                      className={`p-2.5 rounded-xl border text-left cursor-pointer transition-all ${
                        filterWallet === w.id
                          ? 'border-amber-500 bg-amber-50/40 dark:bg-amber-950/30'
                          : 'border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-850/60 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300">
                          {w.name}
                        </span>
                        <w.icon className={`w-3.5 h-3.5 ${w.color}`} />
                      </div>
                      <span
                        className={`text-xs font-mono font-bold block truncate ${
                          bal >= 0 ? 'text-slate-900 dark:text-slate-100' : 'text-rose-500'
                        }`}
                      >
                        {formatRupiah(bal)}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Add Transaction Form */}
          {isAddingTx && (
            <form
              onSubmit={handleTxSubmit}
              className="p-4 bg-white dark:bg-slate-900 border border-amber-300 dark:border-amber-800 rounded-2xl shadow-md space-y-3 animate-fade-in"
            >
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                <h3 className="text-xs font-bold text-slate-900 dark:text-white">
                  Catat Transaksi Baru
                </h3>
                <span className="text-[10px] text-slate-400">Bebas Angka Keriting</span>
              </div>

              {/* Type Toggle */}
              <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
                <button
                  type="button"
                  onClick={() => setType('pengeluaran')}
                  className={`py-2 text-xs font-bold rounded-lg transition-colors min-h-[38px] ${
                    type === 'pengeluaran'
                      ? 'bg-white dark:bg-slate-900 text-rose-600 shadow-xs'
                      : 'text-slate-500'
                  }`}
                >
                  Pengeluaran
                </button>
                <button
                  type="button"
                  onClick={() => setType('pemasukan')}
                  className={`py-2 text-xs font-bold rounded-lg transition-colors min-h-[38px] ${
                    type === 'pemasukan'
                      ? 'bg-white dark:bg-slate-900 text-emerald-600 shadow-xs'
                      : 'text-slate-500'
                  }`}
                >
                  Pemasukan
                </button>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Keterangan Transaksi
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Honor proyek, makan siang, beli bensin..."
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                />
              </div>

              {/* Nominal & Live Preview (Allows ANY exact number like 8853063!) */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                    Nominal (Rp)
                  </label>
                  <span className="text-[10px] text-slate-400">Bisa angka keriting & ganjil</span>
                </div>
                <input
                  type="number"
                  min="0"
                  step="any"
                  required
                  placeholder="Contoh: 8853063"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full px-3 py-2.5 text-sm font-mono font-bold tabular-nums bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                />
                {amount && !isNaN(parseFloat(amount)) && (
                  <div className="mt-1.5 p-1.5 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200/60 dark:border-amber-900/40 text-[11px] font-mono text-amber-700 dark:text-amber-300 font-bold flex items-center justify-between">
                    <span>Terbaca:</span>
                    <span>{formatRupiah(parseFloat(amount))}</span>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                {/* Bank / Dompet */}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Rekening / Dompet
                  </label>
                  <select
                    value={wallet}
                    onChange={(e) => setWallet(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                  >
                    {WALLET_OPTIONS.map((w) => (
                      <option key={w.id} value={w.id}>
                        {w.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Kategori */}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Kategori
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                  >
                    <option value="Makanan">Makanan & Minum</option>
                    <option value="Kesehatan">Kesehatan & Obat</option>
                    <option value="Ibadah">Ibadah & Sedekah</option>
                    <option value="Transport">Transportasi & Bensin</option>
                    <option value="Kebutuhan">Kebutuhan Rumah</option>
                    <option value="Pemasukan">Pemasukan / Gaji</option>
                    <option value="Tagihan">Tagihan & Internet</option>
                    <option value="Lainnya">Lainnya</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddingTx(false)}
                  className="px-4 py-2.5 text-xs font-semibold text-slate-500 hover:text-slate-700 min-h-[44px]"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 active:scale-95 rounded-xl shadow-xs transition-all min-h-[44px]"
                >
                  Simpan Transaksi
                </button>
              </div>
            </form>
          )}

          {/* Transactions List */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 shadow-xs space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <h3 className="text-xs font-bold text-slate-900 dark:text-white">
                Riwayat Transaksi Terkini
              </h3>

              {/* Wallet Filter Pills */}
              <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-0.5">
                <button
                  onClick={() => setFilterWallet('all')}
                  className={`text-[10px] px-2 py-0.5 rounded-full font-semibold transition-colors ${
                    filterWallet === 'all'
                      ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200'
                  }`}
                >
                  Semua
                </button>
                {activeWallets.map((w) => (
                  <button
                    key={w.id}
                    onClick={() => setFilterWallet(w.id)}
                    className={`text-[10px] px-2.5 py-0.5 rounded-full font-semibold transition-colors shrink-0 ${
                      filterWallet === w.id
                        ? 'bg-amber-600 text-white'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200'
                    }`}
                  >
                    {w.name}
                  </button>
                ))}
              </div>
            </div>

            <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {filteredTransactions.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-6">
                  {filterWallet === 'all' ? 'Belum ada transaksi tercatat.' : `Belum ada transaksi untuk dompet ${filterWallet}.`}
                </p>
              ) : (
                filteredTransactions.map((tx) => (
                  <div
                    key={tx.id}
                    className="py-2.5 flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                          tx.type === 'pemasukan'
                            ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-950/70 dark:text-emerald-400'
                            : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
                        }`}
                      >
                        {tx.type === 'pemasukan' ? (
                          <ArrowDownLeft className="w-4 h-4" />
                        ) : (
                          <ArrowUpRight className="w-4 h-4" />
                        )}
                      </div>
                      <div className="truncate">
                        <span className="font-semibold text-slate-900 dark:text-white block truncate">
                          {tx.title}
                        </span>
                        <div className="flex items-center gap-1.5 text-[10px] text-slate-400 mt-0.5">
                          <span>{formatDateIndonesian(tx.date)}</span>
                          {tx.wallet && (
                            <span className="px-1.5 py-0.2 rounded-sm bg-slate-100 dark:bg-slate-800 font-medium text-slate-600 dark:text-slate-300 border border-slate-200/50">
                              {tx.wallet}
                            </span>
                          )}
                          {tx.category && <span>· {tx.category}</span>}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span
                        className={`font-mono tabular-nums font-bold ${
                          tx.type === 'pemasukan'
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : 'text-slate-800 dark:text-slate-200'
                        }`}
                      >
                        {tx.type === 'pemasukan' ? '+' : '-'}{formatRupiah(tx.amount)}
                      </span>
                      <button
                        onClick={() => onDeleteTransaction(tx.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-500 dark:hover:text-rose-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors min-w-[36px] min-h-[36px] flex items-center justify-center"
                        title="Hapus Transaksi"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}

      {/* Target Keuangan Tab */}
      {activeTab === 'target' && (
        <div className="space-y-3.5">
          {/* Header Action */}
          <div className="flex items-center justify-between bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-4 rounded-2xl shadow-xs">
            <div>
              <h3 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <Target className="w-4 h-4 text-amber-500" />
                Target & Impian Keuangan
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Pantau progres dana darurat, tabungan ibadah, dan tujuan finansial
              </p>
            </div>
            <button
              onClick={() => {
                setEditingTarget(null);
                setTargetTitle('');
                setTargetAmount('');
                setCurrentAmount('');
                setTargetNotes('');
                setIsAddingTarget(!isAddingTarget);
              }}
              className="px-3 py-1.5 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-xl shadow-xs flex items-center gap-1 min-h-[40px]"
            >
              <Plus className="w-4 h-4" />
              Target Baru
            </button>
          </div>

          {/* Form Add / Edit Target */}
          {isAddingTarget && (
            <form
              onSubmit={handleTargetSubmit}
              className="p-4 bg-white dark:bg-slate-900 border border-amber-300 dark:border-amber-800 rounded-2xl shadow-md space-y-3 animate-fade-in"
            >
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                  {editingTarget ? 'Edit Target Keuangan' : 'Tambah Target Keuangan Baru'}
                </h4>
                <button
                  type="button"
                  onClick={() => setIsAddingTarget(false)}
                  className="text-slate-400 hover:text-slate-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Nama Target / Tujuan
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Dana Darurat 6 Bulan, Tabungan Qurban, Beli Laptop..."
                  value={targetTitle}
                  onChange={(e) => setTargetTitle(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Nominal Target (Rp)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    required
                    placeholder="Contoh: 15000000"
                    value={targetAmount}
                    onChange={(e) => setTargetAmount(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-mono font-bold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                  />
                  {targetAmount && !isNaN(parseFloat(targetAmount)) && (
                    <span className="text-[10px] text-amber-600 font-mono font-bold mt-0.5 block truncate">
                      {formatRupiah(parseFloat(targetAmount))}
                    </span>
                  )}
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Saldo Terkumpul Saat Ini
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    placeholder="Contoh: 8853063"
                    value={currentAmount}
                    onChange={(e) => setCurrentAmount(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-mono font-bold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                  />
                  {currentAmount && !isNaN(parseFloat(currentAmount)) && (
                    <span className="text-[10px] text-emerald-600 font-mono font-bold mt-0.5 block truncate">
                      {formatRupiah(parseFloat(currentAmount))}
                    </span>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Simpan di Bank / Dompet
                  </label>
                  <select
                    value={targetWallet}
                    onChange={(e) => setTargetWallet(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                  >
                    {WALLET_OPTIONS.map((w) => (
                      <option key={w.id} value={w.id}>
                        {w.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Target Tercapai (Opsional)
                  </label>
                  <input
                    type="date"
                    value={targetDate}
                    onChange={(e) => setTargetDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Catatan / Motivasi
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Disisihkan dari freelance setiap tanggal 25"
                  value={targetNotes}
                  onChange={(e) => setTargetNotes(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                />
              </div>

              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setIsAddingTarget(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-500"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-xl shadow-xs"
                >
                  {editingTarget ? 'Perbarui Target' : 'Simpan Target'}
                </button>
              </div>
            </form>
          )}

          {/* Target List Cards */}
          {financialTargets.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-8 text-center shadow-xs">
              <Target className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto mb-2" />
              <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Belum ada target keuangan
              </h4>
              <p className="text-[11px] text-slate-400 mt-1 max-w-xs mx-auto">
                Buat target dana darurat atau tabungan impian agar keuangan terarah dan termonitor.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {financialTargets.map((goal) => {
                const percent = Math.min(100, Math.round((goal.currentAmount / goal.targetAmount) * 100));
                const remaining = Math.max(0, goal.targetAmount - goal.currentAmount);

                return (
                  <div
                    key={goal.id}
                    className="p-4 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-xs space-y-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200/60">
                            {goal.category || 'Tabungan'}
                          </span>
                          {goal.wallet && (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200/50">
                              {goal.wallet}
                            </span>
                          )}
                          {percent >= 100 && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" />
                              Tercapai! 🎉
                            </span>
                          )}
                        </div>

                        <h4 className="text-sm font-bold text-slate-900 dark:text-white mt-1">
                          {goal.title}
                        </h4>

                        {goal.notes && (
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                            {goal.notes}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => openEditTarget(goal)}
                          className="p-1.5 text-slate-400 hover:text-amber-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                          title="Edit target"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        {onDeleteFinancialTarget && (
                          <button
                            onClick={() => onDeleteFinancialTarget(goal.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                            title="Hapus target"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Progress Bar & Amounts */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between items-baseline text-xs">
                        <span className="font-mono font-bold text-slate-900 dark:text-white">
                          {formatRupiah(goal.currentAmount)}
                        </span>
                        <span className="text-slate-400 font-mono text-[11px]">
                          Target: {formatRupiah(goal.targetAmount)} ({percent}%)
                        </span>
                      </div>

                      {/* Progress Track */}
                      <div className="w-full h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            percent >= 100
                              ? 'bg-emerald-500'
                              : percent >= 50
                              ? 'bg-amber-500'
                              : 'bg-indigo-500'
                          }`}
                          style={{ width: `${percent}%` }}
                        />
                      </div>

                      <div className="flex items-center justify-between text-[10px] text-slate-400 pt-0.5">
                        <span>
                          {remaining > 0 ? `Kurang ${formatRupiah(remaining)} lagi` : 'Target sudah lunas'}
                        </span>
                        {goal.targetDate && (
                          <span className="flex items-center gap-1 font-mono">
                            <Calendar className="w-3 h-3" />
                            Tenggat: {formatDateIndonesian(goal.targetDate)}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Quick Add Funds button */}
                    <div className="pt-1">
                      <button
                        onClick={() => {
                          setTopUpTarget(goal);
                          setTopUpAmount('');
                        }}
                        className="w-full py-1.5 px-3 rounded-xl bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/40 dark:hover:bg-amber-900/50 text-amber-700 dark:text-amber-300 text-xs font-bold border border-amber-200/80 dark:border-amber-800 flex items-center justify-center gap-1.5 transition-colors"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        Tambah Setoran Tabungan
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Quick Top-up Modal */}
          {topUpTarget && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-sm p-5 space-y-3.5 shadow-2xl animate-fade-in">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                    Tambah Setoran ke {topUpTarget.title}
                  </h4>
                  <button
                    onClick={() => setTopUpTarget(null)}
                    className="p-1 text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <form onSubmit={handleQuickTopUp} className="space-y-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Nominal Setoran (Bebas Angka Keriting)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="any"
                      required
                      placeholder="Contoh: 500000 atau 8853063"
                      value={topUpAmount}
                      onChange={(e) => setTopUpAmount(e.target.value)}
                      className="w-full px-3 py-2 text-sm font-mono font-bold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                      autoFocus
                    />
                    {topUpAmount && !isNaN(parseFloat(topUpAmount)) && (
                      <span className="text-[11px] text-amber-600 font-mono font-bold mt-1 block">
                        + {formatRupiah(parseFloat(topUpAmount))}
                      </span>
                    )}
                  </div>

                  <div className="flex gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setTopUpTarget(null)}
                      className="flex-1 py-2 text-xs font-semibold text-slate-500 bg-slate-100 dark:bg-slate-800 rounded-xl"
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      className="flex-1 py-2 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-xl shadow-xs"
                    >
                      Tambahkan
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
