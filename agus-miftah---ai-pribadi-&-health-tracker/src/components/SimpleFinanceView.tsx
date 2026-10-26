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
  Edit2,
  Award,
  Sparkles,
  Info,
  Layers,
  ArrowRight,
  Folder,
  FolderOpen,
  ChevronDown,
  ChevronUp,
  CheckSquare,
  Square,
  ListPlus
} from 'lucide-react';
import { TransactionLog, FinancialGoal, FinancialGoalItem, GoldAsset } from '../types';
import { formatRupiah, formatDateIndonesian } from '../utils/storage';
import { sound } from '../utils/audio';

export const WALLET_OPTIONS = [
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

export const GOLD_TYPES = [
  { id: 'antam', label: 'Emas Antam LM (CertiCard)', defaultBuyback: 1395000, tag: 'Antam Resmi' },
  { id: 'galeri24', label: 'Emas Galeri 24 (Pegadaian)', defaultBuyback: 1385000, tag: 'Galeri 24' },
  { id: 'ubs', label: 'Emas UBS Gold', defaultBuyback: 1380000, tag: 'UBS Gold' },
  { id: 'pegadaian', label: 'Tabungan Emas Pegadaian', defaultBuyback: 1380000, tag: 'Tabungan Emas' },
  { id: 'perhiasan', label: 'Emas Perhiasan', defaultBuyback: 1050000, tag: 'Perhiasan' },
  { id: 'lainnya', label: 'Aset Mulia Lainnya', defaultBuyback: 1380000, tag: 'Logam Mulia' }
] as const;

interface SimpleFinanceViewProps {
  transactions: TransactionLog[];
  financialTargets?: FinancialGoal[];
  goldAssets?: GoldAsset[];
  todayDate: string;
  onAddTransaction: (tx: Omit<TransactionLog, 'id'>) => void;
  onDeleteTransaction: (id: string) => void;
  onAddFinancialTarget?: (target: Omit<FinancialGoal, 'id' | 'createdAt'>) => void;
  onUpdateFinancialTarget?: (target: FinancialGoal) => void;
  onDeleteFinancialTarget?: (id: string) => void;
  onAddGoldAsset?: (asset: Omit<GoldAsset, 'id' | 'createdAt'>) => void;
  onUpdateGoldAsset?: (asset: GoldAsset) => void;
  onDeleteGoldAsset?: (id: string) => void;
  onConsultJarvisGold?: (promptText?: string) => void;
  soundEnabled: boolean;
}

export function SimpleFinanceView({
  transactions,
  financialTargets = [],
  goldAssets = [],
  todayDate,
  onAddTransaction,
  onDeleteTransaction,
  onAddFinancialTarget,
  onUpdateFinancialTarget,
  onDeleteFinancialTarget,
  onAddGoldAsset,
  onUpdateGoldAsset,
  onDeleteGoldAsset,
  onConsultJarvisGold,
  soundEnabled
}: SimpleFinanceViewProps) {
  const [activeTab, setActiveTab] = useState<'transaksi' | 'aset' | 'target'>('transaksi');
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

  // Folder & Sub-items state for Financial Goals
  const [expandedGoalIds, setExpandedGoalIds] = useState<Set<string>>(() => {
    const s = new Set<string>();
    (financialTargets || []).forEach((g) => {
      if (g.items && g.items.length > 0) s.add(g.id);
    });
    return s;
  });
  const [addingItemToGoal, setAddingItemToGoal] = useState<FinancialGoal | null>(null);
  const [editingSubItem, setEditingSubItem] = useState<{ goal: FinancialGoal; item: FinancialGoalItem } | null>(null);
  const [topUpSubItem, setTopUpSubItem] = useState<{ goal: FinancialGoal; item: FinancialGoalItem } | null>(null);
  const [itemTitle, setItemTitle] = useState('');
  const [itemTargetAmount, setItemTargetAmount] = useState('');
  const [itemCurrentAmount, setItemCurrentAmount] = useState('');
  const [itemNotes, setItemNotes] = useState('');

  // Gold Asset state
  const [isAddingGold, setIsAddingGold] = useState(false);
  const [editingGold, setEditingGold] = useState<GoldAsset | null>(null);
  const [goldType, setGoldType] = useState<GoldAsset['type']>('galeri24');
  const [goldTitle, setGoldTitle] = useState('');
  const [goldWeight, setGoldWeight] = useState('');
  const [goldPurchaseDate, setGoldPurchaseDate] = useState(todayDate);
  const [goldPricePerGram, setGoldPricePerGram] = useState('');
  const [goldTotalPurchase, setGoldTotalPurchase] = useState('');
  const [goldCurrentEstPrice, setGoldCurrentEstPrice] = useState('1385000');
  const [goldNotes, setGoldNotes] = useState('');
  const [goldWallet, setGoldWallet] = useState('BCA');

  // Custom Gold Buyback Benchmarks state (persisted in localStorage)
  const [customBenchmarks, setCustomBenchmarks] = useState<Record<string, number>>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('agus_miftah_gold_benchmarks');
        if (saved) return JSON.parse(saved);
      } catch {}
    }
    return {
      antam: 1395000,
      galeri24: 1385000,
      ubs: 1380000,
      pegadaian: 1380000,
      perhiasan: 1050000,
      lainnya: 1380000
    };
  });
  const [isBenchmarkModalOpen, setIsBenchmarkModalOpen] = useState(false);
  const [benchmarkForm, setBenchmarkForm] = useState({
    antam: '1395000',
    galeri24: '1385000',
    ubs: '1380000',
    pegadaian: '1380000'
  });

  // Individual Asset Quick Buyback Edit Modal
  const [editingBuybackAsset, setEditingBuybackAsset] = useState<GoldAsset | null>(null);
  const [quickBuybackPriceInput, setQuickBuybackPriceInput] = useState<string>('');

  // JARVIS AI Analysis Modal state
  const [isJarvisAnalysisOpen, setIsJarvisAnalysisOpen] = useState(false);
  const [selectedAssetForAnalysis, setSelectedAssetForAnalysis] = useState<GoldAsset | null>(null);

  // Helper to determine accurate current buyback price per gram
  const getAssetBuybackPrice = (asset: GoldAsset): number => {
    if (asset.customBuybackPricePerGram && asset.customBuybackPricePerGram > 0) {
      return asset.customBuybackPricePerGram;
    }
    if (asset.currentEstPricePerGram && asset.currentEstPricePerGram > 0) {
      return asset.currentEstPricePerGram;
    }
    return customBenchmarks[asset.type] || (GOLD_TYPES.find((t) => t.id === asset.type)?.defaultBuyback) || 1385000;
  };

  // General Finance Calculations
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

  // Only display banks / e-wallets that actually have a balance (non-zero)
  const activeWallets = WALLET_OPTIONS.filter((w) => {
    const bal = walletBalances[w.id] || 0;
    return bal !== 0;
  });

  // Filtered transactions
  const filteredTransactions = transactions.filter((t) => {
    if (filterWallet === 'all') return true;
    return (t.wallet || 'Tunai') === filterWallet;
  });

  // Gold Asset Portfolio Calculations
  const totalGoldWeight = goldAssets.reduce((sum, g) => sum + (Number(g.weightGrams) || 0), 0);
  const totalGoldModal = goldAssets.reduce((sum, g) => {
    const cost = Number(g.totalPurchasePrice) || ((Number(g.weightGrams) || 0) * (Number(g.purchasePricePerGram) || 0));
    return sum + cost;
  }, 0);

  const totalGoldCurrentVal = goldAssets.reduce((sum, g) => {
    const w = Number(g.weightGrams) || 0;
    const estP = getAssetBuybackPrice(g);
    return sum + (w * estP);
  }, 0);

  const totalGoldProfit = totalGoldCurrentVal - totalGoldModal;
  const totalGoldProfitPct = totalGoldModal > 0 ? (totalGoldProfit / totalGoldModal) * 100 : 0;

  // Transaction submission
  const handleTxSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !amount) return;

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

  // Target submission
  const handleTargetSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetTitle.trim() || !targetAmount) return;

    const cleanTarget = parseFloat(targetAmount.toString().replace(/[^0-9.]/g, ''));
    const cleanCurrent = currentAmount ? parseFloat(currentAmount.toString().replace(/[^0-9.]/g, '')) : 0;

    if (isNaN(cleanTarget) || cleanTarget <= 0) return;

    if (editingTarget && onUpdateFinancialTarget) {
      const existingItems = editingTarget.items || [];
      const itemsTargetSum = existingItems.reduce((s, it) => s + it.targetAmount, 0);
      const itemsCurrentSum = existingItems.reduce((s, it) => s + it.currentAmount, 0);
      const finalTarget = existingItems.length > 0 ? itemsTargetSum : cleanTarget;
      const finalCurrent = existingItems.length > 0 ? itemsCurrentSum : (isNaN(cleanCurrent) ? 0 : cleanCurrent);

      onUpdateFinancialTarget({
        ...editingTarget,
        title: targetTitle.trim(),
        targetAmount: finalTarget,
        currentAmount: finalCurrent,
        category: targetCategory,
        wallet: targetWallet,
        targetDate: targetDate || undefined,
        notes: targetNotes.trim() || undefined,
        items: existingItems,
        isCompleted: finalCurrent >= finalTarget
      });
    } else if (onAddFinancialTarget) {
      onAddFinancialTarget({
        title: targetTitle.trim(),
        targetAmount: cleanTarget,
        currentAmount: isNaN(cleanCurrent) ? 0 : cleanCurrent,
        category: targetCategory,
        wallet: targetWallet,
        targetDate: targetDate || undefined,
        notes: targetNotes.trim() || undefined,
        items: []
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

  // Sub-items (Folder Items) Handlers
  const toggleExpandGoal = (id: string) => {
    setExpandedGoalIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const openAddSubItem = (goal: FinancialGoal) => {
    setAddingItemToGoal(goal);
    setEditingSubItem(null);
    setItemTitle('');
    setItemTargetAmount('');
    setItemCurrentAmount('');
    setItemNotes('');
  };

  const openEditSubItem = (goal: FinancialGoal, item: FinancialGoalItem) => {
    setEditingSubItem({ goal, item });
    setAddingItemToGoal(null);
    setItemTitle(item.title);
    setItemTargetAmount(item.targetAmount.toString());
    setItemCurrentAmount(item.currentAmount.toString());
    setItemNotes(item.notes || '');
  };

  const handleSubItemFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemTitle.trim() || !onUpdateFinancialTarget) return;

    const tAmt = parseFloat(itemTargetAmount.toString().replace(/[^0-9.]/g, ''));
    const cAmt = itemCurrentAmount ? parseFloat(itemCurrentAmount.toString().replace(/[^0-9.]/g, '')) : 0;
    if (isNaN(tAmt) || tAmt <= 0) return;

    if (editingSubItem) {
      const { goal, item } = editingSubItem;
      const updatedItems = (goal.items || []).map((it) => {
        if (it.id !== item.id) return it;
        const cur = isNaN(cAmt) ? 0 : cAmt;
        return {
          ...it,
          title: itemTitle.trim(),
          targetAmount: tAmt,
          currentAmount: cur,
          isCompleted: cur >= tAmt,
          notes: itemNotes.trim() || undefined
        };
      });

      const newTargetTotal = updatedItems.reduce((s, it) => s + it.targetAmount, 0);
      const newCurrentTotal = updatedItems.reduce((s, it) => s + it.currentAmount, 0);

      onUpdateFinancialTarget({
        ...goal,
        targetAmount: newTargetTotal,
        currentAmount: newCurrentTotal,
        items: updatedItems,
        isCompleted: newCurrentTotal >= newTargetTotal
      });
      setEditingSubItem(null);
    } else if (addingItemToGoal) {
      const cur = isNaN(cAmt) ? 0 : cAmt;
      const newItem: FinancialGoalItem = {
        id: `item-${Date.now()}`,
        title: itemTitle.trim(),
        targetAmount: tAmt,
        currentAmount: cur,
        isCompleted: cur >= tAmt,
        notes: itemNotes.trim() || undefined
      };

      const updatedItems = [...(addingItemToGoal.items || []), newItem];
      const newTargetTotal = updatedItems.reduce((s, it) => s + it.targetAmount, 0);
      const newCurrentTotal = updatedItems.reduce((s, it) => s + it.currentAmount, 0);

      onUpdateFinancialTarget({
        ...addingItemToGoal,
        targetAmount: newTargetTotal,
        currentAmount: newCurrentTotal,
        items: updatedItems,
        isCompleted: newCurrentTotal >= newTargetTotal
      });

      setExpandedGoalIds((prev) => new Set(prev).add(addingItemToGoal.id));
      setAddingItemToGoal(null);
    }

    if (soundEnabled) sound.playSuccess();
    setItemTitle('');
    setItemTargetAmount('');
    setItemCurrentAmount('');
    setItemNotes('');
  };

  const handleToggleSubItemComplete = (goal: FinancialGoal, itemId: string) => {
    if (!onUpdateFinancialTarget) return;
    const updatedItems = (goal.items || []).map((it) => {
      if (it.id !== itemId) return it;
      const nextCompleted = !it.isCompleted;
      return {
        ...it,
        isCompleted: nextCompleted,
        currentAmount: nextCompleted ? Math.max(it.currentAmount, it.targetAmount) : it.currentAmount
      };
    });

    const newTargetTotal = updatedItems.reduce((s, it) => s + it.targetAmount, 0);
    const newCurrentTotal = updatedItems.reduce((s, it) => s + it.currentAmount, 0);

    onUpdateFinancialTarget({
      ...goal,
      targetAmount: newTargetTotal,
      currentAmount: newCurrentTotal,
      items: updatedItems,
      isCompleted: newCurrentTotal >= newTargetTotal
    });

    if (soundEnabled) sound.playSuccess();
  };

  const handleDeleteSubItem = (goal: FinancialGoal, itemId: string) => {
    if (!onUpdateFinancialTarget) return;
    const updatedItems = (goal.items || []).filter((it) => it.id !== itemId);
    const newTargetTotal = updatedItems.length > 0
      ? updatedItems.reduce((s, it) => s + it.targetAmount, 0)
      : goal.targetAmount;
    const newCurrentTotal = updatedItems.length > 0
      ? updatedItems.reduce((s, it) => s + it.currentAmount, 0)
      : goal.currentAmount;

    onUpdateFinancialTarget({
      ...goal,
      targetAmount: newTargetTotal,
      currentAmount: newCurrentTotal,
      items: updatedItems,
      isCompleted: newCurrentTotal >= newTargetTotal
    });

    if (soundEnabled) sound.playBreathCue(true);
  };

  const handleQuickTopUpSubItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!topUpSubItem || !topUpAmount || !onUpdateFinancialTarget) return;

    const delta = parseFloat(topUpAmount.toString().replace(/[^0-9.]/g, ''));
    if (isNaN(delta) || delta <= 0) return;

    const { goal, item } = topUpSubItem;
    const updatedItems = (goal.items || []).map((it) => {
      if (it.id !== item.id) return it;
      const newCurrent = it.currentAmount + delta;
      return {
        ...it,
        currentAmount: newCurrent,
        isCompleted: newCurrent >= it.targetAmount
      };
    });

    const newTargetTotal = updatedItems.reduce((s, it) => s + it.targetAmount, 0);
    const newCurrentTotal = updatedItems.reduce((s, it) => s + it.currentAmount, 0);

    onUpdateFinancialTarget({
      ...goal,
      targetAmount: newTargetTotal,
      currentAmount: newCurrentTotal,
      items: updatedItems,
      isCompleted: newCurrentTotal >= newTargetTotal
    });

    if (soundEnabled) sound.playSuccess();
    setTopUpSubItem(null);
    setTopUpAmount('');
  };

  // Gold Asset Handlers
  const openAddGold = () => {
    setEditingGold(null);
    setGoldType('galeri24');
    setGoldTitle('Emas Galeri 24');
    setGoldWeight('');
    setGoldPurchaseDate(todayDate);
    setGoldPricePerGram('');
    setGoldTotalPurchase('');
    setGoldCurrentEstPrice(String(customBenchmarks.galeri24 || 1385000));
    setGoldNotes('');
    setGoldWallet('BCA');
    setIsAddingGold(true);
  };

  const openEditGold = (asset: GoldAsset) => {
    setEditingGold(asset);
    setGoldType(asset.type);
    setGoldTitle(asset.title);
    setGoldWeight(asset.weightGrams.toString());
    setGoldPurchaseDate(asset.purchaseDate);
    setGoldPricePerGram(asset.purchasePricePerGram.toString());
    setGoldTotalPurchase(asset.totalPurchasePrice.toString());
    const estP = asset.customBuybackPricePerGram || asset.currentEstPricePerGram || customBenchmarks[asset.type] || 1385000;
    setGoldCurrentEstPrice(estP.toString());
    setGoldNotes(asset.notes || '');
    setGoldWallet(asset.wallet || 'BCA');
    setIsAddingGold(true);
  };

  const handleGoldTypeSelect = (selectedType: GoldAsset['type']) => {
    setGoldType(selectedType);
    const est = customBenchmarks[selectedType] || (GOLD_TYPES.find((t) => t.id === selectedType)?.defaultBuyback) || 1385000;
    setGoldCurrentEstPrice(est.toString());
    if (!editingGold) {
      const found = GOLD_TYPES.find((t) => t.id === selectedType);
      const typeLabel = found ? (found.id === 'antam' ? 'Emas Antam LM' : found.id === 'galeri24' ? 'Emas Galeri 24' : found.id === 'ubs' ? 'Emas UBS' : found.label) : 'Emas';
      const weightSuffix = goldWeight ? ` ${goldWeight}g` : '';
      setGoldTitle(`${typeLabel}${weightSuffix}`);
    }
  };

  const handleGoldWeightChange = (val: string) => {
    setGoldWeight(val);
    const w = parseFloat(val);
    if (!isNaN(w) && w > 0) {
      const p = parseFloat(goldPricePerGram);
      if (!isNaN(p) && p > 0) {
        setGoldTotalPurchase(Math.round(w * p).toString());
      }
      if (!editingGold) {
        const found = GOLD_TYPES.find((t) => t.id === goldType);
        const typeLabel = found ? (found.id === 'antam' ? 'Emas Antam LM' : found.id === 'galeri24' ? 'Emas Galeri 24' : found.id === 'ubs' ? 'Emas UBS' : found.label) : 'Emas';
        setGoldTitle(`${typeLabel} ${val} Gram`);
      }
    }
  };

  const handleGoldPricePerGramChange = (val: string) => {
    setGoldPricePerGram(val);
    const p = parseFloat(val);
    const w = parseFloat(goldWeight);
    if (!isNaN(p) && !isNaN(w) && w > 0) {
      setGoldTotalPurchase(Math.round(w * p).toString());
    }
  };

  const handleGoldTotalChange = (val: string) => {
    setGoldTotalPurchase(val);
    const tot = parseFloat(val);
    const w = parseFloat(goldWeight);
    if (!isNaN(tot) && !isNaN(w) && w > 0) {
      setGoldPricePerGram(Math.round(tot / w).toString());
    }
  };

  const handleGoldSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const w = parseFloat(goldWeight);
    if (isNaN(w) || w <= 0) return;

    let pGram = parseFloat(goldPricePerGram);
    let totCost = parseFloat(goldTotalPurchase);

    if (isNaN(pGram) && !isNaN(totCost)) {
      pGram = Math.round(totCost / w);
    } else if (isNaN(totCost) && !isNaN(pGram)) {
      totCost = Math.round(w * pGram);
    }

    if (isNaN(pGram) || isNaN(totCost) || totCost <= 0) return;

    const estCurrentP = parseFloat(goldCurrentEstPrice) || customBenchmarks[goldType] || 1385000;

    const assetData = {
      type: goldType,
      title: goldTitle.trim() || `Emas ${w}g`,
      weightGrams: w,
      purchaseDate: goldPurchaseDate || todayDate,
      purchasePricePerGram: pGram,
      totalPurchasePrice: totCost,
      currentEstPricePerGram: estCurrentP,
      customBuybackPricePerGram: estCurrentP,
      notes: goldNotes.trim() || undefined,
      wallet: goldWallet
    };

    if (editingGold && onUpdateGoldAsset) {
      onUpdateGoldAsset({
        ...editingGold,
        ...assetData
      });
    } else if (onAddGoldAsset) {
      onAddGoldAsset(assetData);
    }

    if (soundEnabled) sound.playSuccess();
    setIsAddingGold(false);
    setEditingGold(null);
  };

  const handleQuickSaveBuybackPrice = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBuybackAsset || !onUpdateGoldAsset) return;
    const cleanPrice = parseFloat(quickBuybackPriceInput.toString().replace(/[^0-9.]/g, ''));
    if (isNaN(cleanPrice) || cleanPrice <= 0) return;

    onUpdateGoldAsset({
      ...editingBuybackAsset,
      customBuybackPricePerGram: cleanPrice,
      currentEstPricePerGram: cleanPrice
    });

    if (soundEnabled) sound.playSuccess();
    setEditingBuybackAsset(null);
    setQuickBuybackPriceInput('');
  };

  const handleOpenBenchmarkModal = () => {
    setBenchmarkForm({
      antam: String(customBenchmarks.antam || 1395000),
      galeri24: String(customBenchmarks.galeri24 || 1385000),
      ubs: String(customBenchmarks.ubs || 1380000),
      pegadaian: String(customBenchmarks.pegadaian || 1380000)
    });
    setIsBenchmarkModalOpen(true);
  };

  const handleSaveBenchmarks = (applyToAllAssets: boolean) => {
    const nextBenchmarks: Record<string, number> = {
      ...customBenchmarks,
      antam: parseFloat(benchmarkForm.antam) || 1395000,
      galeri24: parseFloat(benchmarkForm.galeri24) || 1385000,
      ubs: parseFloat(benchmarkForm.ubs) || 1380000,
      pegadaian: parseFloat(benchmarkForm.pegadaian) || 1380000
    };
    setCustomBenchmarks(nextBenchmarks);
    try {
      localStorage.setItem('agus_miftah_gold_benchmarks', JSON.stringify(nextBenchmarks));
    } catch {}

    if (applyToAllAssets && onUpdateGoldAsset) {
      goldAssets.forEach((asset) => {
        const newRate = nextBenchmarks[asset.type] || nextBenchmarks.galeri24;
        onUpdateGoldAsset({
          ...asset,
          customBuybackPricePerGram: newRate,
          currentEstPricePerGram: newRate
        });
      });
    }

    if (soundEnabled) sound.playSuccess();
    setIsBenchmarkModalOpen(false);
  };

  const triggerJarvisAnalysis = (asset?: GoldAsset) => {
    setSelectedAssetForAnalysis(asset || null);
    setIsJarvisAnalysisOpen(true);
    if (soundEnabled) sound.playBreathCue(true);
  };

  return (
    <div className="space-y-4 pb-4">
      {/* Top Navigation Tabs: Transaksi vs Aset Emas vs Target Keuangan */}
      <div className="flex bg-slate-100 dark:bg-slate-800/80 p-1 rounded-2xl border border-slate-200/80 dark:border-slate-800 gap-1">
        <button
          onClick={() => setActiveTab('transaksi')}
          className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
            activeTab === 'transaksi'
              ? 'bg-white dark:bg-slate-900 text-amber-600 dark:text-amber-400 shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Wallet className="w-4 h-4 shrink-0" />
          <span>Transaksi</span>
        </button>

        <button
          onClick={() => setActiveTab('aset')}
          className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
            activeTab === 'aset'
              ? 'bg-white dark:bg-slate-900 text-amber-600 dark:text-amber-400 shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Award className="w-4 h-4 shrink-0 text-amber-500" />
          <span>Aset & Emas</span>
          {goldAssets.length > 0 && (
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 font-mono">
              {goldAssets.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('target')}
          className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
            activeTab === 'target'
              ? 'bg-white dark:bg-slate-900 text-amber-600 dark:text-amber-400 shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Target className="w-4 h-4 shrink-0" />
          <span>Target</span>
          {financialTargets.length > 0 && (
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-mono">
              {financialTargets.length}
            </span>
          )}
        </button>
      </div>

      {/* ===================== TAB 1: TRANSAKSI & SALDO DOMPET ===================== */}
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

          {/* Dompet & Bank Breakdown (Only Shows Accounts with Positive/Non-Zero Balance) */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-3.5 shadow-xs">
            <div className="flex items-center justify-between mb-2.5">
              <h3 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <Building2 className="w-4 h-4 text-amber-500" />
                Saldo Per Bank & Dompet (E-Wallet)
              </h3>
              <span className="text-[10px] text-slate-400">Hanya menampilkan yang ada saldo</span>
            </div>

            {activeWallets.length === 0 ? (
              <div className="py-3 px-3 text-center bg-slate-50/60 dark:bg-slate-850/60 rounded-xl border border-dashed border-slate-200 dark:border-slate-800">
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Belum ada saldo terisi pada rekening bank atau e-wallet. Rekening otomatis muncul saat ada saldo.
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
                          ? 'border-amber-500 bg-amber-50/40 dark:bg-amber-950/30 ring-1 ring-amber-500/30'
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

          {/* Quick Gold Investment Promotion Banner */}
          <div
            onClick={() => setActiveTab('aset')}
            className="cursor-pointer p-3 bg-linear-to-r from-amber-500/10 via-yellow-500/10 to-amber-600/10 dark:from-amber-950/40 dark:to-yellow-950/30 border border-amber-300/80 dark:border-amber-800/60 rounded-2xl flex items-center justify-between gap-3 hover:border-amber-400 transition-all"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-xs">
                <Award className="w-4 h-4" />
              </div>
              <div className="truncate">
                <span className="text-xs font-bold text-amber-900 dark:text-amber-200 block truncate">
                  Portofolio Aset & Emas (Galeri 24, Antam LM, UBS)
                </span>
                <span className="text-[10px] text-amber-700/80 dark:text-amber-400/80">
                  {goldAssets.length > 0
                    ? `${totalGoldWeight.toFixed(1)} gram tersimpan · Untung est: +${totalGoldProfitPct.toFixed(1)}%`
                    : 'Catat aset emas & minta JARVIS analisis untung rugi jika dijual'}
                </span>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
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

              {/* Nominal & Live Preview */}
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

      {/* ===================== TAB 2: ASET & EMAS (LOGAM MULIA) ===================== */}
      {activeTab === 'aset' && (
        <div className="space-y-3.5 animate-fade-in">
          {/* Top Portfolio Gold Summary Card */}
          <div className="p-4 bg-linear-to-br from-amber-500/15 via-yellow-500/10 to-slate-900/5 dark:from-amber-950/40 dark:via-yellow-950/20 dark:to-slate-900 border border-amber-300/80 dark:border-amber-800/60 rounded-2xl shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-xs">
                  <Award className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-slate-900 dark:text-white">
                    Portofolio Emas & Logam Mulia
                  </h3>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400">
                    Galeri 24, Antam LM, UBS, Tabungan Pegadaian
                  </span>
                </div>
              </div>

              <button
                onClick={openAddGold}
                className="px-3 py-1.5 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 active:scale-95 rounded-xl shadow-xs flex items-center gap-1.5 transition-all min-h-[38px]"
              >
                <Plus className="w-4 h-4" />
                Tambah Emas
              </button>
            </div>

            {/* Quick Metrics Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
              <div className="p-2.5 rounded-xl bg-white/80 dark:bg-slate-850/80 border border-amber-200/50 dark:border-slate-800">
                <span className="text-[10px] text-slate-400 block font-medium">Total Berat Emas</span>
                <span className="text-base font-bold font-mono text-amber-700 dark:text-amber-300">
                  {totalGoldWeight.toFixed(2)} gr
                </span>
              </div>

              <div className="p-2.5 rounded-xl bg-white/80 dark:bg-slate-850/80 border border-amber-200/50 dark:border-slate-800">
                <span className="text-[10px] text-slate-400 block font-medium">Total Modal Beli</span>
                <span className="text-base font-bold font-mono text-slate-800 dark:text-slate-200 truncate block">
                  {formatRupiah(totalGoldModal)}
                </span>
              </div>

              <div className="p-2.5 rounded-xl bg-white/80 dark:bg-slate-850/80 border border-amber-200/50 dark:border-slate-800">
                <span className="text-[10px] text-slate-400 block font-medium">Estimasi Buyback</span>
                <span className="text-base font-bold font-mono text-slate-900 dark:text-white truncate block">
                  {formatRupiah(totalGoldCurrentVal)}
                </span>
              </div>

              <div className="p-2.5 rounded-xl bg-white/80 dark:bg-slate-850/80 border border-amber-200/50 dark:border-slate-800">
                <span className="text-[10px] text-slate-400 block font-medium">Potensi Keuntungan</span>
                <span
                  className={`text-base font-bold font-mono truncate block ${
                    totalGoldProfit >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600'
                  }`}
                >
                  {totalGoldProfit >= 0 ? '+' : ''}{formatRupiah(totalGoldProfit)}
                </span>
                <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                  ({totalGoldProfitPct >= 0 ? '+' : ''}{totalGoldProfitPct.toFixed(1)}%)
                </span>
              </div>
            </div>

            {/* AI Action Banner: Analisis Jual dengan JARVIS */}
            <div className="pt-2 border-t border-amber-200/60 dark:border-amber-900/40 flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-1.5 text-xs text-amber-900 dark:text-amber-200">
                <Sparkles className="w-4 h-4 text-amber-500 animate-pulse" />
                <span className="font-semibold text-[11px]">
                  Mau tahu untung/rugi jika dijual hari ini?
                </span>
              </div>
              <button
                onClick={() => triggerJarvisAnalysis()}
                className="px-3.5 py-1.5 text-xs font-bold text-amber-950 dark:text-white bg-linear-to-r from-amber-300 via-amber-400 to-yellow-400 dark:from-amber-600 dark:to-yellow-600 hover:opacity-95 active:scale-95 rounded-xl shadow-xs flex items-center gap-1.5 transition-all"
              >
                <Sparkles className="w-3.5 h-3.5" />
                ✨ Analisis Jual dengan JARVIS
              </button>
            </div>
          </div>

          {/* Market Buyback Benchmark Reference with manual edit button */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-3 shadow-xs">
            <div className="flex items-center justify-between mb-2 flex-wrap gap-1.5">
              <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                <TrendingUp className="w-3.5 h-3.5 text-amber-500" />
                Acuan Estimasi Buyback Hari Ini (Per Gram)
              </span>
              <button
                type="button"
                onClick={handleOpenBenchmarkModal}
                className="px-2.5 py-1 text-[10px] font-bold text-amber-800 dark:text-amber-300 bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/60 rounded-lg border border-amber-200/80 dark:border-amber-800 flex items-center gap-1 transition-all"
              >
                <Edit2 className="w-3 h-3" />
                Edit Acuan Pasar
              </button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                <span className="text-[10px] text-slate-400 block">Antam LM CertiCard</span>
                <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                  {formatRupiah(customBenchmarks.antam || 1395000)}
                </span>
              </div>
              <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                <span className="text-[10px] text-slate-400 block">Galeri 24 Pegadaian</span>
                <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                  {formatRupiah(customBenchmarks.galeri24 || 1385000)}
                </span>
              </div>
              <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                <span className="text-[10px] text-slate-400 block">Emas UBS Gold</span>
                <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                  {formatRupiah(customBenchmarks.ubs || 1380000)}
                </span>
              </div>
              <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                <span className="text-[10px] text-slate-400 block">Tabungan Pegadaian</span>
                <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                  {formatRupiah(customBenchmarks.pegadaian || 1380000)}
                </span>
              </div>
            </div>
          </div>

          {/* Add / Edit Gold Modal Form */}
          {isAddingGold && (
            <form
              onSubmit={handleGoldSubmit}
              className="p-4 bg-white dark:bg-slate-900 border border-amber-300 dark:border-amber-800 rounded-2xl shadow-lg space-y-3.5 animate-fade-in"
            >
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <Award className="w-4 h-4 text-amber-500" />
                  {editingGold ? 'Edit Catatan Aset Emas' : 'Catat Aset Emas Baru'}
                </h4>
                <button
                  type="button"
                  onClick={() => setIsAddingGold(false)}
                  className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Gold Type Selection */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Pilihan Tipe / Merek Emas
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                  {GOLD_TYPES.map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => handleGoldTypeSelect(t.id)}
                      className={`p-2 rounded-xl border text-left text-xs transition-all ${
                        goldType === t.id
                          ? 'border-amber-500 bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200 font-bold ring-1 ring-amber-500/30'
                          : 'border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/40 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                      }`}
                    >
                      <span className="block text-[11px] truncate">{t.label}</span>
                      <span className="text-[10px] text-amber-600 dark:text-amber-400 block font-mono">
                        Ref: ~{formatRupiah(t.defaultBuyback)}/g
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Title & Weight */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Nama / Keterangan Emas
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Emas Galeri 24 10 Gram"
                    value={goldTitle}
                    onChange={(e) => setGoldTitle(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                      Berat (Gram)
                    </label>
                    {/* Quick Gram Presets */}
                    <div className="flex gap-1">
                      {[1, 2, 5, 10, 25].map((g) => (
                        <button
                          key={g}
                          type="button"
                          onClick={() => handleGoldWeightChange(g.toString())}
                          className="px-1.5 py-0.5 rounded-md text-[9px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-amber-100 dark:hover:bg-amber-950"
                        >
                          {g}g
                        </button>
                      ))}
                    </div>
                  </div>
                  <input
                    type="number"
                    step="any"
                    min="0.001"
                    required
                    placeholder="Contoh: 10 atau 5.5"
                    value={goldWeight}
                    onChange={(e) => handleGoldWeightChange(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-mono font-bold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              {/* Purchase Date & Wallet */}
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Tanggal Beli
                  </label>
                  <input
                    type="date"
                    required
                    value={goldPurchaseDate}
                    onChange={(e) => setGoldPurchaseDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Rekening Pembelian
                  </label>
                  <select
                    value={goldWallet}
                    onChange={(e) => setGoldWallet(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                  >
                    {WALLET_OPTIONS.map((w) => (
                      <option key={w.id} value={w.id}>
                        {w.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Purchase Price: Price Per Gram vs Total Modal */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Harga Beli per Gram (Rp)
                  </label>
                  <input
                    type="number"
                    step="any"
                    min="0"
                    placeholder="Contoh: 1190000"
                    value={goldPricePerGram}
                    onChange={(e) => handleGoldPricePerGramChange(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-mono font-bold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                  />
                  {goldPricePerGram && !isNaN(parseFloat(goldPricePerGram)) && (
                    <span className="text-[10px] text-slate-500 font-mono block mt-0.5 truncate">
                      {formatRupiah(parseFloat(goldPricePerGram))} / gram
                    </span>
                  )}
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Total Modal Pembelian (Rp)
                  </label>
                  <input
                    type="number"
                    step="any"
                    min="0"
                    placeholder="Contoh: 11900000"
                    value={goldTotalPurchase}
                    onChange={(e) => handleGoldTotalChange(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-mono font-bold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                  />
                  {goldTotalPurchase && !isNaN(parseFloat(goldTotalPurchase)) && (
                    <span className="text-[10px] text-amber-600 font-mono font-bold block mt-0.5 truncate">
                      Total: {formatRupiah(parseFloat(goldTotalPurchase))}
                    </span>
                  )}
                </div>
              </div>

              {/* Estimated Current Buyback Price */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                    Estimasi Harga Buyback Pasar Saat Ini (per Gram)
                  </label>
                  <span className="text-[10px] text-slate-400">Untuk hitung untung rugi</span>
                </div>
                <input
                  type="number"
                  step="any"
                  min="0"
                  placeholder="Contoh: 1495000"
                  value={goldCurrentEstPrice}
                  onChange={(e) => setGoldCurrentEstPrice(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-mono font-bold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                />
              </div>

              {/* Notes */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Catatan / Lokasi Simpan / No. Sertifikat
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Simpan di brankas rumah, sertifikat CertiCard utuh..."
                  value={goldNotes}
                  onChange={(e) => setGoldNotes(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                />
              </div>

              <div className="flex justify-end gap-2 pt-1 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddingGold(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-500"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-xl shadow-xs"
                >
                  {editingGold ? 'Perbarui Aset Emas' : 'Simpan Aset Emas'}
                </button>
              </div>
            </form>
          )}

          {/* List of Gold Assets */}
          {goldAssets.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-8 text-center shadow-xs space-y-2">
              <Award className="w-12 h-12 text-amber-400 mx-auto" />
              <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Belum ada aset emas yang dicatat
              </h4>
              <p className="text-[11px] text-slate-400 max-w-xs mx-auto">
                Catat emas Galeri 24, Antam LM, atau UBS kamu di sini. JARVIS akan memantau kenaikan harga dan menghitung keuntungan jika dijual.
              </p>
              <button
                onClick={openAddGold}
                className="mt-2 px-4 py-2 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-xl shadow-xs inline-flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                Catat Emas Pertama
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {goldAssets.map((asset) => {
                const w = Number(asset.weightGrams) || 0;
                const modal = Number(asset.totalPurchasePrice) || (w * (Number(asset.purchasePricePerGram) || 0));
                const estPrice = getAssetBuybackPrice(asset);
                const estVal = w * estPrice;
                const profit = estVal - modal;
                const profitPct = modal > 0 ? (profit / modal) * 100 : 0;

                const foundType = GOLD_TYPES.find((t) => t.id === asset.type);
                const brandLabel = foundType ? foundType.tag : 'Logam Mulia';

                return (
                  <div
                    key={asset.id}
                    className="p-4 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-xs space-y-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 border border-amber-300/60">
                            {brandLabel}
                          </span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                            {w} Gram
                          </span>
                          {asset.wallet && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded-sm bg-slate-100 dark:bg-slate-800 text-slate-500">
                              Beli via: {asset.wallet}
                            </span>
                          )}
                        </div>

                        <h4 className="text-sm font-bold text-slate-900 dark:text-white mt-1.5">
                          {asset.title}
                        </h4>

                        {asset.notes && (
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                            {asset.notes}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => openEditGold(asset)}
                          className="p-1.5 text-slate-400 hover:text-amber-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                          title="Edit aset"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        {onDeleteGoldAsset && (
                          <button
                            onClick={() => onDeleteGoldAsset(asset.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                            title="Hapus aset"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Financial Comparison: Modal Beli vs Estimasi Jual Buyback */}
                    <div className="grid grid-cols-2 gap-2 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-850/60 border border-slate-100 dark:border-slate-800 text-xs">
                      <div>
                        <span className="text-[10px] text-slate-400 block">Modal Pembelian</span>
                        <span className="font-mono font-bold text-slate-800 dark:text-slate-200 block truncate">
                          {formatRupiah(modal)}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          @{formatRupiah(asset.purchasePricePerGram)}/g
                        </span>
                        <span className="text-[9px] text-slate-400 block mt-0.5">
                          Beli: {formatDateIndonesian(asset.purchaseDate)}
                        </span>
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-0.5">
                          <span className="text-[10px] text-slate-400 block">Estimasi Jual Buyback</span>
                          <button
                            type="button"
                            onClick={() => {
                              setEditingBuybackAsset(asset);
                              setQuickBuybackPriceInput(String(estPrice));
                            }}
                            className="text-[10px] font-bold text-amber-700 dark:text-amber-300 hover:text-amber-800 bg-amber-100/80 hover:bg-amber-200/80 dark:bg-amber-950/80 px-1.5 py-0.5 rounded flex items-center gap-0.5 transition-colors"
                            title="Edit harga buyback keping ini"
                          >
                            <Edit2 className="w-2.5 h-2.5" />
                            Ubah
                          </button>
                        </div>
                        <span className="font-mono font-bold text-slate-900 dark:text-white block truncate">
                          {formatRupiah(estVal)}
                        </span>
                        <div className="flex items-center gap-1 flex-wrap">
                          <span className="text-[10px] text-slate-400 font-mono">
                            @{formatRupiah(estPrice)}/g
                          </span>
                          {asset.customBuybackPricePerGram && (
                            <span className="text-[9px] px-1 py-0.2 rounded bg-amber-200/80 dark:bg-amber-900/80 text-amber-900 dark:text-amber-200 font-bold">
                              Kustom
                            </span>
                          )}
                        </div>
                        <div className="mt-0.5 flex items-center gap-1 font-mono font-bold text-[10px]">
                          <span className={profit >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600'}>
                            {profit >= 0 ? '+' : ''}{formatRupiah(profit)} ({profitPct >= 0 ? '+' : ''}{profitPct.toFixed(1)}%)
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* 1-Tap Individual JARVIS Analysis */}
                    <button
                      onClick={() => triggerJarvisAnalysis(asset)}
                      className="w-full py-1.5 px-3 rounded-xl bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/40 dark:hover:bg-amber-900/50 text-amber-800 dark:text-amber-300 text-xs font-bold border border-amber-200/80 dark:border-amber-800 flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                      Analisis Untung Rugi Jual Keping Ini
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ===================== TAB 3: TARGET KEUANGAN ===================== */}
      {activeTab === 'target' && (
        <div className="space-y-3.5 animate-fade-in">
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
                const hasItems = Array.isArray(goal.items) && goal.items.length > 0;
                const itemsTargetTotal = hasItems
                  ? goal.items!.reduce((sum, it) => sum + (Number(it.targetAmount) || 0), 0)
                  : goal.targetAmount;
                const itemsCurrentTotal = hasItems
                  ? goal.items!.reduce((sum, it) => sum + (Number(it.currentAmount) || 0), 0)
                  : goal.currentAmount;

                const displayTargetAmount = hasItems ? itemsTargetTotal : goal.targetAmount;
                const displayCurrentAmount = hasItems ? itemsCurrentTotal : goal.currentAmount;
                const percent = displayTargetAmount > 0
                  ? Math.min(100, Math.round((displayCurrentAmount / displayTargetAmount) * 100))
                  : 0;
                const remaining = Math.max(0, displayTargetAmount - displayCurrentAmount);
                const isExpanded = expandedGoalIds.has(goal.id);
                const completedCount = hasItems
                  ? goal.items!.filter((it) => it.isCompleted || it.currentAmount >= it.targetAmount).length
                  : 0;

                return (
                  <div
                    key={goal.id}
                    className="p-4 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-xs space-y-3 transition-all"
                  >
                    {/* Goal Card Header */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {hasItems ? (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 dark:bg-amber-950/80 dark:text-amber-300 border border-amber-300/80 flex items-center gap-1">
                              <Folder className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                              Folder Target ({goal.items!.length} item)
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200/60 flex items-center gap-1">
                              <Target className="w-3 h-3 text-amber-500" />
                              {goal.category || 'Tabungan'}
                            </span>
                          )}

                          {goal.wallet && (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200/50">
                              {goal.wallet}
                            </span>
                          )}

                          {hasItems && (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
                              {completedCount}/{goal.items!.length} item lunas
                            </span>
                          )}

                          {percent >= 100 && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-300 flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" />
                              Tercapai! 🎉
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2 mt-1.5">
                          <h4 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                            {goal.title}
                          </h4>
                          <button
                            type="button"
                            onClick={() => toggleExpandGoal(goal.id)}
                            className="p-1 text-slate-400 hover:text-amber-600 dark:hover:text-amber-400 rounded-lg transition-colors flex items-center gap-0.5 text-[10px] font-semibold"
                            title={isExpanded ? 'Sembunyikan rincian' : 'Buka rincian item'}
                          >
                            {isExpanded ? (
                              <ChevronUp className="w-3.5 h-3.5 text-amber-500" />
                            ) : (
                              <ChevronDown className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>

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

                    {/* Progress Bar & Amounts (Reflects total folder calculation) */}
                    <div className="space-y-1.5 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-850/60 border border-slate-100 dark:border-slate-800">
                      <div className="flex justify-between items-baseline text-xs">
                        <div>
                          <span className="text-[10px] text-slate-400 block font-medium">Terkumpul Total</span>
                          <span className="font-mono font-bold text-slate-900 dark:text-white text-sm">
                            {formatRupiah(displayCurrentAmount)}
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="text-[10px] text-slate-400 block font-medium">Target Total</span>
                          <span className="text-slate-600 dark:text-slate-300 font-mono font-bold text-xs">
                            {formatRupiah(displayTargetAmount)} ({percent}%)
                          </span>
                        </div>
                      </div>

                      {/* Progress Track */}
                      <div className="w-full h-2.5 bg-slate-200/70 dark:bg-slate-800 rounded-full overflow-hidden">
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
                          {remaining > 0 ? `Sisa kurang ${formatRupiah(remaining)}` : 'Semua target telah lunas 🎉'}
                        </span>
                        {goal.targetDate && (
                          <span className="flex items-center gap-1 font-mono">
                            <Calendar className="w-3 h-3" />
                            Tenggat: {formatDateIndonesian(goal.targetDate)}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Sub-items (Folder Content) */}
                    {isExpanded && (
                      <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2.5 animate-fade-in">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                            <ListPlus className="w-3.5 h-3.5 text-amber-500" />
                            Rincian Item Kebutuhan {hasItems ? `(${goal.items!.length})` : ''}
                          </span>
                          <button
                            type="button"
                            onClick={() => openAddSubItem(goal)}
                            className="px-2.5 py-1 text-[10px] font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-lg shadow-xs flex items-center gap-1 transition-all"
                          >
                            <Plus className="w-3 h-3" />
                            Tambah Item
                          </button>
                        </div>

                        {/* List of sub-items */}
                        {hasItems ? (
                          <div className="space-y-2">
                            {goal.items!.map((it) => {
                              const itTarget = Number(it.targetAmount) || 0;
                              const itCurrent = Number(it.currentAmount) || 0;
                              const itPct = itTarget > 0 ? Math.min(100, Math.round((itCurrent / itTarget) * 100)) : 0;
                              const itDone = it.isCompleted || itCurrent >= itTarget;

                              return (
                                <div
                                  key={it.id}
                                  className={`p-2.5 rounded-xl border text-xs transition-all ${
                                    itDone
                                      ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200/70 dark:border-emerald-900/40'
                                      : 'bg-white dark:bg-slate-850 border-slate-200/80 dark:border-slate-800'
                                  }`}
                                >
                                  <div className="flex items-start justify-between gap-2">
                                    <div className="flex items-start gap-2 flex-1 min-w-0">
                                      <button
                                        type="button"
                                        onClick={() => handleToggleSubItemComplete(goal, it.id)}
                                        className="mt-0.5 text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 shrink-0"
                                      >
                                        {itDone ? (
                                          <CheckSquare className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                                        ) : (
                                          <Square className="w-4 h-4" />
                                        )}
                                      </button>
                                      <div className="flex-1 min-w-0">
                                        <div className="flex items-baseline justify-between gap-2">
                                          <span
                                            className={`font-semibold text-slate-900 dark:text-white truncate ${
                                              itDone ? 'line-through text-slate-400 dark:text-slate-500' : ''
                                            }`}
                                          >
                                            {it.title}
                                          </span>
                                          <span className="font-mono text-[11px] font-bold text-amber-700 dark:text-amber-300 shrink-0">
                                            {formatRupiah(itCurrent)}
                                          </span>
                                        </div>

                                        <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono mt-0.5">
                                          <span>Target: {formatRupiah(itTarget)}</span>
                                          <span className={itDone ? 'text-emerald-600 font-bold' : ''}>
                                            {itPct}%
                                          </span>
                                        </div>

                                        {/* Mini progress bar */}
                                        <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden mt-1">
                                          <div
                                            className={`h-full rounded-full transition-all duration-300 ${
                                              itDone ? 'bg-emerald-500' : 'bg-amber-500'
                                            }`}
                                            style={{ width: `${itPct}%` }}
                                          />
                                        </div>

                                        {it.notes && (
                                          <p className="text-[10px] text-slate-400 mt-1 italic truncate">
                                            {it.notes}
                                          </p>
                                        )}
                                      </div>
                                    </div>

                                    {/* Sub-item Actions */}
                                    <div className="flex items-center gap-1 shrink-0 pt-0.5">
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setTopUpSubItem({ goal, item: it });
                                          setTopUpAmount('');
                                        }}
                                        className="px-2 py-1 text-[10px] font-bold text-amber-700 dark:text-amber-300 bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/60 rounded-md border border-amber-200/80 dark:border-amber-900/60"
                                        title="Tambah setoran khusus item ini"
                                      >
                                        + Setor
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => openEditSubItem(goal, it)}
                                        className="p-1 text-slate-400 hover:text-amber-600 rounded-md"
                                        title="Edit rincian item"
                                      >
                                        <Edit2 className="w-3 h-3" />
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => handleDeleteSubItem(goal, it.id)}
                                        className="p-1 text-slate-400 hover:text-rose-600 rounded-md"
                                        title="Hapus rincian item"
                                      >
                                        <Trash2 className="w-3 h-3" />
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <div className="p-3 text-center bg-slate-50 dark:bg-slate-850 rounded-xl border border-dashed border-slate-200 dark:border-slate-800">
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-2">
                              Belum ada rincian item di folder ini. Tambahkan item seperti Mahar, Acara, Catering, dll.
                            </p>
                            <button
                              type="button"
                              onClick={() => openAddSubItem(goal)}
                              className="px-3 py-1.5 text-xs font-bold text-amber-700 dark:text-amber-300 bg-amber-100/70 hover:bg-amber-100 rounded-xl inline-flex items-center gap-1"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              Tambah Rincian Item Pertama
                            </button>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Bottom Action Bar */}
                    <div className="flex items-center gap-2 pt-1">
                      <button
                        onClick={() => toggleExpandGoal(goal.id)}
                        className="flex-1 py-1.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-300 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                      >
                        {isExpanded ? (
                          <>
                            <FolderOpen className="w-3.5 h-3.5 text-amber-500" />
                            Tutup Rincian ({hasItems ? goal.items!.length : 0})
                          </>
                        ) : (
                          <>
                            <Folder className="w-3.5 h-3.5 text-amber-500" />
                            {hasItems
                              ? `Buka Rincian Folder (${goal.items!.length} item)`
                              : 'Buka / Bikin Rincian Item'}
                          </>
                        )}
                      </button>

                      <button
                        onClick={() => {
                          setTopUpTarget(goal);
                          setTopUpAmount('');
                        }}
                        className="py-1.5 px-3 rounded-xl bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/40 dark:hover:bg-amber-900/50 text-amber-700 dark:text-amber-300 text-xs font-bold border border-amber-200/80 dark:border-amber-800 flex items-center justify-center gap-1 transition-colors"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        Setor Tabungan
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

          {/* Modal Tambah / Edit Rincian Item (Folder Sub-Item) */}
          {(addingItemToGoal || editingSubItem) && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
              <div className="bg-white dark:bg-slate-900 border border-amber-300 dark:border-amber-800 rounded-3xl w-full max-w-sm p-5 space-y-3.5 shadow-2xl animate-fade-in">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2.5">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0">
                      <ListPlus className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate">
                        {editingSubItem ? 'Edit Rincian Item' : 'Tambah Rincian Item'}
                      </h4>
                      <p className="text-[10px] text-slate-400 truncate">
                        Target: {editingSubItem ? editingSubItem.goal.title : addingItemToGoal?.title}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setAddingItemToGoal(null);
                      setEditingSubItem(null);
                    }}
                    className="p-1 text-slate-400 hover:text-slate-600 rounded-lg shrink-0"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <form onSubmit={handleSubItemFormSubmit} className="space-y-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Nama Item / Kebutuhan
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Contoh: Mahar, Acara Resepsi, Catering, Baju & Rias..."
                      value={itemTitle}
                      onChange={(e) => setItemTitle(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                      autoFocus
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Target Nominal (Rp)
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="any"
                        required
                        placeholder="Contoh: 10000000"
                        value={itemTargetAmount}
                        onChange={(e) => setItemTargetAmount(e.target.value)}
                        className="w-full px-3 py-2 text-xs font-mono font-bold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                      />
                      {itemTargetAmount && !isNaN(parseFloat(itemTargetAmount)) && (
                        <span className="text-[10px] text-amber-600 font-mono font-bold mt-0.5 block truncate">
                          {formatRupiah(parseFloat(itemTargetAmount))}
                        </span>
                      )}
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Saldo Terkumpul Awal
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="any"
                        placeholder="Contoh: 2000000"
                        value={itemCurrentAmount}
                        onChange={(e) => setItemCurrentAmount(e.target.value)}
                        className="w-full px-3 py-2 text-xs font-mono font-bold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                      />
                      {itemCurrentAmount && !isNaN(parseFloat(itemCurrentAmount)) && (
                        <span className="text-[10px] text-emerald-600 font-mono font-bold mt-0.5 block truncate">
                          {formatRupiah(parseFloat(itemCurrentAmount))}
                        </span>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Catatan Tambahan (Opsional)
                    </label>
                    <input
                      type="text"
                      placeholder="Contoh: Rencana pesan vendor dari Nabire..."
                      value={itemNotes}
                      onChange={(e) => setItemNotes(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                    <button
                      type="button"
                      onClick={() => {
                        setAddingItemToGoal(null);
                        setEditingSubItem(null);
                      }}
                      className="px-4 py-2 text-xs font-semibold text-slate-500"
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-xl shadow-xs"
                    >
                      {editingSubItem ? 'Perbarui Item' : 'Simpan Item'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Modal Setor Khusus Sub-Item */}
          {topUpSubItem && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-sm p-5 space-y-3.5 shadow-2xl animate-fade-in">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                  <div className="min-w-0">
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate">
                      Tambah Setoran: {topUpSubItem.item.title}
                    </h4>
                    <p className="text-[10px] text-slate-400 truncate">
                      Folder: {topUpSubItem.goal.title}
                    </p>
                  </div>
                  <button
                    onClick={() => setTopUpSubItem(null)}
                    className="p-1 text-slate-400 hover:text-slate-600 rounded-lg shrink-0"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <form onSubmit={handleQuickTopUpSubItem} className="space-y-3">
                  <div>
                    <div className="flex justify-between text-[11px] mb-1">
                      <span className="text-slate-500">Saldo saat ini:</span>
                      <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                        {formatRupiah(topUpSubItem.item.currentAmount)} / {formatRupiah(topUpSubItem.item.targetAmount)}
                      </span>
                    </div>
                    <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Nominal Setoran (Rp)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="any"
                      required
                      placeholder="Contoh: 500000"
                      value={topUpAmount}
                      onChange={(e) => setTopUpAmount(e.target.value)}
                      className="w-full px-3 py-2 text-sm font-mono font-bold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                      autoFocus
                    />
                    {topUpAmount && !isNaN(parseFloat(topUpAmount)) && (
                      <div className="mt-1 flex items-center justify-between text-[11px] font-mono font-bold">
                        <span className="text-emerald-600">+ {formatRupiah(parseFloat(topUpAmount))}</span>
                        <span className="text-slate-600 dark:text-slate-300">
                          Menjadi: {formatRupiah(topUpSubItem.item.currentAmount + parseFloat(topUpAmount))}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2 pt-1 border-t border-slate-100 dark:border-slate-800">
                    <button
                      type="button"
                      onClick={() => setTopUpSubItem(null)}
                      className="flex-1 py-2 text-xs font-semibold text-slate-500 bg-slate-100 dark:bg-slate-800 rounded-xl"
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      className="flex-1 py-2 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-xl shadow-xs"
                    >
                      Simpan Setoran
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ===================== JARVIS AI GOLD PROFIT / LOSS ANALYSIS MODAL ===================== */}
      {isJarvisAnalysisOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3.5 bg-slate-900/60 backdrop-blur-xs animate-fade-in overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 border border-amber-300 dark:border-amber-800 rounded-2xl w-full max-w-lg p-5 space-y-4 shadow-2xl my-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-linear-to-br from-amber-400 to-amber-600 text-white flex items-center justify-center shadow-xs">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Analisis Untung Rugi Jual Emas · JARVIS AI
                  </h3>
                  <span className="text-[10px] text-slate-400">
                    {selectedAssetForAnalysis ? `Fokus: ${selectedAssetForAnalysis.title}` : 'Semua Portofolio Emas'}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setIsJarvisAnalysisOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {(() => {
              const assetsToAnalyze = selectedAssetForAnalysis
                ? [selectedAssetForAnalysis]
                : goldAssets;

              if (assetsToAnalyze.length === 0) {
                return (
                  <div className="py-6 text-center text-xs text-slate-500">
                    Belum ada keping emas yang tercatat untuk dianalisis.
                  </div>
                );
              }

              const weight = assetsToAnalyze.reduce((s, a) => s + (Number(a.weightGrams) || 0), 0);
              const modal = assetsToAnalyze.reduce(
                (s, a) => s + (Number(a.totalPurchasePrice) || ((Number(a.weightGrams) || 0) * (Number(a.purchasePricePerGram) || 0))),
                0
              );
              const estVal = assetsToAnalyze.reduce((s, a) => {
                const w = Number(a.weightGrams) || 0;
                const p = getAssetBuybackPrice(a);
                return s + (w * p);
              }, 0);

              const profit = estVal - modal;
              const profitPct = modal > 0 ? (profit / modal) * 100 : 0;
              const pph22 = estVal * 0.0045; // 0.45% tax with NPWP
              const netAfterTax = estVal - pph22;
              const netProfit = netAfterTax - modal;
              const netProfitPct = modal > 0 ? (netProfit / modal) * 100 : 0;

              return (
                <div className="space-y-3.5 text-xs">
                  {/* Calculation Card */}
                  <div className="p-3.5 rounded-xl bg-amber-50/60 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-900/50 space-y-2.5">
                    <div className="flex justify-between items-center text-slate-600 dark:text-slate-300">
                      <span>Total Berat Emas:</span>
                      <span className="font-mono font-bold text-slate-900 dark:text-white">
                        {weight.toFixed(2)} Gram ({assetsToAnalyze.length} keping)
                      </span>
                    </div>

                    <div className="flex justify-between items-center text-slate-600 dark:text-slate-300">
                      <span>Total Modal Pembelian:</span>
                      <span className="font-mono font-bold text-slate-900 dark:text-white">
                        {formatRupiah(modal)}
                      </span>
                    </div>

                    <div className="flex justify-between items-center text-slate-600 dark:text-slate-300">
                      <span>Estimasi Nilai Buyback Kotor:</span>
                      <span className="font-mono font-bold text-slate-900 dark:text-white">
                        {formatRupiah(estVal)}
                      </span>
                    </div>

                    <div className="flex justify-between items-center text-slate-500 text-[11px] pt-1 border-t border-amber-200/60 dark:border-amber-900/40">
                      <span>Estimasi Pajak PPh 22 (0.45% NPWP):</span>
                      <span className="font-mono text-slate-600 dark:text-slate-400">
                        - {formatRupiah(pph22)}
                      </span>
                    </div>

                    <div className="flex justify-between items-baseline pt-1.5 border-t border-amber-200/80 dark:border-amber-900/60">
                      <span className="font-bold text-slate-900 dark:text-white">
                        Estimasi Uang Bersih Diterima:
                      </span>
                      <span className="font-mono font-bold text-base text-amber-700 dark:text-amber-300">
                        {formatRupiah(netAfterTax)}
                      </span>
                    </div>

                    <div className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-amber-200/50 dark:border-amber-900/40 flex items-center justify-between">
                      <span className="font-bold text-slate-800 dark:text-slate-200">
                        Keuntungan Bersih (Capital Gain):
                      </span>
                      <div className="text-right">
                        <span
                          className={`font-mono font-bold text-sm block ${
                            netProfit >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600'
                          }`}
                        >
                          {netProfit >= 0 ? '+' : ''}{formatRupiah(netProfit)}
                        </span>
                        <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                          ({netProfitPct >= 0 ? '+' : ''}{netProfitPct.toFixed(1)}% ROI)
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* JARVIS Tactical Recommendation */}
                  <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-850/70 border border-slate-200/80 dark:border-slate-800 space-y-2">
                    <div className="flex items-center gap-1.5 font-bold text-slate-900 dark:text-white text-xs">
                      <Sparkles className="w-4 h-4 text-amber-500" />
                      <span>Rekomendasi Strategis JARVIS:</span>
                    </div>

                    {profitPct >= 20 ? (
                      <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-[11px]">
                        🚀 <strong>Sangat Menguntungkan!</strong> Portofolio emasmu sudah menghasilkan keuntungan di atas <strong>{profitPct.toFixed(1)}%</strong>. Jika ada kebutuhan mendesak untuk dana darurat, renovasi, atau alokasi bisnis, mencairkan sebagian adalah pilihan tepat karena profitnya sudah terealisasi. Namun jika belum butuh likuiditas tunai, simpan terus (HOLD) sebagai pelindung nilai inflasi.
                      </p>
                    ) : profitPct >= 5 ? (
                      <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-[11px]">
                        📈 <strong>Positif & Menguntungkan!</strong> Keuntungan sudah menutupi selisih harga jual-beli (spread). Namun untuk logam mulia fisik (Antam / Galeri 24), waktu simpan ideal adalah <strong>2 hingga 5 tahun</strong> agar profitnya optimal. Saran JARVIS: <strong>HOLD</strong> dulu kecuali ada kebutuhan darurat.
                      </p>
                    ) : (
                      <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-[11px]">
                        ⏳ <strong>Saran: Sebaiknya Tetap Simpan (HOLD).</strong> Karena emas fisik memiliki spread beli dan buyback, menjual dalam waktu terlalu cepat berisiko belum mencapai potensi keuntungan maksimal. Jadikan sebagai tabungan aman jangka panjang.
                      </p>
                    )}

                    <div className="pt-1.5 text-[10px] text-slate-400 flex items-start gap-1">
                      <Info className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                      <span>
                        Tips Jual: Bawa sertifikat fisik & KTP/NPWP ke Butik Antam LM resmi atau Galeri 24 Pegadaian untuk mendapatkan harga buyback tertinggi tanpa potongan perantara pihak ketiga.
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setIsJarvisAnalysisOpen(false)}
                      className="flex-1 py-2.5 text-xs font-semibold text-slate-500 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 rounded-xl"
                    >
                      Tutup
                    </button>
                    {onConsultJarvisGold && (
                      <button
                        type="button"
                        onClick={() => {
                          setIsJarvisAnalysisOpen(false);
                          const prompt = selectedAssetForAnalysis
                            ? `JARVIS, tolong analisis keuntungan dan kerugian jika saya menjual ${selectedAssetForAnalysis.title} (${selectedAssetForAnalysis.weightGrams} gram) sekarang, dan apa rekomendasi finansialmu?`
                            : `JARVIS, tolong analisis keseluruhan portofolio emas saya (${weight.toFixed(1)} gram), apakah saat ini waktu yang bagus untuk jual atau hold?`;
                          onConsultJarvisGold(prompt);
                        }}
                        className="flex-2 py-2.5 text-xs font-bold text-white bg-linear-to-r from-amber-600 to-amber-700 hover:opacity-95 rounded-xl shadow-xs flex items-center justify-center gap-1.5"
                      >
                        <Sparkles className="w-4 h-4" />
                        Lanjut Diskusi di Chat JARVIS
                      </button>
                    )}
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* Quick Buyback Price Editor for Single Asset */}
      {editingBuybackAsset && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white dark:bg-slate-900 border border-amber-300 dark:border-amber-800 rounded-3xl p-5 max-w-sm w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2.5">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center">
                  <TrendingUp className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-slate-900 dark:text-white">
                    Ubah Harga Buyback
                  </h3>
                  <p className="text-[10px] text-slate-400 truncate max-w-[200px]">
                    {editingBuybackAsset.title}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingBuybackAsset(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleQuickSaveBuybackPrice} className="space-y-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Harga Buyback per Gram (Rp)
                </label>
                <input
                  type="number"
                  step="any"
                  min="0"
                  required
                  placeholder="Contoh: 1390000"
                  value={quickBuybackPriceInput}
                  onChange={(e) => setQuickBuybackPriceInput(e.target.value)}
                  className="w-full px-3 py-2 text-sm font-mono font-bold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                  autoFocus
                />
                {quickBuybackPriceInput && !isNaN(parseFloat(quickBuybackPriceInput)) && (
                  <div className="mt-1 flex items-center justify-between text-[11px]">
                    <span className="text-slate-500">Nilai Jual ({editingBuybackAsset.weightGrams}g):</span>
                    <span className="font-mono font-bold text-amber-600 dark:text-amber-400">
                      {formatRupiah(parseFloat(quickBuybackPriceInput) * editingBuybackAsset.weightGrams)}
                    </span>
                  </div>
                )}
              </div>

              {/* Quick Preset Buttons */}
              <div className="space-y-1">
                <span className="text-[10px] text-slate-400 block font-medium">Pilihan Cepat Acuan Pasar:</span>
                <div className="grid grid-cols-2 gap-1.5 text-[10px]">
                  <button
                    type="button"
                    onClick={() => setQuickBuybackPriceInput(String(customBenchmarks.antam || 1395000))}
                    className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-left font-mono truncate"
                  >
                    Antam: {formatRupiah(customBenchmarks.antam || 1395000)}
                  </button>
                  <button
                    type="button"
                    onClick={() => setQuickBuybackPriceInput(String(customBenchmarks.galeri24 || 1385000))}
                    className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-left font-mono truncate"
                  >
                    Galeri24: {formatRupiah(customBenchmarks.galeri24 || 1385000)}
                  </button>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingBuybackAsset(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-500"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-xl shadow-xs"
                >
                  Simpan Harga
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Benchmark Market Rates Settings Modal */}
      {isBenchmarkModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white dark:bg-slate-900 border border-amber-300 dark:border-amber-800 rounded-3xl p-5 max-w-sm w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2.5">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center">
                  <TrendingUp className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-slate-900 dark:text-white">
                    Edit Acuan Buyback Pasar
                  </h3>
                  <p className="text-[10px] text-slate-400">
                    Perbarui harga acuan buyback harian (Rp / gram)
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsBenchmarkModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2.5 text-xs">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Antam LM CertiCard (Rp / gram)
                </label>
                <input
                  type="number"
                  step="any"
                  value={benchmarkForm.antam}
                  onChange={(e) => setBenchmarkForm({ ...benchmarkForm, antam: e.target.value })}
                  className="w-full px-3 py-1.5 text-xs font-mono font-bold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Galeri 24 Pegadaian (Rp / gram)
                </label>
                <input
                  type="number"
                  step="any"
                  value={benchmarkForm.galeri24}
                  onChange={(e) => setBenchmarkForm({ ...benchmarkForm, galeri24: e.target.value })}
                  className="w-full px-3 py-1.5 text-xs font-mono font-bold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  UBS Gold (Rp / gram)
                </label>
                <input
                  type="number"
                  step="any"
                  value={benchmarkForm.ubs}
                  onChange={(e) => setBenchmarkForm({ ...benchmarkForm, ubs: e.target.value })}
                  className="w-full px-3 py-1.5 text-xs font-mono font-bold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Tabungan Emas Pegadaian (Rp / gram)
                </label>
                <input
                  type="number"
                  step="any"
                  value={benchmarkForm.pegadaian}
                  onChange={(e) => setBenchmarkForm({ ...benchmarkForm, pegadaian: e.target.value })}
                  className="w-full px-3 py-1.5 text-xs font-mono font-bold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                />
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex flex-col gap-2">
              <button
                type="button"
                onClick={() => handleSaveBenchmarks(true)}
                className="w-full py-2 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-xl shadow-xs"
              >
                Simpan & Terapkan ke Semua Aset
              </button>
              <button
                type="button"
                onClick={() => handleSaveBenchmarks(false)}
                className="w-full py-1.5 text-[11px] font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
              >
                Simpan Hanya Sebagai Acuan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
