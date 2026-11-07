import React, { useState, useMemo } from 'react';
import { CROP_PRESETS } from '../data/presets';
import { CropPreset, World, GrowAccount, FarmSaleRecord } from '../types';
import { SalesTrackerModal } from '../components/SalesTrackerModal';
import { ConfirmDeleteModal } from '../components/ConfirmDeleteModal';
import {
  Calculator,
  Gem,
  Sprout,
  Sparkles,
  TrendingUp,
  Clock,
  Layers,
  Zap,
  RotateCw,
  PlusCircle,
  HelpCircle,
  ShoppingBag,
  Award,
  ArrowRight,
  Sliders,
  CheckCircle2,
  Coins,
  Search,
  Filter,
  Trash2,
  Calendar,
  User,
  MapPin,
  Tag,
  Plus,
  X,
  Download,
  FileSpreadsheet,
} from 'lucide-react';
import { exportSalesRecordsToCsv } from '../utils/csvExport';

interface CalculatorPageProps {
  salesRecords?: FarmSaleRecord[];
  onAddSaleRecord?: (record: Omit<FarmSaleRecord, 'id' | 'createdAt'>) => void;
  onDeleteSaleRecord?: (recordId: string) => void;
  worlds?: World[];
  accounts?: GrowAccount[];
  onApplyToNewWorld?: (cropData: {
    cropType: string;
    treeCount: number;
    days: number;
    hours: number;
    minutes: number;
  }) => void;
}

// Stats per crop for Growtopia
interface CropStat {
  name: string;
  gemsPerTree: number;
  seedDropRate: number; // e.g. 1.04 means 104 seeds returned per 100 trees
  blocksPerTree: number; // ~4 blocks
  hitsToBreak: number;
  seedPriceRatio: number; // seed per WL (e.g. 200/13 WL = ~15.3 seed/WL)
  blockPriceRatio: number; // blocks per WL (e.g. 100/1 WL)
}

const CROP_STATS: Record<string, CropStat> = {
  'Laser Grid': {
    name: 'Laser Grid',
    gemsPerTree: 11.5,
    seedDropRate: 1.04,
    blocksPerTree: 4.2,
    hitsToBreak: 4,
    seedPriceRatio: 15.3, // ~200/13 WL
    blockPriceRatio: 80,
  },
  'Pepper Tree': {
    name: 'Pepper Tree',
    gemsPerTree: 7.2,
    seedDropRate: 1.05,
    blocksPerTree: 4.1,
    hitsToBreak: 3,
    seedPriceRatio: 25.0, // ~200/8 WL
    blockPriceRatio: 120,
  },
  'Chandelier': {
    name: 'Chandelier',
    gemsPerTree: 22.0,
    seedDropRate: 1.035,
    blocksPerTree: 4.3,
    hitsToBreak: 5,
    seedPriceRatio: 6.5, // ~100/15 WL
    blockPriceRatio: 40,
  },
  'Fish Tank': {
    name: 'Fish Tank',
    gemsPerTree: 8.8,
    seedDropRate: 1.045,
    blocksPerTree: 4.0,
    hitsToBreak: 3,
    seedPriceRatio: 30.0,
    blockPriceRatio: 150,
  },
  'Pinball': {
    name: 'Pinball',
    gemsPerTree: 9.5,
    seedDropRate: 1.04,
    blocksPerTree: 4.1,
    hitsToBreak: 4,
    seedPriceRatio: 22.0,
    blockPriceRatio: 100,
  },
  'Sorcerer Stone': {
    name: 'Sorcerer Stone',
    gemsPerTree: 16.5,
    seedDropRate: 1.038,
    blocksPerTree: 4.2,
    hitsToBreak: 5,
    seedPriceRatio: 9.0,
    blockPriceRatio: 50,
  },
  'Venus Guytrap': {
    name: 'Venus Guytrap',
    gemsPerTree: 10.8,
    seedDropRate: 1.042,
    blocksPerTree: 4.1,
    hitsToBreak: 4,
    seedPriceRatio: 18.0,
    blockPriceRatio: 90,
  },
};

type CalcMode = 'profit' | 'packs' | 'cycle' | 'sales';

export const CalculatorPage: React.FC<CalculatorPageProps> = ({
  salesRecords = [],
  onAddSaleRecord,
  onDeleteSaleRecord,
  worlds = [],
  accounts = [],
  onApplyToNewWorld,
}) => {
  const [calcMode, setCalcMode] = useState<CalcMode>('profit');

  // Sales Tracker States
  const [isSaleModalOpen, setIsSaleModalOpen] = useState(false);
  const [salePreset, setSalePreset] = useState<Partial<Omit<FarmSaleRecord, 'id' | 'createdAt'>> | null>(null);
  const [salesSearch, setSalesSearch] = useState('');
  const [salesCategoryFilter, setSalesCategoryFilter] = useState<'all' | FarmSaleRecord['category']>('all');
  const [salesSort, setSalesSort] = useState<'newest' | 'revenueHigh' | 'quantityHigh'>('newest');
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [exportNotification, setExportNotification] = useState<string | null>(null);
  const [saleToDelete, setSaleToDelete] = useState<FarmSaleRecord | null>(null);

  // Profit Calculator State
  const [selectedCrop, setSelectedCrop] = useState<string>('Laser Grid');
  const [inputMode, setInputMode] = useState<'world' | 'trees'>('world');
  const [worldCount, setWorldCount] = useState<number>(1);
  const [treeCount, setTreeCount] = useState<number>(2600);

  // Buffs
  const [hasLuckyClover, setHasLuckyClover] = useState(false);
  const [hasSorrowHarvester, setHasSorrowHarvester] = useState(false);
  const [hasRaymanBFG, setHasRaymanBFG] = useState(true);

  // Pack Converter State
  const [gemsToConvert, setGemsToConvert] = useState<number>(50000);

  // Cycle Planner State
  const [cycleCrop, setCycleCrop] = useState<string>('Laser Grid');
  const [targetHarvestIntervalDays, setTargetHarvestIntervalDays] = useState<number>(1);

  // Active Crop Preset
  const currentPreset = CROP_PRESETS.find((c) => c.name === selectedCrop) || CROP_PRESETS[0];
  const currentStat = CROP_STATS[selectedCrop] || CROP_STATS['Laser Grid'];

  // Total Trees based on world vs direct tree count
  const effectiveTreeCount = inputMode === 'world' ? worldCount * 2600 : treeCount;

  // Calculate Profit Yields
  const calculation = useMemo(() => {
    const cloverMultiplier = hasLuckyClover ? 1.1 : 1.0;
    const sorrowBonus = hasSorrowHarvester ? 0.015 : 0.0;

    // Gems
    const rawGems = effectiveTreeCount * currentStat.gemsPerTree * cloverMultiplier;
    const estGems = Math.round(rawGems);

    // Equivalent WL from gems (standard ~2,000 gems = 1 WL)
    const wlFromGems = estGems / 2000;

    // Seeds returned
    const effectiveSeedRate = currentStat.seedDropRate + sorrowBonus;
    const estSeedsReturned = Math.round(effectiveTreeCount * effectiveSeedRate);
    const surplusSeeds = Math.max(0, estSeedsReturned - effectiveTreeCount);

    // Surplus Seed value in WL
    const wlFromSurplusSeeds = surplusSeeds / currentStat.seedPriceRatio;

    // Blocks dropped
    const estBlocks = Math.round(effectiveTreeCount * currentStat.blocksPerTree);
    const wlFromBlocks = estBlocks / currentStat.blockPriceRatio;

    // Total estimated profit if gems converted to WL + surplus seed sold
    const totalWlProfit = wlFromGems + wlFromSurplusSeeds;
    const dlProfit = totalWlProfit / 100;

    // Time estimate to break
    const totalHits = estBlocks * currentStat.hitsToBreak;
    // BFG/Rayman speed: ~15,000 blocks/hour vs Manual: ~3,500 blocks/hour
    const hoursToBreak = hasRaymanBFG ? estBlocks / 15000 : estBlocks / 3500;

    return {
      estGems,
      wlFromGems: parseFloat(wlFromGems.toFixed(1)),
      estSeedsReturned,
      surplusSeeds,
      wlFromSurplusSeeds: parseFloat(wlFromSurplusSeeds.toFixed(1)),
      estBlocks,
      wlFromBlocks: parseFloat(wlFromBlocks.toFixed(1)),
      totalWlProfit: parseFloat(totalWlProfit.toFixed(1)),
      dlProfit: parseFloat(dlProfit.toFixed(2)),
      hoursToBreak: parseFloat(hoursToBreak.toFixed(1)),
      growthDays: currentPreset.days,
      growthHours: currentPreset.hours,
    };
  }, [
    effectiveTreeCount,
    currentStat,
    currentPreset,
    hasLuckyClover,
    hasSorrowHarvester,
    hasRaymanBFG,
  ]);

  // Pack comparator items
  const packComparisons = useMemo(() => {
    return [
      {
        name: 'Surgery Pack',
        gemCost: 8000,
        estimatedWlReturn: 6.5,
        ratioGemsPerWl: 8000 / 6.5,
        icon: '💉',
        badge: 'TERBAIK UNTUK PROFIT',
        badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
        note: 'Paling stabil dicari player untuk quest Dr. Title & Surg role.',
      },
      {
        name: 'Small Seed Pack (SSP)',
        gemCost: 500,
        estimatedWlReturn: 0.33, // 3 pack per 1 WL = ~1500 gems/WL
        ratioGemsPerWl: 1500,
        icon: '🌱',
        badge: 'Cepat Laku',
        badgeColor: 'bg-blue-500/20 text-blue-300 border-blue-500/40',
        note: 'Sangat mudah dijual massal di world BUYSSP / VEND.',
      },
      {
        name: 'Megaphone Pack',
        gemCost: 5000,
        estimatedWlReturn: 2.5,
        ratioGemsPerWl: 2000,
        icon: '📢',
        badge: 'Standar Toko',
        badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
        note: 'Alternatif jika pasar SSP sedang melambat.',
      },
      {
        name: 'Beli World Lock Langsung',
        gemCost: 2000,
        estimatedWlReturn: 1.0,
        ratioGemsPerWl: 2000,
        icon: '🗝️',
        badge: 'Instan Resmi',
        badgeColor: 'bg-slate-700 text-slate-300 border-slate-600',
        note: 'Paling simpel jika tidak ingin repot transaksi vending/trade.',
      },
      {
        name: 'City Pack',
        gemCost: 8000,
        estimatedWlReturn: 4.8,
        ratioGemsPerWl: 1660,
        icon: '🏙️',
        badge: 'Event Spesifik',
        badgeColor: 'bg-purple-500/20 text-purple-300 border-purple-500/40',
        note: 'Bagus saat ada event builder atau update perkotaan.',
      },
    ];
  }, []);

  // Cycle calculation
  const cycleCalculation = useMemo(() => {
    const preset = CROP_PRESETS.find((c) => c.name === cycleCrop) || CROP_PRESETS[0];
    const totalHours = preset.days * 24 + preset.hours;
    // To harvest every N days, we need totalHours / (intervalDays * 24)
    const requiredWorlds = Math.ceil(totalHours / (targetHarvestIntervalDays * 24));
    const totalSeedsRequired = requiredWorlds * 2600;
    const stat = CROP_STATS[cycleCrop] || CROP_STATS['Laser Grid'];
    const monthlyHarvestCount = Math.floor(30 / targetHarvestIntervalDays);
    const monthlyWlProfit = monthlyHarvestCount * ((2600 * stat.gemsPerTree) / 2000 + (2600 * 0.04) / stat.seedPriceRatio);

    return {
      preset,
      totalHours,
      requiredWorlds,
      totalSeedsRequired,
      monthlyHarvestCount,
      monthlyWlProfit: Math.round(monthlyWlProfit),
    };
  }, [cycleCrop, targetHarvestIntervalDays]);

  // Sales records calculations
  const salesStats = useMemo(() => {
    const totalRevenueWl = salesRecords.reduce((acc, r) => acc + (r.revenueWl || 0), 0);
    const totalDl = parseFloat((totalRevenueWl / 100).toFixed(2));
    const totalGems = salesRecords
      .filter((r) => r.category === 'gems' || r.quantityUnit === 'Gems')
      .reduce((acc, r) => acc + (r.quantity || 0), 0);
    const totalSeed = salesRecords
      .filter((r) => r.category === 'seed' || r.quantityUnit === 'Seed')
      .reduce((acc, r) => acc + (r.quantity || 0), 0);
    const count = salesRecords.length;
    const avgWl = count > 0 ? (totalRevenueWl / count).toFixed(1) : '0';

    return {
      totalRevenueWl: Math.round(totalRevenueWl),
      totalDl,
      totalGems,
      totalSeed,
      count,
      avgWl,
    };
  }, [salesRecords]);

  // Filtered and sorted sales records
  const filteredSales = useMemo(() => {
    return salesRecords
      .filter((record) => {
        // Category filter
        if (salesCategoryFilter !== 'all' && record.category !== salesCategoryFilter) {
          return false;
        }
        // Search filter
        if (salesSearch.trim()) {
          const q = salesSearch.toLowerCase();
          const matchTitle = record.title.toLowerCase().includes(q);
          const matchItem = record.itemSold.toLowerCase().includes(q);
          const matchBuyer = (record.buyerName || '').toLowerCase().includes(q);
          const matchWorld = (record.worldName || '').toLowerCase().includes(q);
          const matchNotes = (record.notes || '').toLowerCase().includes(q);
          return matchTitle || matchItem || matchBuyer || matchWorld || matchNotes;
        }
        return true;
      })
      .sort((a, b) => {
        if (salesSort === 'revenueHigh') {
          return (b.revenueWl || 0) - (a.revenueWl || 0);
        }
        if (salesSort === 'quantityHigh') {
          return (b.quantity || 0) - (a.quantity || 0);
        }
        // Default 'newest'
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      });
  }, [salesRecords, salesCategoryFilter, salesSearch, salesSort]);

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-200">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl p-6 sm:p-8 bg-gradient-to-r from-[#0d1e33] via-[#10233b] to-[#0a1526] border border-slate-700/80 shadow-2xl">
        <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-bold tracking-wider uppercase mb-2.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Smart Farming Calculator</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-50 font-game tracking-wider">
              KALKULATOR FARMING GROWTOPIA
            </h1>
            <p className="text-slate-400 text-xs sm:text-sm mt-1 max-w-xl">
              Hitung estimasi Gems, surplus bibit, rasio World Lock, dan catat hasil penjualan transaksi farming Anda secara rapi.
            </p>
          </div>

          {/* Quick Segmented Nav */}
          <div className="flex items-center bg-[#080e1c] p-1.5 rounded-2xl border border-slate-700/80 shrink-0 self-start md:self-auto flex-wrap gap-1">
            <button
              onClick={() => setCalcMode('profit')}
              className={`px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                calcMode === 'profit'
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 shadow-md shadow-emerald-500/20'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Hasil & Profit</span>
            </button>
            <button
              onClick={() => setCalcMode('packs')}
              className={`px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                calcMode === 'packs'
                  ? 'bg-gradient-to-r from-amber-500 to-amber-400 text-slate-950 shadow-md shadow-amber-500/20'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>Konversi Pack</span>
            </button>
            <button
              onClick={() => setCalcMode('cycle')}
              className={`px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                calcMode === 'cycle'
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-slate-950 shadow-md shadow-cyan-500/20'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <RotateCw className="w-3.5 h-3.5" />
              <span>Rotasi Harian</span>
            </button>
            <button
              onClick={() => setCalcMode('sales')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                calcMode === 'sales'
                  ? 'bg-gradient-to-r from-emerald-400 via-teal-300 to-amber-300 text-slate-950 shadow-md shadow-emerald-500/25'
                  : 'text-amber-300/80 hover:text-amber-200 bg-amber-500/10 border border-amber-500/20'
              }`}
            >
              <Coins className="w-3.5 h-3.5" />
              <span>Catatan Penjualan ({salesRecords.length})</span>
            </button>
          </div>
        </div>
      </div>

      {/* MODE 1: KALKULATOR HASIL PANEN & PROFIT */}
      {calcMode === 'profit' && (
        <div className="space-y-6">
          {/* Section 1: Crop Selector */}
          <div className="p-5 rounded-3xl bg-[#0f172a] border border-slate-800 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider font-game flex items-center gap-2">
                  <Sprout className="w-4 h-4 text-emerald-400" />
                  1. Pilih Tanaman Farmable
                </h3>
                <p className="text-xs text-slate-400">
                  Setiap jenis bibit memiliki durasi panen dan drop gems yang berbeda
                </p>
              </div>
              <span className="text-xs px-2.5 py-1 rounded-lg bg-slate-800 text-emerald-400 font-mono font-semibold">
                {selectedCrop}: {currentPreset.days}h {currentPreset.hours}j
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5">
              {CROP_PRESETS.slice(0, 7).map((crop) => {
                const isSelected = selectedCrop === crop.name;
                return (
                  <button
                    key={crop.name}
                    type="button"
                    onClick={() => setSelectedCrop(crop.name)}
                    className={`p-3 rounded-2xl border text-left transition-all cursor-pointer relative group ${
                      isSelected
                        ? 'bg-emerald-500/15 border-emerald-400 shadow-lg shadow-emerald-500/15 ring-1 ring-emerald-400/50'
                        : 'bg-[#121c33] border-slate-800 hover:border-slate-700 hover:bg-slate-800/60'
                    }`}
                  >
                    <div className="text-2xl mb-1.5">{crop.icon}</div>
                    <div className="font-bold text-xs text-slate-100 group-hover:text-emerald-300 transition-colors truncate">
                      {crop.name}
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5">
                      {crop.days}h {crop.hours}j
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section 2: Input Scale & Buffs */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left: Input Controls */}
            <div className="lg:col-span-7 p-6 rounded-3xl bg-[#0f172a] border border-slate-800 shadow-xl space-y-5">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider font-game flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-amber-400" />
                  2. Jumlah World atau Pohon
                </h3>
                {/* Switcher Mode: World vs Trees */}
                <div className="flex items-center bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs">
                  <button
                    onClick={() => setInputMode('world')}
                    className={`px-3 py-1 rounded-lg font-semibold transition-colors cursor-pointer ${
                      inputMode === 'world'
                        ? 'bg-emerald-500 text-slate-950 font-bold'
                        : 'text-slate-400'
                    }`}
                  >
                    Hitung per World
                  </button>
                  <button
                    onClick={() => setInputMode('trees')}
                    className={`px-3 py-1 rounded-lg font-semibold transition-colors cursor-pointer ${
                      inputMode === 'trees'
                        ? 'bg-emerald-500 text-slate-950 font-bold'
                        : 'text-slate-400'
                    }`}
                  >
                    Hitung per Pohon
                  </button>
                </div>
              </div>

              {inputMode === 'world' ? (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-slate-300">
                      Jumlah World:{' '}
                      <strong className="text-emerald-400 text-sm font-game font-black">
                        {worldCount} World
                      </strong>
                    </span>
                    <span className="text-xs text-slate-400">
                      = {effectiveTreeCount.toLocaleString()} total pohon
                    </span>
                  </div>

                  {/* Preset world buttons */}
                  <div className="grid grid-cols-5 gap-2 mb-3">
                    {[1, 2, 3, 5, 10].map((num) => (
                      <button
                        key={num}
                        onClick={() => setWorldCount(num)}
                        className={`py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                          worldCount === num
                            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50 shadow-sm'
                            : 'bg-slate-800/80 text-slate-300 border-slate-700 hover:bg-slate-700'
                        }`}
                      >
                        {num} World
                      </button>
                    ))}
                  </div>

                  {/* Slider */}
                  <input
                    type="range"
                    min="1"
                    max="50"
                    value={worldCount}
                    onChange={(e) => setWorldCount(Number(e.target.value))}
                    className="w-full accent-emerald-400 cursor-pointer h-2 bg-slate-800 rounded-lg"
                  />
                  <div className="flex justify-between text-[10px] text-slate-500 mt-1">
                    <span>1 World</span>
                    <span>25 World</span>
                    <span>50 World</span>
                  </div>
                </div>
              ) : (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-slate-300">
                      Total Pohon:{' '}
                      <strong className="text-emerald-400 text-sm font-game font-black">
                        {treeCount.toLocaleString()} Pohon
                      </strong>
                    </span>
                    <span className="text-xs text-slate-400">
                      ~{(treeCount / 2600).toFixed(1)} World
                    </span>
                  </div>

                  <div className="grid grid-cols-4 gap-2 mb-3">
                    {[500, 1000, 2600, 5200].map((count) => (
                      <button
                        key={count}
                        onClick={() => setTreeCount(count)}
                        className={`py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                          treeCount === count
                            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50 shadow-sm'
                            : 'bg-slate-800/80 text-slate-300 border-slate-700 hover:bg-slate-700'
                        }`}
                      >
                        {count.toLocaleString()}
                      </button>
                    ))}
                  </div>

                  <input
                    type="range"
                    min="100"
                    max="50000"
                    step="100"
                    value={treeCount}
                    onChange={(e) => setTreeCount(Number(e.target.value))}
                    className="w-full accent-emerald-400 cursor-pointer h-2 bg-slate-800 rounded-lg"
                  />
                  <div className="flex justify-between text-[10px] text-slate-500 mt-1">
                    <span>100 Pohon</span>
                    <span>25,000 Pohon</span>
                    <span>50,000 Pohon</span>
                  </div>
                </div>
              )}

              {/* Buffs & Multipliers */}
              <div className="pt-4 border-t border-slate-800/80">
                <span className="text-xs font-semibold text-slate-400 block mb-2.5">
                  Buff & Alat Bantu Farming:
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <label
                    onClick={() => setHasLuckyClover(!hasLuckyClover)}
                    className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center gap-2.5 select-none ${
                      hasLuckyClover
                        ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={hasLuckyClover}
                      onChange={() => {}}
                      className="sr-only"
                    />
                    <div className="text-lg">🍀</div>
                    <div>
                      <span className="text-xs font-bold block leading-tight">Lucky Clover</span>
                      <span className="text-[10px] text-emerald-400/80">+10% Gems</span>
                    </div>
                  </label>

                  <label
                    onClick={() => setHasSorrowHarvester(!hasSorrowHarvester)}
                    className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center gap-2.5 select-none ${
                      hasSorrowHarvester
                        ? 'bg-purple-500/15 border-purple-500/40 text-purple-300'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={hasSorrowHarvester}
                      onChange={() => {}}
                      className="sr-only"
                    />
                    <div className="text-lg">🌾</div>
                    <div>
                      <span className="text-xs font-bold block leading-tight">Harvester Sorrow</span>
                      <span className="text-[10px] text-purple-400/80">+1.5% Seed Drop</span>
                    </div>
                  </label>

                  <label
                    onClick={() => setHasRaymanBFG(!hasRaymanBFG)}
                    className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center gap-2.5 select-none ${
                      hasRaymanBFG
                        ? 'bg-amber-500/15 border-amber-500/40 text-amber-300'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={hasRaymanBFG}
                      onChange={() => {}}
                      className="sr-only"
                    />
                    <div className="text-lg">⚡</div>
                    <div>
                      <span className="text-xs font-bold block leading-tight">Rayman / BFG</span>
                      <span className="text-[10px] text-amber-400/80">Break 4x Cepat</span>
                    </div>
                  </label>
                </div>
              </div>
            </div>

            {/* Right: Summary Card (Very Satisfying & Clean Output) */}
            <div className="lg:col-span-5 p-6 rounded-3xl bg-gradient-to-b from-[#0f2425] via-[#0c1a24] to-[#09121d] border-2 border-emerald-500/50 shadow-2xl relative overflow-hidden flex flex-col justify-between">
              <div className="absolute top-0 right-0 w-40 h-40 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

              <div>
                <div className="flex items-center justify-between pb-3 border-b border-emerald-500/20">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{currentPreset.icon}</span>
                    <span className="font-extrabold text-base text-slate-100 font-game tracking-wider">
                      ESTIMASI HASIL PANEN
                    </span>
                  </div>
                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-400 text-slate-950 font-black">
                    {effectiveTreeCount.toLocaleString()} POHON
                  </span>
                </div>

                {/* Big Profit Highlights */}
                <div className="grid grid-cols-2 gap-3 my-4">
                  {/* Gems output */}
                  <div className="p-3 rounded-2xl bg-[#091621] border border-emerald-500/30">
                    <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                      Estimasi Gems
                    </span>
                    <div className="text-2xl font-black text-amber-400 font-game flex items-center gap-1 mt-0.5">
                      <span>💎</span>
                      <span>~{calculation.estGems.toLocaleString()}</span>
                    </div>
                    <span className="text-[10px] text-slate-400 block mt-0.5">
                      Ekuivalen <strong className="text-emerald-400">{calculation.wlFromGems} WL</strong>
                    </span>
                  </div>

                  {/* Seed Output & Surplus */}
                  <div className="p-3 rounded-2xl bg-[#091621] border border-emerald-500/30">
                    <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                      Hasil Seed
                    </span>
                    <div className="text-2xl font-black text-emerald-400 font-game flex items-center gap-1 mt-0.5">
                      <span>🌱</span>
                      <span>~{calculation.estSeedsReturned.toLocaleString()}</span>
                    </div>
                    <span className="text-[10px] text-emerald-300 font-semibold block mt-0.5">
                      +{calculation.surplusSeeds.toLocaleString()} surplus bibit!
                    </span>
                  </div>
                </div>

                {/* Total Net Profit in World Locks & Diamond Locks */}
                <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/15 to-emerald-500/15 border border-amber-500/40 my-3 text-center">
                  <span className="text-[11px] font-bold text-amber-300 uppercase tracking-wider block">
                    Total Estimasi Keuntungan Bersih (Gems + Surplus Seed)
                  </span>
                  <div className="text-3xl font-black text-slate-50 font-game mt-1 flex items-center justify-center gap-2">
                    <span className="text-amber-400">🗝️ +{calculation.totalWlProfit} WL</span>
                    {calculation.dlProfit >= 1 && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-bold">
                        💠 {calculation.dlProfit} DL
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    Bisa beli ~{Math.floor(calculation.estGems / 8000)} Surgery Pack atau ~{Math.floor(calculation.estGems / 500)} SSP!
                  </span>
                </div>

                {/* Secondary details */}
                <div className="text-xs text-slate-300 space-y-1.5 py-2">
                  <div className="flex justify-between text-slate-400">
                    <span>Estimasi Blok Drop:</span>
                    <span className="text-slate-200 font-medium">
                      ~{calculation.estBlocks.toLocaleString()} blok
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Estimasi Waktu Break:</span>
                    <span className="text-amber-400 font-semibold">
                      ~{calculation.hoursToBreak} jam {hasRaymanBFG ? '(Mode BFG)' : '(Manual)'}
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Durasi Tumbuh Pohon:</span>
                    <span className="text-emerald-400 font-semibold">
                      {calculation.growthDays} hari {calculation.growthHours} jam
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons: Apply to World & Log Sale */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mt-4">
                <button
                  type="button"
                  onClick={() => {
                    setSalePreset({
                      title: `Jual Gems & Surplus Seed ${selectedCrop}`,
                      category: 'gems',
                      itemSold: `${selectedCrop} (Gems & Seed)`,
                      quantity: calculation.estGems,
                      quantityUnit: 'Gems',
                      revenueWl: calculation.totalWlProfit,
                      priceRate: `~${calculation.wlFromGems} WL gems + ${calculation.wlFromSurplusSeeds} WL seed`,
                      notes: `Hasil panen kalkulasi ${effectiveTreeCount.toLocaleString()} pohon ${selectedCrop}`,
                    });
                    setIsSaleModalOpen(true);
                  }}
                  className="py-3 px-3 rounded-xl bg-[#142338] hover:bg-[#1a2e49] border border-amber-500/40 text-amber-300 font-bold text-xs shadow-md active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Coins className="w-4 h-4 text-amber-400" />
                  <span>Catat ke Penjualan</span>
                </button>

                {onApplyToNewWorld && (
                  <button
                    type="button"
                    onClick={() =>
                      onApplyToNewWorld({
                        cropType: selectedCrop,
                        treeCount: effectiveTreeCount,
                        days: currentPreset.days,
                        hours: currentPreset.hours,
                        minutes: currentPreset.minutes,
                      })
                    }
                    className="py-3 px-3 rounded-xl bg-gradient-to-r from-emerald-500 via-emerald-400 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/30 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <PlusCircle className="w-4 h-4" />
                    <span>Jadikan World Baru</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODE 2: KONVERSI GEMS KE WORLD LOCK (PACK COMPARATOR) */}
      {calcMode === 'packs' && (
        <div className="space-y-6">
          <div className="p-6 rounded-3xl bg-[#0f172a] border border-slate-800 shadow-xl space-y-4">
            <div>
              <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider font-game flex items-center gap-2">
                <Gem className="w-4 h-4 text-amber-400" />
                Input Jumlah Gems Milik Anda
              </h3>
              <p className="text-xs text-slate-400">
                Lihat pack store mana yang memberikan return World Lock paling maksimal
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3">
              <div className="relative flex-1 w-full">
                <input
                  type="number"
                  min="0"
                  step="500"
                  value={gemsToConvert}
                  onChange={(e) => setGemsToConvert(Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-full pl-10 pr-4 py-3 rounded-2xl bg-[#142038] border border-slate-700 focus:border-amber-500 text-slate-100 font-game text-xl font-black tracking-wider transition-all"
                />
                <span className="absolute left-3.5 top-3 text-lg">💎</span>
                <span className="absolute right-3.5 top-3.5 text-xs text-slate-400 font-medium">
                  Gems
                </span>
              </div>

              {/* Quick preset gem buttons */}
              <div className="flex items-center gap-1.5 flex-wrap w-full sm:w-auto">
                {[10000, 50000, 100000, 250000, 500000].map((amount) => (
                  <button
                    key={amount}
                    onClick={() => setGemsToConvert(amount)}
                    className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 border border-slate-700 transition-colors cursor-pointer"
                  >
                    {(amount / 1000).toFixed(0)}k
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Cards for each pack */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {packComparisons.map((pack, idx) => {
              const packCount = Math.floor(gemsToConvert / pack.gemCost);
              const totalWlEstimate = parseFloat((packCount * pack.estimatedWlReturn).toFixed(1));
              const isBest = idx === 0;

              return (
                <div
                  key={pack.name}
                  className={`p-5 rounded-3xl border transition-all flex flex-col justify-between shadow-xl ${
                    isBest
                      ? 'bg-gradient-to-b from-[#0a231d] to-[#0d1624] border-emerald-500/60 shadow-emerald-500/10'
                      : 'bg-[#0f172a] border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2.5">
                        <span className="text-3xl">{pack.icon}</span>
                        <div>
                          <h4 className="font-extrabold text-base text-slate-100 font-game tracking-wider">
                            {pack.name}
                          </h4>
                          <span className="text-xs text-amber-400 font-mono">
                            {pack.gemCost.toLocaleString()} Gems / pack
                          </span>
                        </div>
                      </div>

                      <span
                        className={`text-[9px] font-black px-2 py-0.5 rounded-full border ${pack.badgeColor}`}
                      >
                        {pack.badge}
                      </span>
                    </div>

                    <p className="text-xs text-slate-400 mt-2 mb-4 leading-relaxed">
                      {pack.note}
                    </p>

                    {/* Output breakdown */}
                    <div className="p-3 rounded-2xl bg-[#121c33] border border-slate-800 space-y-2">
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-slate-400">Pack Bisa Dibeli:</span>
                        <span className="font-extrabold text-slate-100 text-sm font-game">
                          {packCount} Pack
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-slate-400">Total World Lock:</span>
                        <span className="font-black text-amber-400 text-base font-game">
                          ~{totalWlEstimate} WL
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-[11px] text-slate-500 pt-1 border-t border-slate-800">
                        <span>Rasio Efisiensi:</span>
                        <span>1 WL = ~{Math.round(pack.ratioGemsPerWl)} gems</span>
                      </div>
                    </div>
                  </div>

                    <div className="mt-4 space-y-2">
                      <button
                        type="button"
                        disabled={packCount === 0}
                        onClick={() => {
                          setSalePreset({
                            title: `Jual ${gemsToConvert.toLocaleString()} Gems (${packCount}x ${pack.name})`,
                            category: 'pack',
                            itemSold: pack.name,
                            quantity: packCount,
                            quantityUnit: 'Pack',
                            revenueWl: totalWlEstimate,
                            priceRate: `1 pack = ~${pack.estimatedWlReturn} WL (${pack.gemCost} gems)`,
                            notes: `Konversi dari ${gemsToConvert.toLocaleString()} Gems`,
                          });
                          setIsSaleModalOpen(true);
                        }}
                        className="w-full py-2 px-3 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-300 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        <Coins className="w-3.5 h-3.5" />
                        <span>Catat Penjualan {pack.name}</span>
                      </button>

                      <div className="text-center">
                        <span
                          className={`text-[11px] font-bold ${
                            isBest ? 'text-emerald-400' : 'text-slate-500'
                          }`}
                        >
                          {isBest ? '⭐ Rekomendasi Profit Tertinggi' : 'Pilihan Standar'}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* MODE 3: PERENCANA ROTASI HARIAN (CYCLE PLANNER) */}
      {calcMode === 'cycle' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Input Form */}
            <div className="lg:col-span-5 p-6 rounded-3xl bg-[#0f172a] border border-slate-800 shadow-xl space-y-5">
              <div>
                <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider font-game flex items-center gap-2">
                  <RotateCw className="w-4 h-4 text-cyan-400" />
                  Target Rutinitas Panen
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Atur seberapa sering Anda ingin panen world agar rotasi tidak pernah kosong
                </p>
              </div>

              {/* Crop selection for cycle */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Jenis Tanaman Rotasi
                </label>
                <select
                  value={cycleCrop}
                  onChange={(e) => setCycleCrop(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-[#142038] border border-slate-700 text-slate-100 text-sm font-medium focus:border-cyan-500"
                >
                  {CROP_PRESETS.slice(0, 6).map((crop) => (
                    <option key={crop.name} value={crop.name}>
                      {crop.icon} {crop.name} (Tumbuh: {crop.days}h {crop.hours}j)
                    </option>
                  ))}
                </select>
              </div>

              {/* Desired Harvest Interval */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Frekuensi Panen yang Diinginkan
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { label: 'Setiap Hari', days: 1 },
                    { label: 'Tiap 2 Hari', days: 2 },
                    { label: 'Tiap 3 Hari', days: 3 },
                  ].map((item) => (
                    <button
                      key={item.days}
                      type="button"
                      onClick={() => setTargetHarvestIntervalDays(item.days)}
                      className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                        targetHarvestIntervalDays === item.days
                          ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50'
                          : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Strategy Blueprint Output */}
            <div className="lg:col-span-7 p-6 rounded-3xl bg-gradient-to-b from-[#0e2133] via-[#0c1a29] to-[#0a121f] border-2 border-cyan-500/40 shadow-2xl space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-cyan-500/20">
                <div className="flex items-center gap-2">
                  <span className="text-xl">📋</span>
                  <h4 className="font-black text-base text-slate-100 font-game tracking-wider uppercase">
                    BLUEPRINT ROTASI {cycleCrop.toUpperCase()}
                  </h4>
                </div>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-bold">
                  Panen Tiap {targetHarvestIntervalDays} Hari Sekali
                </span>
              </div>

              {/* Big Metrics */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div className="p-3.5 rounded-2xl bg-[#091524] border border-cyan-500/20 text-center">
                  <span className="text-[10px] text-slate-400 uppercase font-medium block">
                    World Dibutuhkan
                  </span>
                  <span className="text-2xl font-black text-cyan-400 font-game mt-0.5 block">
                    {cycleCalculation.requiredWorlds} World
                  </span>
                  <span className="text-[9px] text-slate-500">agar panen tanpa jeda</span>
                </div>

                <div className="p-3.5 rounded-2xl bg-[#091524] border border-cyan-500/20 text-center">
                  <span className="text-[10px] text-slate-400 uppercase font-medium block">
                    Total Modal Seed
                  </span>
                  <span className="text-2xl font-black text-emerald-400 font-game mt-0.5 block">
                    ~{(cycleCalculation.totalSeedsRequired / 1000).toFixed(1)}k
                  </span>
                  <span className="text-[9px] text-slate-500">2,600 seed / world</span>
                </div>

                <div className="p-3.5 rounded-2xl bg-[#091524] border border-cyan-500/20 text-center col-span-2 sm:col-span-1">
                  <span className="text-[10px] text-slate-400 uppercase font-medium block">
                    Proyeksi Profit / Bulan
                  </span>
                  <span className="text-2xl font-black text-amber-400 font-game mt-0.5 block">
                    ~{cycleCalculation.monthlyWlProfit} WL
                  </span>
                  <span className="text-[9px] text-slate-500">
                    {cycleCalculation.monthlyHarvestCount}x panen per bulan
                  </span>
                </div>
              </div>

              {/* Visual Schedule Timeline Simulation */}
              <div className="p-4 rounded-2xl bg-[#08111d] border border-slate-800 space-y-2 mt-2">
                <span className="text-xs font-bold text-slate-300 block mb-1">
                  📅 Contoh Simulasi Jadwal Rotasi:
                </span>
                <div className="space-y-1.5 text-xs text-slate-300">
                  {Array.from({ length: Math.min(5, cycleCalculation.requiredWorlds) }).map(
                    (_, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between p-2 rounded-xl bg-slate-900/60 border border-slate-800"
                      >
                        <span className="font-semibold text-slate-200">
                          World #{i + 1} ({cycleCrop})
                        </span>
                        <span className="text-cyan-400 font-mono text-[11px]">
                          Tanam Hari ke-{i * targetHarvestIntervalDays + 1} ➔ Panen Hari ke-
                          {i * targetHarvestIntervalDays +
                            1 +
                            Math.round(cycleCalculation.totalHours / 24)}
                        </span>
                      </div>
                    )
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODE 4: CATATAN HASIL PENJUALAN GEMS & LAINNYA */}
      {calcMode === 'sales' && (
        <div className="space-y-6">
          {/* Top 4 Summary Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {/* 1. Total Pendapatan World Lock */}
            <div className="p-4 sm:p-5 rounded-3xl bg-[#0f172a] border border-amber-500/40 shadow-xl relative overflow-hidden">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider">
                  Total Pendapatan
                </span>
                <span className="text-xl">🗝️</span>
              </div>
              <div className="text-2xl sm:text-3xl font-black text-slate-100 font-game">
                +{salesStats.totalRevenueWl.toLocaleString()} <span className="text-amber-400 text-lg">WL</span>
              </div>
              <div className="flex items-center gap-1.5 mt-2">
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-bold">
                  💠 ~{salesStats.totalDl} DL
                </span>
                {salesStats.totalDl >= 100 && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 font-bold">
                    🔮 {(salesStats.totalDl / 100).toFixed(2)} BGL
                  </span>
                )}
              </div>
            </div>

            {/* 2. Total Gems Terjual */}
            <div className="p-4 sm:p-5 rounded-3xl bg-[#0f172a] border border-emerald-500/40 shadow-xl relative overflow-hidden">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider">
                  Gems Diuangkan
                </span>
                <span className="text-xl">💎</span>
              </div>
              <div className="text-2xl sm:text-3xl font-black text-slate-100 font-game">
                {salesStats.totalGems.toLocaleString()}
              </div>
              <span className="text-[10px] text-slate-400 block mt-2">
                Hasil rotasi BFG & panen farm
              </span>
            </div>

            {/* 3. Total Transaksi */}
            <div className="p-4 sm:p-5 rounded-3xl bg-[#0f172a] border border-slate-800 shadow-xl relative overflow-hidden">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Total Transaksi
                </span>
                <span className="text-xl">📦</span>
              </div>
              <div className="text-2xl sm:text-3xl font-black text-slate-100 font-game">
                {salesStats.count} <span className="text-slate-400 text-base">Order</span>
              </div>
              <span className="text-[10px] text-emerald-400 font-medium block mt-2">
                Tersinkron otomatis ke cloud
              </span>
            </div>

            {/* 4. Rata-rata per Transaksi */}
            <div className="p-4 sm:p-5 rounded-3xl bg-[#0f172a] border border-slate-800 shadow-xl relative overflow-hidden">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Rata-rata Profit
                </span>
                <span className="text-xl">📈</span>
              </div>
              <div className="text-2xl sm:text-3xl font-black text-amber-400 font-game">
                ~{salesStats.avgWl} <span className="text-slate-400 text-base">WL</span>
              </div>
              <span className="text-[10px] text-slate-400 block mt-2">
                Per transaksi penjualan
              </span>
            </div>
          </div>

          {/* Controls Bar: Filter, Search, & Tambah Button */}
          <div className="p-4 sm:p-5 rounded-3xl bg-[#0f172a] border border-slate-800 shadow-xl space-y-3">
            <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
              {/* Search Bar */}
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  value={salesSearch}
                  onChange={(e) => setSalesSearch(e.target.value)}
                  placeholder="Cari transaksi, item (gems, pack, seed), pembeli, world..."
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-[#142038] border border-slate-700 text-slate-100 text-xs sm:text-sm focus:border-amber-500 transition-all placeholder:text-slate-500"
                />
                {salesSearch && (
                  <button
                    onClick={() => setSalesSearch('')}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-white"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Sorting & Add Button */}
              <div className="flex items-center gap-2">
                <select
                  value={salesSort}
                  onChange={(e) => setSalesSort(e.target.value as any)}
                  className="px-3 py-2.5 rounded-xl bg-[#142038] border border-slate-700 text-slate-300 text-xs font-semibold"
                >
                  <option value="newest">🕒 Tanggal Terkini</option>
                  <option value="revenueHigh">💰 Pendapatan Tertinggi</option>
                  <option value="quantityHigh">📊 Jumlah Terbanyak</option>
                </select>

                {/* Ekspor CSV Button */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowExportMenu((prev) => !prev)}
                    className="px-3 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700/80 hover:border-amber-500/50 text-slate-200 hover:text-amber-300 font-bold text-xs active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
                    title="Ekspor riwayat transaksi penjualan ke format CSV (Excel / Spreadsheet)"
                  >
                    <Download className="w-4 h-4 text-amber-400" />
                    <span className="hidden sm:inline">Ekspor CSV</span>
                  </button>

                  {showExportMenu && (
                    <>
                      <div
                        className="fixed inset-0 z-20"
                        onClick={() => setShowExportMenu(false)}
                      />
                      <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-[#0f172a] border border-slate-700 shadow-2xl p-2 z-30 animate-in fade-in zoom-in-95">
                        <div className="px-2.5 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-800 flex items-center gap-1.5">
                          <FileSpreadsheet className="w-3.5 h-3.5 text-amber-400" />
                          <span>Format CSV (Excel)</span>
                        </div>
                        <div className="pt-1.5 space-y-1">
                          <button
                            type="button"
                            onClick={() => {
                              exportSalesRecordsToCsv(filteredSales);
                              setExportNotification(`Berhasil mengekspor ${filteredSales.length} transaksi (sesuai filter) ke CSV!`);
                              setShowExportMenu(false);
                              setTimeout(() => setExportNotification(null), 4000);
                            }}
                            className="w-full text-left px-3 py-2 rounded-xl text-xs hover:bg-amber-500/15 text-slate-200 hover:text-amber-300 font-medium flex items-center justify-between cursor-pointer transition-colors"
                          >
                            <span>Ekspor Hasil Filter</span>
                            <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-slate-800 text-amber-400 font-mono font-bold">
                              {filteredSales.length}
                            </span>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              exportSalesRecordsToCsv(salesRecords);
                              setExportNotification(`Berhasil mengekspor semua (${salesRecords.length}) riwayat penjualan ke CSV!`);
                              setShowExportMenu(false);
                              setTimeout(() => setExportNotification(null), 4000);
                            }}
                            className="w-full text-left px-3 py-2 rounded-xl text-xs hover:bg-amber-500/15 text-slate-200 hover:text-amber-300 font-medium flex items-center justify-between cursor-pointer transition-colors"
                          >
                            <span>Ekspor Semua Catatan</span>
                            <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-slate-800 text-slate-300 font-mono font-bold">
                              {salesRecords.length}
                            </span>
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setSalePreset(null);
                    setIsSaleModalOpen(true);
                  }}
                  className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-400 to-amber-400 hover:from-emerald-400 hover:to-amber-300 text-slate-950 font-black text-xs shadow-md shadow-emerald-500/20 active:scale-95 transition-all flex items-center gap-1.5 shrink-0 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span className="hidden sm:inline">Catat Penjualan Baru</span>
                  <span className="sm:hidden">Tambah</span>
                </button>
              </div>
            </div>

            {/* Export Notification Banner */}
            {exportNotification && (
              <div className="p-3 rounded-2xl bg-amber-500/15 border border-amber-500/40 text-amber-300 text-xs flex items-center justify-between shadow-lg shadow-amber-950/40 animate-in fade-in slide-in-from-top-1">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
                  <span className="font-semibold">{exportNotification}</span>
                </div>
                <button
                  onClick={() => setExportNotification(null)}
                  className="p-1 text-amber-400/80 hover:text-amber-200 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Category Filter Pills */}
            <div className="flex items-center gap-1.5 flex-wrap pt-1 border-t border-slate-800/80">
              <span className="text-[11px] font-semibold text-slate-400 mr-1">Kategori:</span>
              {[
                { id: 'all', label: 'Semua', count: salesRecords.length },
                { id: 'gems', label: '💎 Gems', count: salesRecords.filter((r) => r.category === 'gems').length },
                { id: 'seed', label: '🌱 Seed', count: salesRecords.filter((r) => r.category === 'seed').length },
                { id: 'pack', label: '📦 Pack', count: salesRecords.filter((r) => r.category === 'pack').length },
                { id: 'block', label: '🧱 Block', count: salesRecords.filter((r) => r.category === 'block').length },
                { id: 'lock', label: '🗝️ Lock / DL', count: salesRecords.filter((r) => r.category === 'lock').length },
                { id: 'other', label: '🛠️ Lainnya', count: salesRecords.filter((r) => r.category === 'other').length },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setSalesCategoryFilter(tab.id as any)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                    salesCategoryFilter === tab.id
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50 shadow-sm'
                      : 'bg-slate-900/60 text-slate-400 border border-slate-800 hover:text-slate-200'
                  }`}
                >
                  <span>{tab.label}</span>
                  <span className="px-1.5 py-0.2 rounded-md bg-slate-800 text-[10px] text-slate-400 font-mono">
                    {tab.count}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Sales Records List */}
          {filteredSales.length === 0 ? (
            <div className="p-8 sm:p-12 rounded-3xl bg-[#0f172a] border border-slate-800 text-center space-y-4">
              <div className="w-16 h-16 rounded-3xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-3xl mx-auto text-amber-400">
                <Coins className="w-8 h-8" />
              </div>
              <div className="max-w-md mx-auto space-y-1">
                <h4 className="font-extrabold text-base text-slate-200 font-game tracking-wider">
                  {salesRecords.length === 0
                    ? 'BELUM ADA CATATAN PENJUALAN'
                    : 'TIDAK ADA TRANSAKSI YANG COCOK'}
                </h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  {salesRecords.length === 0
                    ? 'Catat hasil penjualan gems, surplus seed, atau konversi store pack dari hasil farming Anda untuk memantau pendapatan World Lock.'
                    : 'Coba ubah kata kunci pencarian atau ganti filter kategori.'}
                </p>
              </div>
              {salesRecords.length === 0 ? (
                <button
                  type="button"
                  onClick={() => {
                    setSalePreset(null);
                    setIsSaleModalOpen(true);
                  }}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/20 active:scale-95 transition-all cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Catat Penjualan Pertama</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setSalesSearch('');
                    setSalesCategoryFilter('all');
                  }}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer"
                >
                  Reset Filter
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {filteredSales.map((sale) => {
                const dateObj = new Date(sale.date);
                const dateStr = dateObj.toLocaleDateString('id-ID', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                });
                const timeStr = dateObj.toLocaleTimeString('id-ID', {
                  hour: '2-digit',
                  minute: '2-digit',
                });

                // Category badge colors
                const categoryConfig = {
                  gems: { label: 'GEMS', bg: 'bg-amber-500/15 text-amber-300 border-amber-500/30', icon: '💎' },
                  seed: { label: 'SEED', bg: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30', icon: '🌱' },
                  block: { label: 'BLOCK', bg: 'bg-orange-500/15 text-orange-300 border-orange-500/30', icon: '🧱' },
                  pack: { label: 'PACK', bg: 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30', icon: '📦' },
                  lock: { label: 'LOCK', bg: 'bg-yellow-500/15 text-yellow-300 border-yellow-500/30', icon: '🗝️' },
                  other: { label: 'LAINNYA', bg: 'bg-slate-700/40 text-slate-300 border-slate-700', icon: '🛠️' },
                }[sale.category] || { label: 'TRANSAKSI', bg: 'bg-slate-800 text-slate-300 border-slate-700', icon: '💰' };

                return (
                  <div
                    key={sale.id}
                    className="p-4 sm:p-5 rounded-2xl bg-[#0f172a] border border-slate-800/90 hover:border-slate-700 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-lg group"
                  >
                    {/* Left: Info & Details */}
                    <div className="space-y-2 flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black border ${categoryConfig.bg}`}
                        >
                          <span>{categoryConfig.icon}</span>
                          <span>{categoryConfig.label}</span>
                        </span>

                        <span className="text-[11px] text-slate-500 font-mono">
                          {dateStr} • {timeStr}
                        </span>

                        {sale.worldName && (
                          <span className="text-[10px] px-2 py-0.5 rounded-md bg-slate-900 border border-slate-800 text-cyan-400 font-mono flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {sale.worldName}
                          </span>
                        )}

                        {sale.buyerName && (
                          <span className="text-[10px] px-2 py-0.5 rounded-md bg-slate-900 border border-slate-800 text-emerald-400 flex items-center gap-1 font-medium">
                            <User className="w-3 h-3" />
                            {sale.buyerName}
                          </span>
                        )}
                      </div>

                      <div>
                        <h4 className="font-extrabold text-sm sm:text-base text-slate-100 group-hover:text-emerald-300 transition-colors">
                          {sale.title}
                        </h4>
                        <div className="flex items-center gap-3 text-xs text-slate-400 mt-0.5 flex-wrap">
                          <span>
                            Item: <strong className="text-slate-200">{sale.itemSold}</strong>
                          </span>
                          <span>•</span>
                          <span>
                            Jumlah:{' '}
                            <strong className="text-amber-400 font-mono font-semibold">
                              {sale.quantity.toLocaleString()} {sale.quantityUnit}
                            </strong>
                          </span>
                          {sale.priceRate && (
                            <>
                              <span>•</span>
                              <span className="text-slate-400 italic">
                                Rate: <span className="text-slate-300 font-medium">{sale.priceRate}</span>
                              </span>
                            </>
                          )}
                        </div>
                      </div>

                      {sale.notes && (
                        <p className="text-xs text-slate-400 bg-slate-900/60 p-2 rounded-xl border border-slate-800/80 leading-relaxed italic">
                          "{sale.notes}"
                        </p>
                      )}
                    </div>

                    {/* Right: Revenue & Actions */}
                    <div className="flex items-center sm:flex-col sm:items-end justify-between sm:justify-center border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-800/80 gap-2 shrink-0">
                      <div className="text-left sm:text-right">
                        <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider block">
                          Pendapatan
                        </span>
                        <div className="text-xl sm:text-2xl font-black text-amber-400 font-game flex items-center gap-1">
                          <span>🗝️</span>
                          <span>+{sale.revenueWl.toLocaleString()} WL</span>
                        </div>
                        {sale.revenueWl >= 100 && (
                          <span className="text-[11px] font-bold text-cyan-300 block">
                            💠 {(sale.revenueWl / 100).toFixed(2)} DL
                          </span>
                        )}
                      </div>

                      {onDeleteSaleRecord && (
                        <button
                          type="button"
                          onClick={() => setSaleToDelete(sale)}
                          title="Hapus Catatan Penjualan"
                          className="p-2 rounded-xl text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Sales Tracker Modal */}
      <SalesTrackerModal
        isOpen={isSaleModalOpen}
        onClose={() => {
          setIsSaleModalOpen(false);
          setSalePreset(null);
        }}
        onSave={(newRecord) => {
          if (onAddSaleRecord) {
            onAddSaleRecord(newRecord);
          }
          setCalcMode('sales');
        }}
        initialPreset={salePreset}
        worlds={worlds}
      />

      {/* Confirmation Modal for Sale Record Deletion */}
      <ConfirmDeleteModal
        isOpen={Boolean(saleToDelete)}
        title="Hapus Catatan Penjualan"
        itemName={saleToDelete?.title || ''}
        itemTypeLabel="Penjualan"
        description="Catatan ini akan dihapus dari histori kalkulator & laporan pendapatan farm Anda."
        onConfirm={() => {
          if (saleToDelete && onDeleteSaleRecord) {
            onDeleteSaleRecord(saleToDelete.id);
            setSaleToDelete(null);
          }
        }}
        onClose={() => setSaleToDelete(null)}
      />
    </div>
  );
};
