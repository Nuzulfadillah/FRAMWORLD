import React from 'react';
import { World } from '../types';
import { getCountdownInfo, getWorldStatus } from '../utils/time';
import { Sparkles, AlertTriangle, Sprout, Clock } from 'lucide-react';

interface CropProgressBarProps {
  world: World;
  currentTimeMs?: number;
  size?: 'sm' | 'md' | 'lg';
  showLabels?: boolean;
  showStageIcon?: boolean;
  showTimeRemaining?: boolean;
  className?: string;
}

export const CropProgressBar: React.FC<CropProgressBarProps> = ({
  world,
  currentTimeMs = Date.now(),
  size = 'md',
  showLabels = true,
  showStageIcon = true,
  showTimeRemaining = true,
  className = '',
}) => {
  const status = getWorldStatus(world, currentTimeMs);
  const countdown = getCountdownInfo(world, currentTimeMs);

  // Height configurations
  const heightClasses = {
    sm: 'h-1.5',
    md: 'h-2.5',
    lg: 'h-4',
  };

  if (status === 'empty' || world.isEmpty) {
    return (
      <div className={`w-full ${className}`}>
        {showLabels && (
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="text-[11px] font-semibold text-slate-400 flex items-center gap-1.5">
              {showStageIcon && <span>🪹</span>}
              <span>Status Tumbuh</span>
            </span>
            <span className="text-[11px] font-bold text-amber-400/90 font-mono bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
              Farm Kosong (0%)
            </span>
          </div>
        )}
        <div className={`w-full bg-slate-800/60 rounded-full ${heightClasses[size]} overflow-hidden border border-slate-700/50 border-dashed`}>
          <div className="h-full w-0" />
        </div>
        {showLabels && (
          <div className="flex justify-between items-center text-[10px] text-slate-500 mt-1">
            <span>Belum ditanam</span>
            <span className="text-amber-400 font-medium">Siap ditanami bibit</span>
          </div>
        )}
      </div>
    );
  }

  // Calculate detailed growth percentage and stage
  const plantedMs = new Date(world.plantedAt).getTime();
  const harvestMs = new Date(world.harvestAt).getTime();
  const totalDuration = Math.max(1, harvestMs - plantedMs);
  const elapsed = Math.max(0, currentTimeMs - plantedMs);
  const rawPercent = Math.min(100, Math.max(0, (elapsed / totalDuration) * 100));
  const progressPercent = status === 'ready' || status === 'overdue' ? 100 : Math.min(99, Math.round(rawPercent));

  // Determine stage info
  let stageTitle = '🌱 Tunas Muda';
  let stageIcon = '🌱';
  let barGradient = 'from-emerald-500 via-teal-400 to-cyan-400';
  let badgeColor = 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30';
  let glowColor = 'shadow-emerald-500/30';

  if (status === 'overdue') {
    stageTitle = '⚠️ Terlambat Panen';
    stageIcon = '⚠️';
    barGradient = 'from-rose-500 via-amber-500 to-rose-400';
    badgeColor = 'text-rose-300 bg-rose-500/20 border-rose-500/40';
    glowColor = 'shadow-rose-500/40';
  } else if (status === 'ready') {
    stageTitle = '✨ Siap Panen!';
    stageIcon = '💎';
    barGradient = 'from-emerald-400 via-teal-300 to-amber-300';
    badgeColor = 'text-emerald-300 bg-emerald-500/20 border-emerald-400/50';
    glowColor = 'shadow-emerald-400/40';
  } else if (progressPercent >= 75) {
    stageTitle = '🌳 Hampir Matang';
    stageIcon = '🌳';
    barGradient = 'from-teal-500 via-emerald-400 to-amber-400';
    badgeColor = 'text-emerald-300 bg-emerald-500/10 border-emerald-500/30';
    glowColor = 'shadow-teal-500/30';
  } else if (progressPercent >= 35) {
    stageTitle = '🌿 Daun Berkembang';
    stageIcon = '🌿';
    barGradient = 'from-cyan-500 via-teal-400 to-emerald-400';
    badgeColor = 'text-cyan-300 bg-cyan-500/10 border-cyan-500/30';
    glowColor = 'shadow-cyan-500/30';
  }

  return (
    <div className={`w-full ${className}`}>
      {showLabels && (
        <div className="flex items-center justify-between text-xs mb-1.5 gap-2">
          <div className="flex items-center gap-1.5 min-w-0">
            {showStageIcon && <span className="text-sm shrink-0">{stageIcon}</span>}
            <span className="text-[11px] font-bold text-slate-300 truncate">
              {stageTitle}
            </span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {showTimeRemaining && (
              <span className="text-[11px] font-mono text-amber-300 flex items-center gap-1 font-semibold">
                <Clock className="w-3 h-3 text-amber-400" />
                <span>{countdown.formatted}</span>
              </span>
            )}
            <span
              className={`text-[10px] sm:text-[11px] font-black font-mono px-2 py-0.5 rounded-md border shadow-xs ${badgeColor}`}
            >
              {progressPercent}%
            </span>
          </div>
        </div>
      )}

      {/* Progress Track */}
      <div className={`relative w-full bg-slate-900/90 rounded-full ${heightClasses[size]} overflow-hidden border border-slate-700/60 shadow-inner`}>
        {/* Fill Bar */}
        <div
          className={`h-full rounded-full bg-gradient-to-r ${barGradient} transition-all duration-500 ease-out relative shadow-sm ${glowColor}`}
          style={{ width: `${progressPercent}%` }}
        >
          {/* Animated Shine/Stripes on Active Growing & Ready */}
          <div
            className="absolute inset-0 opacity-40 bg-[linear-gradient(45deg,rgba(255,255,255,0.25)_25%,transparent_25%,transparent_50%,rgba(255,255,255,0.25)_50%,rgba(255,255,255,0.25)_75%,transparent_75%,transparent)] bg-[length:16px_16px] animate-[progress-shimmer_1.5s_linear_infinite]"
          />

          {/* Shimmer Pin at leading edge for visual delight */}
          {progressPercent > 5 && progressPercent < 100 && (
            <div className="absolute right-0 top-0 bottom-0 w-1.5 bg-white/70 rounded-full blur-[0.5px]" />
          )}
        </div>

        {/* Milestone Tick Marks (25%, 50%, 75%) */}
        {size !== 'sm' && (
          <div className="absolute inset-0 pointer-events-none flex justify-between px-[25%] opacity-30">
            <span className="h-full w-[1px] bg-slate-400" />
            <span className="h-full w-[1px] bg-slate-400" />
          </div>
        )}
      </div>

      {/* Optional sub-info footer */}
      {showLabels && size === 'lg' && (
        <div className="flex justify-between items-center text-[10px] text-slate-400 mt-1.5">
          <span className="flex items-center gap-1">
            <Sprout className="w-3 h-3 text-emerald-400" />
            <span>Fase: {stageTitle}</span>
          </span>
          <span className="font-mono text-slate-300">
            {progressPercent === 100 ? (
              <span className="text-emerald-400 font-bold flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-amber-400" /> Siap Panen
              </span>
            ) : (
              <span>Sisa: {countdown.formatted}</span>
            )}
          </span>
        </div>
      )}
    </div>
  );
};
