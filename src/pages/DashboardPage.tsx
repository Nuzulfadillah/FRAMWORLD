import React, { useState, useMemo } from 'react';
import { World, GrowAccount, FarmSaleRecord } from '../types';
import { CROP_PRESETS } from '../data/presets';
import { getWorldStatus, getCountdownInfo, formatDateTime } from '../utils/time';
import { EmptyState } from '../components/EmptyState';
import { CropProgressBar } from '../components/CropProgressBar';
import { HarvestRevenueChart } from '../components/HarvestRevenueChart';
import { UpcomingHarvest } from '../components/UpcomingHarvest';
import {
  Globe2,
  Sparkles,
  Clock,
  Users,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  TrendingUp,
  ArrowRight,
  PlusCircle,
  Gem,
  ExternalLink,
  Calculator,
  Sprout,
  Search,
  Filter,
} from 'lucide-react';

interface DashboardPageProps {
  worlds: World[];
  accounts: GrowAccount[];
  salesRecords?: FarmSaleRecord[];
  currentTimeMs: number;
  onOpenAddWorld: () => void;
  onSelectWorld: (world: World) => void;
  onHarvestWorld: (world: World) => void;
  onNavigateToWorlds: (filterStatus?: string) => void;
  onNavigateToAccounts: () => void;
  onNavigateToCalculator?: () => void;
  onPlantWorld?: (world: World) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  worlds,
  accounts,
  salesRecords = [],
  currentTimeMs,
  onOpenAddWorld,
  onSelectWorld,
  onHarvestWorld,
  onNavigateToWorlds,
  onNavigateToAccounts,
  onNavigateToCalculator,
  onPlantWorld,
}) => {
  // Categorize worlds
  const readyWorlds = worlds.filter((w) => {
    const s = getWorldStatus(w, currentTimeMs);
    return s === 'ready' || s === 'overdue';
  });

  const growingWorlds = worlds.filter((w) => {
    return getWorldStatus(w, currentTimeMs) === 'growing';
  });

  const emptyWorlds = worlds.filter((w) => {
    return getWorldStatus(w, currentTimeMs) === 'empty';
  });

  const [growingTab, setGrowingTab] = useState<'soonest' | 'all'>('soonest');
  const [dashboardSearch, setDashboardSearch] = useState('');

  // Top 5 worlds closest to harvest
  const soonestWorlds = useMemo(() => {
    return [...growingWorlds]
      .sort((a, b) => new Date(a.harvestAt).getTime() - new Date(b.harvestAt).getTime())
      .slice(0, 5);
  }, [growingWorlds]);

  // Displayed worlds for Sedang Tumbuh section
  const displayedGrowingWorlds = useMemo(() => {
    let list = growingTab === 'soonest' ? soonestWorlds : [...growingWorlds].sort(
      (a, b) => new Date(a.harvestAt).getTime() - new Date(b.harvestAt).getTime()
    );

    if (dashboardSearch.trim()) {
      const q = dashboardSearch.toLowerCase();
      list = list.filter(
        (w) =>
          w.name.toLowerCase().includes(q) ||
          w.cropType.toLowerCase().includes(q) ||
          (w.notes || '').toLowerCase().includes(q)
      );
    }

    return list;
  }, [growingTab, soonestWorlds, growingWorlds, dashboardSearch]);

  const totalTrees = worlds.reduce((acc, w) => acc + (w.treeCount || 0), 0);

  const getAccountName = (accountId: string) => {
    const acc = accounts.find((a) => a.id === accountId);
    return acc ? acc.growId : 'Umum';
  };

  const getCropIcon = (cropType: string) => {
    const p = CROP_PRESETS.find((c) => c.name === cropType);
    return p ? p.icon : '🌱';
  };

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-200">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl p-6 sm:p-8 bg-gradient-to-r from-[#0d1c2d] via-[#10223b] to-[#0c182a] border border-slate-700/80 shadow-xl">
        <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 w-60 h-60 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 flex-wrap mb-3">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-bold tracking-wide uppercase">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                <span>Monitoring Realtime</span>
              </div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 text-xs font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                <span>🌐 Tersinkron Antar Device (HP & Laptop)</span>
              </div>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-50 font-game tracking-wider">
              DASHBOARD FARMING GROWTOPIA
            </h1>
            <p className="text-slate-400 text-xs sm:text-sm mt-1 max-w-xl">
              Pantau siklus panen pohon, hitung mundur detik, dan optimalkan rotasi world farm Anda tanpa ketinggalan waktu panen.
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
            {onNavigateToCalculator && (
              <button
                onClick={onNavigateToCalculator}
                className="px-3.5 py-2.5 rounded-xl bg-[#142038] hover:bg-slate-800 text-amber-300 border border-amber-500/40 font-bold text-xs sm:text-sm shadow-md active:scale-95 transition-all flex items-center gap-2 cursor-pointer"
              >
                <Calculator className="w-4 h-4 text-amber-400" />
                <span>Kalkulator Farm</span>
              </button>
            )}

            <button
              onClick={onOpenAddWorld}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-bold text-xs sm:text-sm shadow-lg shadow-emerald-500/25 active:scale-95 transition-all flex items-center gap-2 cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Tambah World Baru</span>
            </button>
          </div>
        </div>
      </div>

      {/* 5 Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
        {/* Total World */}
        <div
          onClick={() => onNavigateToWorlds('all')}
          className="p-4 rounded-2xl bg-[#0f172a] border border-slate-800 hover:border-slate-700 transition-all cursor-pointer group shadow-lg"
        >
          <div className="flex items-center justify-between mb-2.5">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Total World
            </span>
            <div className="p-2 rounded-xl bg-blue-500/15 text-blue-400 group-hover:scale-110 transition-transform">
              <Globe2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-100 font-game tracking-tight">
            {worlds.length}
          </div>
          <div className="text-[10px] text-slate-500 mt-1 flex items-center justify-between">
            <span>{totalTrees.toLocaleString()} pohon</span>
            <ArrowRight className="w-3 h-3 text-slate-600 group-hover:text-blue-400 transition-colors" />
          </div>
        </div>

        {/* World Siap Panen Sekarang */}
        <div
          onClick={() => onNavigateToWorlds('ready')}
          className={`p-4 rounded-2xl transition-all cursor-pointer group shadow-lg ${
            readyWorlds.length > 0
              ? 'bg-gradient-to-b from-[#0e2723] to-[#0c1c20] border-2 border-emerald-500/60 shadow-emerald-500/10'
              : 'bg-[#0f172a] border border-slate-800'
          }`}
        >
          <div className="flex items-center justify-between mb-2.5">
            <span className="text-[11px] font-semibold text-emerald-400 uppercase tracking-wider flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-amber-400" />
              Siap Panen
            </span>
            <div
              className={`p-2 rounded-xl ${
                readyWorlds.length > 0
                  ? 'bg-emerald-500/30 text-emerald-300 animate-pulse'
                  : 'bg-emerald-500/10 text-emerald-400'
              }`}
            >
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-emerald-400 font-game tracking-tight">
            {readyWorlds.length}
          </div>
          <div className="text-[10px] text-emerald-400/80 mt-1 flex items-center justify-between font-medium">
            <span>{readyWorlds.length > 0 ? 'Perlu dipanen!' : 'Belum ada'}</span>
            <ArrowRight className="w-3 h-3 text-emerald-500" />
          </div>
        </div>

        {/* World Sedang Tumbuh */}
        <div
          onClick={() => onNavigateToWorlds('growing')}
          className="p-4 rounded-2xl bg-[#0f172a] border border-slate-800 hover:border-slate-700 transition-all cursor-pointer group shadow-lg"
        >
          <div className="flex items-center justify-between mb-2.5">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Sedang Tumbuh
            </span>
            <div className="p-2 rounded-xl bg-amber-500/15 text-amber-400 group-hover:scale-110 transition-transform">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-amber-400 font-game tracking-tight">
            {growingWorlds.length}
          </div>
          <div className="text-[10px] text-slate-500 mt-1 flex items-center justify-between">
            <span>Countdown aktif</span>
            <ArrowRight className="w-3 h-3 text-slate-600 group-hover:text-amber-400 transition-colors" />
          </div>
        </div>

        {/* Farm Kosong (Belum Ditanam) */}
        <div
          onClick={() => onNavigateToWorlds('empty')}
          className={`p-4 rounded-2xl transition-all cursor-pointer group shadow-lg ${
            emptyWorlds.length > 0
              ? 'bg-gradient-to-b from-[#241e17] to-[#141724] border-2 border-amber-500/50 shadow-amber-500/10'
              : 'bg-[#0f172a] border border-slate-800'
          }`}
        >
          <div className="flex items-center justify-between mb-2.5">
            <span className="text-[11px] font-semibold text-amber-400 uppercase tracking-wider flex items-center gap-1">
              <span>🪹</span>
              Farm Kosong
            </span>
            <div
              className={`p-2 rounded-xl ${
                emptyWorlds.length > 0
                  ? 'bg-amber-500/30 text-amber-300'
                  : 'bg-slate-800 text-slate-400'
              }`}
            >
              <Sprout className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-amber-400 font-game tracking-tight">
            {emptyWorlds.length}
          </div>
          <div className="text-[10px] text-amber-300/80 mt-1 flex items-center justify-between font-medium">
            <span>{emptyWorlds.length > 0 ? 'Siap ditanami bibit' : 'Semua terisi'}</span>
            <ArrowRight className="w-3 h-3 text-amber-400" />
          </div>
        </div>

        {/* Total Akun */}
        <div
          onClick={onNavigateToAccounts}
          className="p-4 rounded-2xl bg-[#0f172a] border border-slate-800 hover:border-slate-700 transition-all cursor-pointer group shadow-lg col-span-2 sm:col-span-1"
        >
          <div className="flex items-center justify-between mb-2.5">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Total Akun
            </span>
            <div className="p-2 rounded-xl bg-purple-500/15 text-purple-400 group-hover:scale-110 transition-transform">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-100 font-game tracking-tight">
            {accounts.length}
          </div>
          <div className="text-[10px] text-slate-500 mt-1 flex items-center justify-between">
            <span>GrowID terhubung</span>
            <ArrowRight className="w-3 h-3 text-slate-600 group-hover:text-purple-400 transition-colors" />
          </div>
        </div>
      </div>

      {/* Statistik & Tren Pendapatan Panen (Diagram Batang Harian & Mingguan) */}
      <HarvestRevenueChart
        salesRecords={salesRecords}
        onNavigateToCalculator={onNavigateToCalculator}
      />

      {/* Bagian "Siap Panen" yang disorot warna hijau (Highlighted section) */}
      <section className="rounded-3xl p-5 sm:p-6 bg-gradient-to-br from-[#0a231d] via-[#0b1e1b] to-[#0a151b] border-2 border-emerald-500/50 shadow-2xl shadow-emerald-950/40 relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5 pb-4 border-b border-emerald-500/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500 text-slate-950 flex items-center justify-center font-bold text-lg shadow-lg shadow-emerald-500/30">
              ⚡
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-black text-emerald-300 font-game tracking-wider uppercase">
                  WORLD SIAP PANEN SEKARANG
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-emerald-400 text-slate-950 text-xs font-black">
                  {readyWorlds.length} SIAP
                </span>
              </div>
              <p className="text-xs text-emerald-200/80">
                Segera panen untuk mengumpulkan gems dan replant kembali!
              </p>
            </div>
          </div>

          {readyWorlds.length > 0 && (
            <button
              onClick={() => onNavigateToWorlds('ready')}
              className="text-xs text-emerald-400 hover:text-emerald-300 font-bold flex items-center gap-1 cursor-pointer self-start sm:self-auto"
            >
              <span>Lihat Semua ({readyWorlds.length})</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {readyWorlds.length === 0 ? (
          <div className="py-8 px-4 text-center rounded-2xl bg-emerald-950/20 border border-emerald-500/20">
            <CheckCircle2 className="w-10 h-10 text-emerald-400/80 mx-auto mb-2" />
            <h4 className="text-base font-bold text-emerald-200 font-game tracking-wide">
              Semua Tanaman Masih Dalam Pertumbuhan!
            </h4>
            <p className="text-xs text-emerald-300/70 max-w-md mx-auto mt-1">
              Tidak ada world yang siap panen saat ini. Silakan periksa bagian hitung mundur di bawah untuk jadwal panen terdekat.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {readyWorlds.map((world) => {
              const status = getWorldStatus(world, currentTimeMs);
              const isOverdue = status === 'overdue';
              const countdown = getCountdownInfo(world, currentTimeMs);
              const estGems = Math.round(world.treeCount * 11.5);

              return (
                <div
                  key={world.id}
                  className="rounded-2xl p-4 bg-[#0a1820]/90 border border-emerald-500/40 hover:border-emerald-400 transition-all flex flex-col justify-between group shadow-lg"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">{getCropIcon(world.cropType)}</span>
                        <span className="font-extrabold text-base text-slate-50 font-game tracking-wider group-hover:text-emerald-300 transition-colors">
                          {world.name}
                        </span>
                      </div>
                      {isOverdue ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-500/25 text-rose-300 border border-rose-500/40 animate-pulse">
                          <AlertTriangle className="w-3 h-3" />
                          Terlambat
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/30 text-emerald-300 border border-emerald-500/50">
                          <Sparkles className="w-3 h-3 text-amber-400" />
                          Siap Panen
                        </span>
                      )}
                    </div>

                    <div className="text-xs text-slate-300 space-y-1 mb-3">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Tanaman:</span>
                        <span className="font-bold text-slate-200">{world.cropType}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Jumlah Pohon:</span>
                        <span className="font-bold text-amber-400">
                          {world.treeCount.toLocaleString()} pohon
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Estimasi Gems:</span>
                        <span className="font-bold text-amber-300">~{estGems.toLocaleString()} 💎</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Akun Petani:</span>
                        <span className="font-medium text-slate-300">
                          {getAccountName(world.accountId)}
                        </span>
                      </div>
                    </div>

                    {/* Visual Crop Progress Bar */}
                    <CropProgressBar
                      world={world}
                      currentTimeMs={currentTimeMs}
                      size="sm"
                      showLabels={true}
                      showStageIcon={true}
                      showTimeRemaining={false}
                      className="my-2.5"
                    />
                  </div>

                  {/* Harvest Action Button & View Details */}
                  <div className="flex items-center gap-2 mt-2">
                    <button
                      onClick={() => onHarvestWorld(world)}
                      className="flex-1 py-2.5 px-3 rounded-xl bg-gradient-to-r from-emerald-500 via-emerald-400 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-black text-xs shadow-md shadow-emerald-500/20 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Panen & Tanam Ulang</span>
                    </button>
                    <button
                      onClick={() => onSelectWorld(world)}
                      title="Lihat / Edit World"
                      className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors cursor-pointer"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Bagian "Upcoming Harvest" (Daftar world yang akan panen dalam 24 jam ke depan) */}
      <UpcomingHarvest
        worlds={worlds}
        accounts={accounts}
        currentTimeMs={currentTimeMs}
        onSelectWorld={onSelectWorld}
        onHarvestWorld={onHarvestWorld}
        onNavigateToWorlds={onNavigateToWorlds}
        onOpenAddWorld={onOpenAddWorld}
      />

      {/* Bagian "Farm Kosong (Siap Ditanam)" */}
      {emptyWorlds.length > 0 && (
        <section className="rounded-3xl p-5 sm:p-6 bg-gradient-to-br from-[#1a171c] via-[#141624] to-[#0c121e] border-2 border-amber-500/40 shadow-xl relative overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5 pb-4 border-b border-amber-500/20">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center font-bold text-lg shadow-lg">
                🪹
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg sm:text-xl font-black text-amber-300 font-game tracking-wider uppercase">
                    WORLD FARM KOSONG
                  </h2>
                  <span className="px-2 py-0.5 rounded-full bg-amber-400 text-slate-950 text-xs font-black">
                    {emptyWorlds.length} KOSONG
                  </span>
                </div>
                <p className="text-xs text-amber-200/70">
                  World berikut belum ditanami bibit. Tanam sekarang agar pohon segera menghasilkan gems!
                </p>
              </div>
            </div>

            <button
              onClick={() => onNavigateToWorlds('empty')}
              className="text-xs text-amber-400 hover:text-amber-300 font-bold flex items-center gap-1 cursor-pointer self-start sm:self-auto"
            >
              <span>Lihat Semua Farm Kosong ({emptyWorlds.length})</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {emptyWorlds.slice(0, 3).map((world) => (
              <div
                key={world.id}
                className="rounded-2xl p-4 bg-[#0e1628] border border-amber-500/30 hover:border-amber-400 transition-all flex flex-col justify-between group shadow-md"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-extrabold text-base text-slate-100 font-game tracking-wider group-hover:text-amber-300 transition-colors">
                      {world.name}
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40">
                      🪹 Farm Kosong
                    </span>
                  </div>

                  <div className="text-xs text-slate-400 space-y-1 mb-3">
                    <div className="flex justify-between">
                      <span>Rencana Bibit:</span>
                      <span className="font-bold text-slate-200">{world.cropType}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Kapasitas Slot:</span>
                      <span className="font-bold text-amber-400">
                        {world.treeCount.toLocaleString()} slot pohon
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Akun Pemilik:</span>
                      <span className="text-slate-300">{getAccountName(world.accountId)}</span>
                    </div>
                    {world.notes && (
                      <p className="text-[11px] text-slate-500 italic pt-1 border-t border-slate-800/80">
                        "{world.notes}"
                      </p>
                    )}
                  </div>

                  {/* Empty World Progress Bar Component */}
                  <CropProgressBar
                    world={world}
                    currentTimeMs={currentTimeMs}
                    size="sm"
                    showLabels={true}
                    className="my-2"
                  />
                </div>

                <button
                  onClick={() => onPlantWorld ? onPlantWorld(world) : onSelectWorld(world)}
                  className="w-full mt-2 py-2.5 px-3 rounded-xl bg-gradient-to-r from-emerald-500 via-emerald-400 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-black text-xs shadow-md shadow-emerald-500/20 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Sprout className="w-3.5 h-3.5" />
                  <span>Tanam Bibit Sekarang</span>
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Bagian "Sedang Tumbuh" dengan Hitung Mundur & Progress Bar Visual */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg sm:text-xl font-bold text-slate-100 font-game tracking-wider flex items-center gap-2">
                <Clock className="w-5 h-5 text-amber-400" />
                <span>MONITORING WORLD SEDANG TUMBUH</span>
              </h2>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30 font-bold font-mono">
                {growingWorlds.length} AKTIF
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Pantau persentase pertumbuhan bibit dan hitung mundur panen realtime
            </p>
          </div>

          {/* Tab Selector & Full World Link */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center bg-[#0d1627] border border-slate-800 p-1 rounded-xl">
              <button
                onClick={() => setGrowingTab('soonest')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  growingTab === 'soonest'
                    ? 'bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30 shadow-xs'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                ⚡ 5 Tercepat
              </button>
              <button
                onClick={() => setGrowingTab('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  growingTab === 'all'
                    ? 'bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30 shadow-xs'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                🌱 Semua ({growingWorlds.length})
              </button>
            </div>

            <button
              onClick={() => onNavigateToWorlds('growing')}
              className="text-xs text-amber-400 hover:text-amber-300 font-semibold flex items-center gap-1 cursor-pointer px-2 py-1"
            >
              <span>Tabel Lengkap</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Quick Search on Dashboard if there are multiple growing worlds */}
        {growingWorlds.length > 3 && (
          <div className="relative">
            <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
            <input
              type="text"
              value={dashboardSearch}
              onChange={(e) => setDashboardSearch(e.target.value)}
              placeholder="Cari world yang sedang tumbuh (nama, bibit, catatan)..."
              className="w-full pl-10 pr-8 py-2 rounded-xl bg-[#0e1628] border border-slate-800 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 text-slate-100 text-xs placeholder:text-slate-500 transition-all"
            />
            {dashboardSearch && (
              <button
                onClick={() => setDashboardSearch('')}
                className="absolute right-3 top-2.5 text-xs text-slate-400 hover:text-slate-200"
              >
                ✕
              </button>
            )}
          </div>
        )}

        {growingWorlds.length === 0 ? (
          <EmptyState
            title="Tidak Ada World yang Sedang Tumbuh"
            description="Semua world Anda mungkin sudah siap panen atau masih berupa farm kosong."
            actionText="Tambah World Baru"
            onAction={onOpenAddWorld}
          />
        ) : displayedGrowingWorlds.length === 0 ? (
          <div className="py-8 px-4 text-center rounded-2xl bg-slate-900/40 border border-slate-800">
            <p className="text-xs text-slate-400">
              Tidak ada world yang cocok dengan pencarian "{dashboardSearch}".
            </p>
            <button
              onClick={() => setDashboardSearch('')}
              className="mt-2 text-xs text-amber-400 hover:underline font-bold"
            >
              Hapus Pencarian
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {displayedGrowingWorlds.map((world, idx) => {
              return (
                <div
                  key={world.id}
                  onClick={() => onSelectWorld(world)}
                  className="p-4 rounded-2xl bg-[#0f172a] border border-slate-800 hover:border-slate-700 hover:bg-[#121c33] transition-all cursor-pointer flex flex-col lg:flex-row lg:items-center justify-between gap-4 group shadow-md"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-xl bg-slate-800 flex items-center justify-center font-bold text-xs text-slate-400 group-hover:text-amber-400 group-hover:bg-amber-500/10 transition-colors shrink-0 font-pixel">
                      #{idx + 1}
                    </div>

                    <div className="text-2xl shrink-0">{getCropIcon(world.cropType)}</div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-sm sm:text-base text-slate-100 font-game tracking-wider group-hover:text-amber-300 transition-colors truncate">
                          {world.name}
                        </span>
                        <span className="text-[11px] px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 font-medium">
                          {world.cropType}
                        </span>
                      </div>

                      <div className="text-xs text-slate-400 flex items-center gap-3 mt-1 flex-wrap">
                        <span className="text-amber-400 font-semibold">
                          {world.treeCount.toLocaleString()} pohon
                        </span>
                        <span>•</span>
                        <span>Akun: {getAccountName(world.accountId)}</span>
                        <span className="hidden md:inline">•</span>
                        <span className="hidden md:inline text-slate-400">
                          Panen: {formatDateTime(world.harvestAt)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Crop Progress Bar Component Integration */}
                  <div className="w-full lg:w-80 shrink-0">
                    <CropProgressBar
                      world={world}
                      currentTimeMs={currentTimeMs}
                      size="md"
                      showLabels={true}
                      showStageIcon={true}
                      showTimeRemaining={true}
                    />
                    <div className="flex items-center justify-between mt-2 pt-1.5 border-t border-slate-800/60 text-[11px]">
                      <span className="text-slate-500">
                        Durasi: {world.durationDays}h {world.durationHours}j {world.durationMinutes}m
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectWorld(world);
                        }}
                        className="text-slate-400 hover:text-amber-300 font-semibold flex items-center gap-1 transition-colors"
                      >
                        <span>Edit / Detail</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
};
