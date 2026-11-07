import React, { useState, useMemo } from 'react';
import { World, GrowAccount } from '../types';
import { CROP_PRESETS } from '../data/presets';
import { getWorldStatus, getCountdownInfo, formatDateTime } from '../utils/time';
import { CropProgressBar } from './CropProgressBar';
import {
  Clock,
  Sparkles,
  ArrowRight,
  RotateCcw,
  ExternalLink,
  Flame,
  CalendarClock,
  Trees,
  Sprout,
  CheckCircle2,
} from 'lucide-react';

interface UpcomingHarvestProps {
  worlds: World[];
  accounts: GrowAccount[];
  currentTimeMs: number;
  onSelectWorld: (world: World) => void;
  onHarvestWorld: (world: World) => void;
  onNavigateToWorlds: (filterStatus?: string) => void;
  onOpenAddWorld?: () => void;
}

const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000;
const TWELVE_HOURS_MS = 12 * 60 * 60 * 1000;
const SIX_HOURS_MS = 6 * 60 * 60 * 1000;

export const UpcomingHarvest: React.FC<UpcomingHarvestProps> = ({
  worlds,
  accounts,
  currentTimeMs,
  onSelectWorld,
  onHarvestWorld,
  onNavigateToWorlds,
  onOpenAddWorld,
}) => {
  // Time filter within the 24-hour window
  const [timeFilter, setTimeFilter] = useState<'24h' | '12h' | '6h'>('24h');

  const getAccountName = (accountId: string) => {
    const acc = accounts.find((a) => a.id === accountId);
    return acc ? acc.growId : 'Umum';
  };

  const getCropIcon = (cropType: string) => {
    const p = CROP_PRESETS.find((c) => c.name === cropType);
    return p ? p.icon : '🌱';
  };

  // Find all growing worlds and sort them by fastest harvest time
  const sortedGrowingWorlds = useMemo(() => {
    return worlds
      .filter((w) => {
        if (w.isEmpty || !w.harvestAt) return false;
        const status = getWorldStatus(w, currentTimeMs);
        return status === 'growing';
      })
      .sort((a, b) => new Date(a.harvestAt).getTime() - new Date(b.harvestAt).getTime());
  }, [worlds, currentTimeMs]);

  // Next 24 hours upcoming worlds
  const upcomingIn24h = useMemo(() => {
    return sortedGrowingWorlds.filter((w) => {
      const harvestTime = new Date(w.harvestAt).getTime();
      const diffMs = harvestTime - currentTimeMs;
      return diffMs > 0 && diffMs <= TWENTY_FOUR_HOURS_MS;
    });
  }, [sortedGrowingWorlds, currentTimeMs]);

  // Filtered by selected sub-range (default 24h)
  const displayedWorlds = useMemo(() => {
    const maxMs =
      timeFilter === '6h'
        ? SIX_HOURS_MS
        : timeFilter === '12h'
        ? TWELVE_HOURS_MS
        : TWENTY_FOUR_HOURS_MS;

    return upcomingIn24h.filter((w) => {
      const diffMs = new Date(w.harvestAt).getTime() - currentTimeMs;
      return diffMs <= maxMs;
    });
  }, [upcomingIn24h, currentTimeMs, timeFilter]);

  // Aggregate statistics for 24h window
  const totalUpcomingTrees = useMemo(() => {
    return displayedWorlds.reduce((acc, w) => acc + (w.treeCount || 0), 0);
  }, [displayedWorlds]);

  const estUpcomingGems = useMemo(() => {
    return Math.round(totalUpcomingTrees * 11.5);
  }, [totalUpcomingTrees]);

  // Next closest growing world across entire farm (for empty state guidance)
  const nextClosestWorld = sortedGrowingWorlds[0] || null;

  return (
    <section className="rounded-3xl p-5 sm:p-6 bg-[#0c1527] border border-cyan-500/30 shadow-2xl shadow-cyan-950/20 relative overflow-hidden transition-all">
      {/* Subtle ambient light in background */}
      <div className="absolute top-0 right-0 w-72 h-72 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-10 w-60 h-60 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header with Title & Quick Range Selectors */}
      <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5 pb-4 border-b border-slate-700/80">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-cyan-500 to-teal-400 p-0.5 shadow-lg shadow-cyan-500/20 shrink-0">
            <div className="w-full h-full bg-[#0a1424] rounded-[14px] flex items-center justify-center text-cyan-400">
              <CalendarClock className="w-5 h-5" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-lg sm:text-xl font-black text-slate-100 font-game tracking-wider uppercase">
                UPCOMING HARVEST
              </h2>
              <span className="px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 text-xs font-bold font-mono">
                {displayedWorlds.length} WORLD (24 JAM)
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Daftar world yang akan siap panen dalam 24 jam ke depan, terurut dari waktu panen tercepat
            </p>
          </div>
        </div>

        {/* Time Window Buttons & Full Table Link */}
        <div className="flex items-center gap-2 flex-wrap self-start sm:self-auto">
          <div className="flex items-center bg-[#091120] border border-slate-800 p-1 rounded-xl">
            <button
              onClick={() => setTimeFilter('6h')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                timeFilter === '6h'
                  ? 'bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30 shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Panen dalam 6 jam ke depan"
            >
              ⚡ 6 Jam
            </button>
            <button
              onClick={() => setTimeFilter('12h')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                timeFilter === '12h'
                  ? 'bg-teal-500/20 text-teal-300 font-bold border border-teal-500/30 shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Panen dalam 12 jam ke depan"
            >
              12 Jam
            </button>
            <button
              onClick={() => setTimeFilter('24h')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                timeFilter === '24h'
                  ? 'bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/30 shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Panen dalam 24 jam ke depan"
            >
              🌟 24 Jam
            </button>
          </div>

          <button
            onClick={() => onNavigateToWorlds('growing')}
            className="text-xs text-cyan-400 hover:text-cyan-300 font-bold flex items-center gap-1 cursor-pointer px-2 py-1 transition-colors"
          >
            <span>Semua World</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* KPI Highlight Strip for 24h Window (only when worlds exist) */}
      {displayedWorlds.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
          <div className="p-3 rounded-2xl bg-[#091120]/80 border border-slate-800/80">
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
              Panen Segera
            </span>
            <div className="text-lg font-black text-cyan-400 font-game mt-0.5">
              {displayedWorlds.length} <span className="text-xs font-sans font-medium text-slate-400">World</span>
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-[#091120]/80 border border-slate-800/80">
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
              Potensi Pohon
            </span>
            <div className="text-lg font-black text-emerald-400 font-game mt-0.5">
              {totalUpcomingTrees.toLocaleString()} <span className="text-xs font-sans font-medium text-slate-400">pohon</span>
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-[#091120]/80 border border-slate-800/80">
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
              Estimasi Gems
            </span>
            <div className="text-lg font-black text-amber-300 font-game mt-0.5">
              ~{estUpcomingGems.toLocaleString()} <span className="text-xs font-sans font-medium text-slate-400">💎</span>
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-[#091120]/80 border border-slate-800/80">
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
              Panen Paling Awal
            </span>
            <div className="text-sm font-bold text-slate-200 truncate mt-1 flex items-center gap-1.5">
              <span className="text-base">{getCropIcon(displayedWorlds[0].cropType)}</span>
              <span className="truncate">{displayedWorlds[0].name}</span>
            </div>
          </div>
        </div>
      )}

      {/* Content: List of Upcoming Worlds OR Empty State */}
      {displayedWorlds.length === 0 ? (
        <div className="py-8 px-4 text-center rounded-2xl bg-[#091120]/60 border border-slate-800/80">
          <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 mx-auto flex items-center justify-center text-xl mb-3 shadow-inner">
            ⏳
          </div>
          <h4 className="text-base font-bold text-slate-200 font-game tracking-wide">
            Tidak Ada World yang Panen dalam {timeFilter === '6h' ? '6' : timeFilter === '12h' ? '12' : '24'} Jam ke Depan
          </h4>
          <p className="text-xs text-slate-400 max-w-md mx-auto mt-1 leading-relaxed">
            {nextClosestWorld ? (
              <span>
                Panen terdekat berikutnya di farm Anda adalah world{' '}
                <strong className="text-cyan-300 font-bold">{nextClosestWorld.name}</strong> ({nextClosestWorld.cropType}){' '}
                pada <strong className="text-slate-200">{formatDateTime(nextClosestWorld.harvestAt)}</strong>{' '}
                (sekitar {getCountdownInfo(nextClosestWorld, currentTimeMs).formatted} lagi).
              </span>
            ) : (
              'Saat ini tidak ada tanaman yang sedang dalam proses tumbuh aktif.'
            )}
          </p>

          <div className="flex items-center justify-center gap-2.5 mt-4 flex-wrap">
            {timeFilter !== '24h' && (
              <button
                onClick={() => setTimeFilter('24h')}
                className="px-3 py-1.5 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 text-xs font-bold transition-all cursor-pointer"
              >
                Lihat Rentang 24 Jam Penuh
              </button>
            )}
            <button
              onClick={() => onNavigateToWorlds('growing')}
              className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-700 transition-colors cursor-pointer"
            >
              Lihat Semua World Sedang Tumbuh
            </button>
            {onOpenAddWorld && (
              <button
                onClick={onOpenAddWorld}
                className="px-3.5 py-1.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 text-xs font-bold border border-emerald-500/40 transition-colors cursor-pointer"
              >
                + Tanam World Baru
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {displayedWorlds.map((world, idx) => {
            const countdown = getCountdownInfo(world, currentTimeMs);
            const estGems = Math.round(world.treeCount * 11.5);
            const isVerySoon = countdown.hours < 2 && countdown.days === 0;

            return (
              <div
                key={world.id}
                onClick={() => onSelectWorld(world)}
                className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col lg:flex-row lg:items-center justify-between gap-4 group shadow-md ${
                  isVerySoon
                    ? 'bg-gradient-to-r from-[#0d1f33] via-[#0f2438] to-[#0d1c2d] border-amber-500/50 hover:border-amber-400'
                    : 'bg-[#0a1224] border-slate-800/90 hover:border-cyan-500/50 hover:bg-[#0d1830]'
                }`}
              >
                {/* Left Info: Rank, Icon, Name, Meta */}
                <div className="flex items-center gap-3.5 min-w-0">
                  {/* Rank badge */}
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 font-pixel shadow-xs ${
                      idx === 0
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 ring-1 ring-amber-500/20'
                        : idx === 1
                        ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                        : 'bg-slate-800 text-slate-400 border border-slate-700/60'
                    }`}
                  >
                    #{idx + 1}
                  </div>

                  {/* Crop Icon */}
                  <div className="w-11 h-11 rounded-2xl bg-[#070d18] border border-slate-800 flex items-center justify-center text-2xl shrink-0 group-hover:scale-110 transition-transform">
                    {getCropIcon(world.cropType)}
                  </div>

                  {/* World Details */}
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-extrabold text-sm sm:text-base text-slate-100 font-game tracking-wider group-hover:text-cyan-300 transition-colors truncate">
                        {world.name}
                      </span>
                      <span className="text-[11px] px-2 py-0.5 rounded-md bg-slate-800/90 text-slate-300 font-medium">
                        {world.cropType}
                      </span>
                      {isVerySoon && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-amber-500/25 text-amber-300 border border-amber-500/40 animate-pulse">
                          <Flame className="w-3 h-3 text-amber-400" />
                          Segera Panen (&lt; 2 Jam)
                        </span>
                      )}
                    </div>

                    <div className="text-xs text-slate-400 flex items-center gap-2.5 mt-1 flex-wrap font-medium">
                      <span className="text-emerald-400 font-bold font-mono">
                        {world.treeCount.toLocaleString()} pohon
                      </span>
                      <span className="text-slate-600">·</span>
                      <span className="text-amber-300 font-semibold font-mono">
                        ~{estGems.toLocaleString()} 💎
                      </span>
                      <span className="text-slate-600">·</span>
                      <span className="text-slate-300">
                        Akun: <strong className="text-slate-200">{getAccountName(world.accountId)}</strong>
                      </span>
                      <span className="hidden md:inline text-slate-600">·</span>
                      <span className="hidden md:inline text-cyan-300/80 font-mono">
                        Panen: {formatDateTime(world.harvestAt)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right Area: Countdown Timer, Progress Bar & Actions */}
                <div className="w-full lg:w-80 shrink-0">
                  <div className="flex items-center justify-between mb-1.5 text-xs">
                    <span className="text-[11px] font-semibold text-slate-400 flex items-center gap-1">
                      <Clock className="w-3 h-3 text-cyan-400" />
                      <span>Sisa Waktu:</span>
                    </span>
                    <span className="text-xs font-mono font-bold text-cyan-300 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20">
                      {countdown.formatted}
                    </span>
                  </div>

                  {/* Growth Progress Bar */}
                  <CropProgressBar
                    world={world}
                    currentTimeMs={currentTimeMs}
                    size="md"
                    showLabels={false}
                    showStageIcon={false}
                    showTimeRemaining={false}
                  />

                  {/* Sub-bar footer with quick controls */}
                  <div className="flex items-center justify-between mt-2 pt-1.5 border-t border-slate-800/60 text-[11px]">
                    <span className="text-slate-400 font-mono">
                      {countdown.progressPercent}% siap
                    </span>

                    <div className="flex items-center gap-2">
                      {countdown.isReady && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onHarvestWorld(world);
                          }}
                          className="px-2.5 py-1 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold shadow-sm transition-all flex items-center gap-1 cursor-pointer"
                        >
                          <RotateCcw className="w-3 h-3" />
                          <span>Panen Sekarang</span>
                        </button>
                      )}

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectWorld(world);
                        }}
                        className="text-slate-400 hover:text-cyan-300 font-semibold flex items-center gap-1 transition-colors"
                      >
                        <span>Detail World</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
};
