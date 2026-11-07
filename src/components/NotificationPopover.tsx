import React from 'react';
import { World } from '../types';
import { getWorldStatus } from '../utils/time';
import { Sparkles, CheckCircle2, AlertTriangle, ArrowRight } from 'lucide-react';

interface NotificationPopoverProps {
  worlds: World[];
  isOpen: boolean;
  onClose: () => void;
  onSelectWorld: (world: World) => void;
  onHarvestWorld: (world: World) => void;
  onNavigateToWorlds: () => void;
}

export const NotificationPopover: React.FC<NotificationPopoverProps> = ({
  worlds,
  isOpen,
  onClose,
  onSelectWorld,
  onHarvestWorld,
  onNavigateToWorlds,
}) => {
  if (!isOpen) return null;

  const now = Date.now();
  const alertWorlds = worlds.filter((w) => {
    const s = getWorldStatus(w, now);
    return s === 'ready' || s === 'overdue';
  });

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-40" onClick={onClose} />

      {/* Popover */}
      <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 rounded-2xl bg-[#0e1628] border border-slate-700/80 shadow-2xl shadow-black/80 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="px-4 py-3 bg-[#131d33] border-b border-slate-700/80 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping"></div>
            <span className="font-bold text-sm text-slate-100 font-game tracking-wider">
              NOTIFIKASI PANEN ({alertWorlds.length})
            </span>
          </div>
          <span className="text-[11px] text-slate-400 px-2 py-0.5 rounded-full bg-slate-800">
            Realtime
          </span>
        </div>

        <div className="max-h-[320px] overflow-y-auto divide-y divide-slate-800/80 p-2 space-y-1">
          {alertWorlds.length === 0 ? (
            <div className="py-8 px-4 text-center text-slate-400">
              <CheckCircle2 className="w-8 h-8 text-emerald-400/60 mx-auto mb-2" />
              <p className="text-sm font-medium text-slate-300">Semua world terkontrol!</p>
              <p className="text-xs text-slate-500 mt-1">
                Tidak ada world yang siap panen saat ini.
              </p>
            </div>
          ) : (
            alertWorlds.map((world) => {
              const status = getWorldStatus(world, now);
              const isOverdue = status === 'overdue';

              return (
                <div
                  key={world.id}
                  className="p-3 rounded-xl hover:bg-slate-800/50 transition-colors flex items-center justify-between gap-3 group"
                >
                  <div
                    className="flex-1 min-w-0 cursor-pointer"
                    onClick={() => {
                      onSelectWorld(world);
                      onClose();
                    }}
                  >
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-sm text-slate-100 group-hover:text-emerald-300 transition-colors truncate">
                        {world.name}
                      </span>
                      {isOverdue ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30">
                          <AlertTriangle className="w-2.5 h-2.5" />
                          Terlambat
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                          <Sparkles className="w-2.5 h-2.5" />
                          Siap
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {world.cropType} • {world.treeCount.toLocaleString()} pohon
                    </p>
                  </div>

                  <button
                    onClick={() => {
                      onHarvestWorld(world);
                      onClose();
                    }}
                    className="shrink-0 px-2.5 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold shadow-md shadow-emerald-500/20 active:scale-95 transition-all flex items-center gap-1 cursor-pointer"
                  >
                    <span>Panen</span>
                  </button>
                </div>
              );
            })
          )}
        </div>

        <div className="p-2.5 bg-[#0a101d] border-t border-slate-800/80 text-center">
          <button
            onClick={() => {
              onNavigateToWorlds();
              onClose();
            }}
            className="w-full py-1.5 text-xs text-emerald-400 hover:text-emerald-300 font-semibold flex items-center justify-center gap-1 transition-colors cursor-pointer"
          >
            <span>Buka Semua Daftar World</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </>
  );
};
