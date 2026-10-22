import React, { useState } from 'react';
import { Wallet, Plus, Trash2, ArrowDownLeft, ArrowUpRight, DollarSign } from 'lucide-react';
import { TransactionLog } from '../types';
import { formatRupiah, formatDateIndonesian } from '../utils/storage';
import { sound } from '../utils/audio';

interface SimpleFinanceViewProps {
  transactions: TransactionLog[];
  todayDate: string;
  onAddTransaction: (tx: Omit<TransactionLog, 'id'>) => void;
  onDeleteTransaction: (id: string) => void;
  soundEnabled: boolean;
}

export function SimpleFinanceView({
  transactions,
  todayDate,
  onAddTransaction,
  onDeleteTransaction,
  soundEnabled
}: SimpleFinanceViewProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState<'pengeluaran' | 'pemasukan'>('pengeluaran');
  const [category, setCategory] = useState('Makanan');

  const totalExpense = transactions
    .filter((t) => t.type === 'pengeluaran')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalIncome = transactions
    .filter((t) => t.type === 'pemasukan')
    .reduce((sum, t) => sum + t.amount, 0);

  const balance = totalIncome - totalExpense;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !amount) return;

    onAddTransaction({
      date: todayDate,
      title: title.trim(),
      amount: Number(amount),
      type,
      category
    });

    if (soundEnabled) sound.playSuccess();
    setTitle('');
    setAmount('');
    setIsAdding(false);
  };

  return (
    <div className="space-y-4 pb-4">
      {/* Top Balance Summary Card */}
      <div className="p-4 bg-linear-to-br from-amber-500/10 via-slate-50 to-slate-100 dark:from-amber-950/30 dark:via-slate-900 dark:to-slate-900 border border-amber-200/80 dark:border-amber-900/40 rounded-2xl shadow-xs">
        <span className="text-[11px] text-slate-500 dark:text-slate-400 block mb-0.5">
          Sisa Saldo Kas Bersih
        </span>
        <div className="flex items-baseline justify-between mb-3">
          <span
            className={`text-2xl font-bold font-mono tabular-nums ${
              balance >= 0 ? 'text-slate-900 dark:text-white' : 'text-rose-600'
            }`}
          >
            {formatRupiah(balance)}
          </span>
          <button
            onClick={() => setIsAdding(!isAdding)}
            className="px-3 py-1.5 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 rounded-xl shadow-xs flex items-center gap-1 active:scale-95 transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            Catat
          </button>
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-slate-200/60 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center shrink-0">
              <ArrowDownLeft className="w-3.5 h-3.5" />
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block leading-tight">Total Masuk</span>
              <span className="font-semibold font-mono text-emerald-600 dark:text-emerald-400">
                {formatRupiah(totalIncome)}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-rose-100 dark:bg-rose-950/60 text-rose-600 flex items-center justify-center shrink-0">
              <ArrowUpRight className="w-3.5 h-3.5" />
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block leading-tight">Total Keluar</span>
              <span className="font-semibold font-mono text-slate-800 dark:text-slate-200">
                {formatRupiah(totalExpense)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Add Transaction Form (Expandable) */}
      {isAdding && (
        <form
          onSubmit={handleSubmit}
          className="p-4 bg-white dark:bg-slate-900 border border-amber-300 dark:border-amber-800 rounded-2xl shadow-sm space-y-3 animate-fade-in"
        >
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
            <h3 className="text-xs font-bold text-slate-900 dark:text-white">
              Catat Pemasukan / Pengeluaran
            </h3>
            <span className="text-[10px] text-slate-400">Mudah & Cepat</span>
          </div>

          {/* Type Toggle */}
          <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
            <button
              type="button"
              onClick={() => setType('pengeluaran')}
              className={`py-1.5 text-xs font-semibold rounded-lg transition-colors ${
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
              className={`py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                type === 'pemasukan'
                  ? 'bg-white dark:bg-slate-900 text-emerald-600 shadow-xs'
                  : 'text-slate-500'
              }`}
            >
              Pemasukan
            </button>
          </div>

          <div>
            <label className="block text-[11px] font-medium text-slate-700 dark:text-slate-300 mb-1">
              Keterangan
            </label>
            <input
              type="text"
              required
              placeholder="Contoh: Makan siang, bensin, honor..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[11px] font-medium text-slate-700 dark:text-slate-300 mb-1">
                Nominal (Rp)
              </label>
              <input
                type="number"
                min="0"
                step="1000"
                required
                placeholder="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full px-3 py-2 text-xs font-mono tabular-nums bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-slate-700 dark:text-slate-300 mb-1">
                Kategori
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
              >
                <option value="Makanan">Makanan & Minum</option>
                <option value="Kesehatan">Kesehatan & Obat</option>
                <option value="Transport">Transportasi</option>
                <option value="Kebutuhan">Kebutuhan Rumah</option>
                <option value="Pemasukan">Pemasukan / Gaji</option>
                <option value="Lainnya">Lainnya</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="px-3 py-1.5 text-xs text-slate-500 hover:text-slate-700"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 rounded-xl shadow-xs"
            >
              Simpan
            </button>
          </div>
        </form>
      )}

      {/* Transactions List */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 shadow-xs space-y-3">
        <h3 className="text-xs font-bold text-slate-900 dark:text-white">
          Riwayat Transaksi Terkini
        </h3>

        <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
          {transactions.length === 0 ? (
            <p className="text-xs text-slate-400 text-center py-6">Belum ada transaksi tercatat.</p>
          ) : (
            transactions.map((tx) => (
              <div
                key={tx.id}
                className="py-2.5 flex items-center justify-between gap-3 text-xs"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-white ${
                      tx.type === 'pemasukan' ? 'bg-emerald-500' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    {tx.type === 'pemasukan' ? (
                      <ArrowDownLeft className="w-4 h-4" />
                    ) : (
                      <ArrowUpRight className="w-4 h-4 text-slate-600 dark:text-slate-300" />
                    )}
                  </div>
                  <div className="truncate">
                    <span className="font-semibold text-slate-900 dark:text-white block truncate">
                      {tx.title}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {formatDateIndonesian(tx.date)} {tx.category && `· ${tx.category}`}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span
                    className={`font-mono tabular-nums font-bold ${
                      tx.type === 'pemasukan' ? 'text-emerald-600' : 'text-slate-800 dark:text-slate-200'
                    }`}
                  >
                    {tx.type === 'pemasukan' ? '+' : '-'}{formatRupiah(tx.amount)}
                  </span>
                  <button
                    onClick={() => onDeleteTransaction(tx.id)}
                    className="p-1 text-slate-400 hover:text-red-500 rounded transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
