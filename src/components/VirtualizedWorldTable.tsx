import React, { useRef } from 'react';
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

interface VirtualizedWorldTableProps {
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

const ROW_HEIGHT = 76; // Height per table row in pixels

export const VirtualizedWorldTable: React.FC<VirtualizedWorldTableProps> = ({
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

  const {
    virtualItems,
    offsetTop,
    offsetBottom,
    startIndex,
    endIndex,
    isVirtualized,
    scrollToIndex,
  } = useVirtualizer({
    count: worlds.length,
    itemHeight: ROW_HEIGHT,
    overscan: 4,
    containerRef,
  });

  return (
    <div className="rounded-2xl border border-slate-800 bg-[#0f172a] overflow-hidden shadow-2xl flex flex-col">
      {/* Virtualization Info Header Pill */}
      <div className="px-4 py-2 bg-[#09101f] border-b border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1 font-semibold text-emerald-400">
            <Zap className="w-3.5 h-3.5" />
            <span>Virtual Scrolling (Windowing)</span>
          </span>
          <span className="hidden sm:inline text-slate-600">•</span>
          <span className="hidden sm:inline">
            Rendering baris #{startIndex + 1} - #{endIndex + 1} dari total{' '}
            <strong className="text-slate-200">{worlds.length} world</strong>
          </span>
        </div>
        <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 font-mono">
          60 FPS DOM Optimized
        </span>
      </div>

      {/* Scrollable Container with Fixed Table Header */}
      <div
        ref={containerRef}
        className="overflow-x-auto overflow-y-auto max-h-[620px] relative scroll-smooth"
        style={{ willChange: 'transform' }}
      >
        <table className="w-full text-left text-xs border-collapse">
          {/* Sticky Header */}
          <thead className="bg-[#121c33] text-slate-300 uppercase tracking-wider text-[11px] font-semibold border-b border-slate-700/80 sticky top-0 z-10 shadow-md">
            <tr>
              <th className="py-3.5 px-4 bg-[#121c33]">Nama World</th>
              <th className="py-3.5 px-4 bg-[#121c33]">Jenis Tanaman</th>
              <th className="py-3.5 px-4 text-right bg-[#121c33]">Jumlah Pohon</th>
              <th className="py-3.5 px-4 bg-[#121c33]">Tanggal & Jam Tanam</th>
              <th className="py-3.5 px-4 bg-[#121c33]">Waktu Panen</th>
              <th className="py-3.5 px-4 bg-[#121c33]">Countdown & Progress</th>
              <th className="py-3.5 px-4 bg-[#121c33]">Badge Status</th>
              <th className="py-3.5 px-4 bg-[#121c33]">Akun Terkait</th>
              <th className="py-3.5 px-4 text-center bg-[#121c33]">Aksi</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-800/80">
            {/* Top Spacer for windowed rows above viewport */}
            {offsetTop > 0 && (
              <tr style={{ height: `${offsetTop}px` }} aria-hidden="true">
                <td colSpan={9} className="p-0 border-0" />
              </tr>
            )}

            {/* Virtualized Visible Slice of Rows */}
            {virtualItems.map(({ index }) => {
              const world = worlds[index];
              if (!world) return null;

              const countdown = getCountdownInfo(world, currentTimeMs);
              const isReady = countdown.isReady;

              return (
                <tr
                  key={world.id}
                  style={{ height: `${ROW_HEIGHT}px` }}
                  className={`hover:bg-slate-800/50 transition-colors ${
                    isReady ? 'bg-emerald-500/5' : ''
                  }`}
                >
                  {/* Nama World */}
                  <td className="py-3 px-4 font-bold text-slate-100 font-game text-sm tracking-wide">
                    <div className="flex items-center gap-1.5">
                      <span>{world.name}</span>
                      {world.notes && (
                        <span
                          className="text-slate-500 hover:text-slate-300 cursor-help"
                          title={world.notes}
                        >
                          💬
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Jenis Tanaman */}
                  <td className="py-3 px-4 text-slate-200">
                    <div className="flex items-center gap-1.5">
                      <span className="text-base">{getCropIcon(world.cropType)}</span>
                      <span className="font-semibold">{world.cropType}</span>
                    </div>
                  </td>

                  {/* Jumlah Pohon */}
                  <td className="py-3 px-4 text-right font-bold text-amber-400 font-mono">
                    {world.treeCount.toLocaleString()}
                  </td>

                  {/* Tanggal & Jam Tanam */}
                  <td className="py-3 px-4 text-slate-400 font-mono text-[11px]">
                    {world.isEmpty ? (
                      <span className="text-slate-500 italic">Belum ditanam</span>
                    ) : (
                      formatDateTime(world.plantedAt)
                    )}
                  </td>

                  {/* Waktu Panen */}
                  <td className="py-3 px-4 text-slate-300 font-mono text-[11px] font-semibold">
                    {world.isEmpty ? (
                      <span className="text-slate-500 italic">Menunggu ditanam</span>
                    ) : (
                      formatDateTime(world.harvestAt)
                    )}
                  </td>

                  {/* Countdown with Visual Progress Bar */}
                  <td className="py-3 px-4">
                    {world.isEmpty ? (
                      <div className="w-28">
                        <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded text-amber-300/90 bg-amber-500/10 border border-amber-500/20 inline-block mb-1">
                          🪹 Farm Kosong
                        </span>
                        <CropProgressBar
                          world={world}
                          currentTimeMs={currentTimeMs}
                          size="sm"
                          showLabels={false}
                        />
                      </div>
                    ) : (
                      <div className="w-28">
                        <span
                          className={`font-mono text-xs font-bold px-2 py-0.5 rounded inline-block mb-1 ${
                            isReady
                              ? 'text-emerald-400 bg-emerald-500/10'
                              : 'text-amber-400 bg-amber-500/10'
                          }`}
                        >
                          {countdown.formatted}
                        </span>
                        <CropProgressBar
                          world={world}
                          currentTimeMs={currentTimeMs}
                          size="sm"
                          showLabels={false}
                        />
                      </div>
                    )}
                  </td>

                  {/* Badge Status */}
                  <td className="py-3 px-4">{renderStatusBadge(world)}</td>

                  {/* Akun Terkait */}
                  <td className="py-3 px-4">
                    <span className="text-slate-300 font-medium bg-[#142038] px-2 py-0.5 rounded text-[11px] border border-slate-700/60">
                      {getAccountName(world.accountId)}
                    </span>
                  </td>

                  {/* Aksi */}
                  <td className="py-3 px-4">
                    <div className="flex items-center justify-center gap-1">
                      {world.isEmpty ? (
                        <button
                          onClick={() => onPlantWorld(world)}
                          title="Tanam Bibit Sekarang"
                          className="p-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold transition-all shadow-md shadow-emerald-500/20 cursor-pointer"
                        >
                          <Sprout className="w-3.5 h-3.5" />
                        </button>
                      ) : (
                        <button
                          onClick={() => onHarvestWorld(world)}
                          title="Panen & Tanam Ulang"
                          className="p-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/40 transition-colors cursor-pointer"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <button
                        onClick={() => onEditWorld(world)}
                        title="Edit Data World"
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors cursor-pointer"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => onDeleteWorld(world)}
                        title="Hapus World"
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 border border-slate-700 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}

            {/* Bottom Spacer for windowed rows below viewport */}
            {offsetBottom > 0 && (
              <tr style={{ height: `${offsetBottom}px` }} aria-hidden="true">
                <td colSpan={9} className="p-0 border-0" />
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Footer Navigation & Status */}
      <div className="px-4 py-2.5 bg-[#09101f] border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
        <span className="text-[11px]">
          Total: <strong className="text-slate-200">{worlds.length} World</strong>
        </span>

        {startIndex > 5 && (
          <button
            type="button"
            onClick={() => scrollToIndex(0)}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-medium transition-colors cursor-pointer"
          >
            <ArrowUp className="w-3 h-3 text-emerald-400" />
            <span>Kembali ke Atas</span>
          </button>
        )}
      </div>
    </div>
  );
};
