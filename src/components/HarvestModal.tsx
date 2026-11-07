import React, { useEffect } from 'react';
import { World, CropPreset } from '../types';
import { CROP_PRESETS } from '../data/presets';
import { Sparkles, Sprout, Check, X, RefreshCw } from 'lucide-react';
import confetti from 'canvas-confetti';
import { playHarvestSound } from '../utils/audio';

interface HarvestModalProps {
  world: World | null;
  isOpen: boolean;
  soundEnabled: boolean;
  onClose: () => void;
  onReplant: (worldId: string) => void;
  onMarkHarvestedOnly: (worldId: string) => void;
}

export const HarvestModal: React.FC<HarvestModalProps> = ({
  world,
  isOpen,
  soundEnabled,
  onClose,
  onReplant,
  onMarkHarvestedOnly,
}) => {
  useEffect(() => {
    if (isOpen && world) {
      playHarvestSound(soundEnabled);
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#10b981', '#f59e0b', '#38bdf8', '#fbbf24', '#ffffff']
        });
      } catch {
        // ignore
      }
    }
  }, [isOpen, world, soundEnabled]);

  if (!isOpen || !world) return null;

  const crop = CROP_PRESETS.find((c: CropPreset) => c.name === world.cropType);
  const estGems = Math.round(world.treeCount * 11.5);
  const estSeeds = Math.round(world.treeCount * 1.04);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="w-full max-w-md bg-[#0f172a] border-2 border-emerald-500/60 rounded-3xl p-6 shadow-2xl shadow-emerald-500/20 text-center relative overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Glow ambient background */}
        <div className="absolute -top-20 -left-20 w-48 h-48 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -right-20 w-48 h-48 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />

        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-slate-100 hover:bg-slate-800/60 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Big harvest badge */}
        <div className="mx-auto w-20 h-20 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-400 p-0.5 shadow-xl shadow-emerald-500/30 mb-4 animate-bounce">
          <div className="w-full h-full bg-[#0c1424] rounded-2xl flex items-center justify-center text-4xl">
            {crop?.icon || '🌳'}
          </div>
        </div>

        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold uppercase tracking-wider mb-2">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Panen Berhasil!</span>
        </div>

        <h3 className="text-2xl font-black text-slate-50 font-game tracking-wider">
          {world.name}
        </h3>
        <p className="text-slate-400 text-sm mt-1">
          Pohon <span className="text-emerald-400 font-semibold">{world.cropType}</span> siap diambil hasilnya!
        </p>

        {/* Estimated drops card */}
        <div className="grid grid-cols-2 gap-3 my-5">
          <div className="bg-[#141e33] border border-slate-700/80 rounded-2xl p-3">
            <span className="text-[11px] text-slate-400 block font-medium">Estimasi Gems</span>
            <div className="text-xl font-black text-amber-400 font-game flex items-center justify-center gap-1 mt-0.5">
              <span>💎</span>
              <span>~{estGems.toLocaleString()}</span>
            </div>
            <span className="text-[10px] text-slate-500">Berdasarkan {world.treeCount.toLocaleString()} pohon</span>
          </div>

          <div className="bg-[#141e33] border border-slate-700/80 rounded-2xl p-3">
            <span className="text-[11px] text-slate-400 block font-medium">Estimasi Seed</span>
            <div className="text-xl font-black text-emerald-400 font-game flex items-center justify-center gap-1 mt-0.5">
              <span>🌱</span>
              <span>~{estSeeds.toLocaleString()}</span>
            </div>
            <span className="text-[10px] text-slate-500">Rasio drop ~104%</span>
          </div>
        </div>

        <p className="text-xs text-slate-300 mb-6 bg-slate-800/40 py-2 px-3 rounded-xl border border-slate-700/50">
          💡 Mau langsung tanam ulang sekarang agar hitung mundur panen berikutnya otomatis dimulai?
        </p>

        <div className="flex flex-col gap-2.5">
          <button
            onClick={() => onReplant(world.id)}
            className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-500 via-emerald-400 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-bold text-sm shadow-lg shadow-emerald-500/25 active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <RefreshCw className="w-4 h-4 animate-spin-reverse" />
            <span>Tanam Ulang Sekarang (Reset Countdown)</span>
          </button>

          <button
            onClick={() => onMarkHarvestedOnly(world.id)}
            className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors flex items-center justify-center gap-2 cursor-pointer"
          >
            <Check className="w-4 h-4 text-emerald-400" />
            <span>Tandai Selesai Dipanen Saja</span>
          </button>
        </div>
      </div>
    </div>
  );
};
