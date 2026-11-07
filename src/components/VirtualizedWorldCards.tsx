import React, { useRef, useState, useEffect, useMemo } from 'react';
import { World, GrowAccount } from '../types';
import { getCountdownInfo, formatDateTime } from '../utils/time';
import { CropProgressBar } from './CropProgressBar';
import { useVirtualizer } from '../hooks/useVirtualizer';
import {
  RotateCcw,
  Edit2,
  Trash2,
  Sprout,
  ArrowUp,
  Zap,
} from 'lucide-react';

interface VirtualizedWorldCardsProps {
  worlds: World[];
  accounts: GrowAccount[];
  currentTimeMs: number;
  getCropIcon: (cropType: string) => string;
  getAccountName: (accountId: string) => string;
  renderStatusBadge: (world: World) => React.ReactNode;
  onPlantWorld: (world: World) => void;
  onHarvestWorld: (world: World) => void;
  onEditWorld: (world: World) => void;
  onDeleteWorld: (world: World) => void;
}

const CARD_ROW_HEIGHT = 360; // Estimated height per row of cards in pixels

export const VirtualizedWorldCards: React.FC<VirtualizedWorldCardsProps> = ({
  worlds,
  accounts,
  currentTimeMs,
  getCropIcon,
  getAccountName,
  renderStatusBadge,
  onPlantWorld,
  onHarvestWorld,
  onEditWorld,
  onDeleteWorld,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [columns, setColumns] = useState<number>(3);

  // Responsive column determination
  useEffect(() => {
    const updateColumns = () => {
      const width = window.innerWidth;
      if (width < 640) {
        setColumns(1);
      } else if (width < 1024) {
        setColumns(2);
      } else {
        setColumns(3);
      }
    };

    updateColumns();
    window.addEventListener('resize', updateColumns, { passive: true });
    return () => window.removeEventListener('resize', updateColumns);
  }, []);

  // Chunk worlds array into rows according to column count
  const rowChunks = useMemo(() => {
    const chunks: World[][] = [];
    for (let i = 0; i < worlds.length; i += columns) {
      chunks.push(worlds.slice(i, i + columns));
    }
    return chunks;
  }, [worlds, columns]);

  const {
    virtualItems,
    offsetTop,
    offsetBottom,
    startIndex,
    endIndex,
    scrollToIndex,
  } = useVirtualizer({
    count: rowChunks.length,
    itemHeight: CARD_ROW_HEIGHT,
    overscan: 2,
    containerRef,
  });

  const totalVisibleWorlds = virtualItems.reduce((acc, curr) => acc + (rowChunks[curr.index]?.length || 0), 0);

  return (
    <div className="flex flex-col gap-2">
      {/* Virtualization Info Header Pill */}
      <div className="px-4 py-2 bg-[#0d162a] border border-slate-800/90 rounded-2xl flex items-center justify-between text-[11px] text-slate-400">
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1 font-semibold text-emerald-400">
            <Zap className="w-3.5 h-3.5" />
            <span>Virtual Grid (Windowing)</span>
          </span>
          <span className="hidden sm:inline text-slate-600">•</span>
          <span className="hidden sm:inline">
            Rendering baris #{startIndex + 1} - #{endIndex + 1} ({totalVisibleWorlds} kartu aktif di DOM) dari total{' '}
            <strong className="text-slate-200">{worlds.length} world</strong>
          </span>
        </div>
        <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 font-mono">
          {columns} Kolom • 60 FPS
        </span>
      </div>

      {/* Virtual Scroll Window Container */}
      <div
        ref={containerRef}
        className="overflow-y-auto max-h-[720px] p-1 relative scroll-smooth rounded-2xl"
        style={{ willChange: 'transform' }}
      >
        <div style={{ paddingTop: `${offsetTop}px`, paddingBottom: `${offsetBottom}px` }}>
          <div className="space-y-4">
            {virtualItems.map(({ index }) => {
              const rowWorlds = rowChunks[index];
              if (!rowWorlds) return null;

              return (
                <div
                  key={`card-row-${index}`}
                  className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
                >
                  {rowWorlds.map((world) => {
                    const countdown = getCountdownInfo(world, currentTimeMs);
                    const isReady = countdown.isReady;

                    return (
                      <div
                        key={world.id}
                        className={`p-4 rounded-2xl border transition-all flex flex-col justify-between shadow-lg ${
                          world.isEmpty
                            ? 'bg-gradient-to-b from-[#121c2f] to-[#0c1424] border-amber-500/30'
                            : isReady
                            ? 'bg-gradient-to-b from-[#0a1e1b] to-[#0c1622] border-emerald-500/50'
                            : 'bg-[#0f172a] border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <span className="text-2xl">{getCropIcon(world.cropType)}</span>
                              <div>
                                <h3 className="font-extrabold text-base text-slate-100 font-game tracking-wider">
                                  {world.name}
                                </h3>
                                <span className="text-[11px] text-slate-400">{world.cropType}</span>
                              </div>
                            </div>
                            {renderStatusBadge(world)}
                          </div>

                          {/* Visual Crop Progress Bar Component */}
                          <div className="p-3 my-3 rounded-xl bg-[#121c33] border border-slate-800">
                            <CropProgressBar
                              world={world}
                              currentTimeMs={currentTimeMs}
                              size="md"
                              showLabels={true}
                              showStageIcon={true}
                              showTimeRemaining={true}
                            />
                          </div>

                          {/* Details */}
                          <div className="text-xs text-slate-400 space-y-1 mb-3">
                            <div className="flex justify-between">
                              <span>Pohon:</span>
                              <span className="font-bold text-amber-400 font-mono">
                                {world.treeCount.toLocaleString()}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span>Waktu Panen:</span>
                              {world.isEmpty ? (
                                <span className="text-slate-500 italic">Menunggu ditanam</span>
                              ) : (
                                <span className="text-slate-300 font-mono">
                                  {formatDateTime(world.harvestAt)}
                                </span>
                              )}
                            </div>
                            <div className="flex justify-between">
                              <span>Akun:</span>
                              <span className="text-slate-300">{getAccountName(world.accountId)}</span>
                            </div>
                            {world.notes && (
                              <p className="text-[11px] text-slate-500 italic pt-1 border-t border-slate-800/80 truncate">
                                "{world.notes}"
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Card Action Buttons */}
                        <div className="pt-3 border-t border-slate-800/80 flex items-center gap-2">
                          {world.isEmpty ? (
                            <button
                              onClick={() => onPlantWorld(world)}
                              className="flex-1 py-2 px-3 rounded-xl bg-gradient-to-r from-emerald-500 via-emerald-400 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-black text-xs flex items-center justify-center gap-1.5 transition-all shadow-md shadow-emerald-500/20 cursor-pointer"
                            >
                              <Sprout className="w-3.5 h-3.5" />
                              <span>Tanam Bibit Sekarang</span>
                            </button>
                          ) : (
                            <button
                              onClick={() => onHarvestWorld(world)}
                              className="flex-1 py-2 px-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                              <span>Panen / Replant</span>
                            </button>
                          )}

                          <button
                            onClick={() => onEditWorld(world)}
                            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors cursor-pointer"
                            title="Edit"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => onDeleteWorld(world)}
                            className="p-2 rounded-xl bg-slate-800 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 border border-slate-700 transition-colors cursor-pointer"
                            title="Hapus World"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Footer Navigation */}
      {startIndex > 2 && (
        <div className="flex justify-end pt-1">
          <button
            type="button"
            onClick={() => scrollToIndex(0)}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold border border-slate-700 transition-colors cursor-pointer"
          >
            <ArrowUp className="w-3.5 h-3.5 text-emerald-400" />
            <span>Kembali ke Atas</span>
          </button>
        </div>
      )}
    </div>
  );
};
