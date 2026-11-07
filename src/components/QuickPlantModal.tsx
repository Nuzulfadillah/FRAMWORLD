import React, { useState, useEffect } from 'react';
import { World, CropPreset } from '../types';
import { CROP_PRESETS } from '../data/presets';
import { calculateHarvestTime, formatDateTime } from '../utils/time';
import { playHarvestSound } from '../utils/audio';
import confetti from 'canvas-confetti';
import { Sprout, X, Clock, Sparkles, Check, Zap } from 'lucide-react';

interface QuickPlantModalProps {
  world: World | null;
  isOpen: boolean;
  soundEnabled: boolean;
  onClose: () => void;
  onConfirmPlant: (worldId: string, updatedCrop?: { cropType: string; treeCount: number; durationDays: number; durationHours: number; durationMinutes: number }) => void;
}

export const QuickPlantModal: React.FC<QuickPlantModalProps> = ({
  world,
  isOpen,
  soundEnabled,
  onClose,
  onConfirmPlant,
}) => {
  const [selectedCrop, setSelectedCrop] = useState<string>('Laser Grid');
  const [treeCount, setTreeCount] = useState<number>(2600);
  const [durationDays, setDurationDays] = useState<number>(3);
  const [durationHours, setDurationHours] = useState<number>(15);
  const [durationMinutes, setDurationMinutes] = useState<number>(0);

  useEffect(() => {
    if (world) {
      setSelectedCrop(world.cropType || 'Laser Grid');
      setTreeCount(world.treeCount || 2600);
      setDurationDays(world.durationDays ?? 3);
      setDurationHours(world.durationHours ?? 15);
      setDurationMinutes(world.durationMinutes ?? 0);
    }
  }, [world, isOpen]);

  if (!isOpen || !world) return null;

  const currentPreset = CROP_PRESETS.find((c) => c.name === selectedCrop);

  const applyCropPreset = (preset: CropPreset) => {
    setSelectedCrop(preset.name);
    setDurationDays(preset.days);
    setDurationHours(preset.hours);
    setDurationMinutes(preset.minutes);
  };

  const handlePlant = () => {
    playHarvestSound(soundEnabled);
    try {
      confetti({
        particleCount: 60,
        spread: 60,
        origin: { y: 0.6 },
        colors: ['#10b981', '#34d399', '#6ee7b7', '#f59e0b']
      });
    } catch {
      // ignore
    }

    onConfirmPlant(world.id, {
      cropType: selectedCrop,
      treeCount: Number(treeCount) || 2600,
      durationDays,
      durationHours,
      durationMinutes,
    });
    onClose();
  };

  const nowISO = new Date().toISOString();
  const estHarvestISO = calculateHarvestTime(nowISO, durationDays, durationHours, durationMinutes);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div
        className="w-full max-w-md bg-[#0f172a] border-2 border-emerald-500/50 rounded-3xl p-6 shadow-2xl shadow-emerald-950/40 relative overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 p-0.5 shadow-lg shadow-emerald-500/20">
            <div className="w-full h-full bg-[#0a1122] rounded-[14px] flex items-center justify-center text-2xl text-emerald-400">
              🌱
            </div>
          </div>
          <div>
            <div className="inline-flex items-center gap-1.5 text-[10px] font-bold text-amber-400 uppercase tracking-wider">
              <span>🪹 Farm Kosong</span>
              <span>➔</span>
              <span className="text-emerald-400">Mulai Tanam</span>
            </div>
            <h3 className="text-xl font-black text-slate-50 font-game tracking-wider">
              {world.name}
            </h3>
          </div>
        </div>

        <p className="text-xs text-slate-300 mb-4 bg-slate-900/60 p-3 rounded-2xl border border-slate-800">
          World ini sedang kosong. Pilih jenis bibit untuk langsung menanam dan memulai hitung mundur waktu panen!
        </p>

        {/* Crop Selection */}
        <div className="space-y-3.5 mb-5">
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Pilih Jenis Bibit / Pohon
            </label>
            <div className="grid grid-cols-3 gap-2">
              {CROP_PRESETS.slice(0, 6).map((preset) => {
                const isSelected = selectedCrop === preset.name;
                return (
                  <button
                    key={preset.name}
                    type="button"
                    onClick={() => applyCropPreset(preset)}
                    className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300 ring-1 ring-emerald-500/50 shadow-sm'
                        : 'bg-[#142038] border-slate-700/80 text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <div className="text-lg">{preset.icon}</div>
                    <div className="text-xs font-bold truncate mt-0.5">{preset.name}</div>
                    <div className="text-[10px] text-slate-400">{preset.days}h {preset.hours}j</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Tree Count */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Jumlah Pohon Ditanam
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="1"
                value={treeCount}
                onChange={(e) => setTreeCount(Math.max(1, parseInt(e.target.value) || 1))}
                className="flex-1 px-4 py-2.5 rounded-xl bg-[#142038] border border-slate-700 focus:border-emerald-500 text-slate-100 text-sm font-bold"
              />
              <button
                type="button"
                onClick={() => setTreeCount(2600)}
                className="px-3 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300 border border-slate-700 cursor-pointer"
              >
                2,600 Full
              </button>
            </div>
          </div>

          {/* Harvest Preview */}
          <div className="p-3.5 rounded-2xl bg-gradient-to-r from-[#0b1c21] to-[#0d2621] border border-emerald-500/40 text-xs">
            <div className="flex items-center justify-between text-slate-400 mb-1">
              <span className="font-semibold flex items-center gap-1 text-emerald-400">
                <Clock className="w-3.5 h-3.5" />
                Estimasi Waktu Panen Nanti:
              </span>
              <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded font-bold">
                {durationDays}h {durationHours}j
              </span>
            </div>
            <div className="text-sm font-black text-slate-100 font-game tracking-wider">
              {formatDateTime(estHarvestISO)}
            </div>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-700 transition-colors cursor-pointer"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={handlePlant}
            className="flex-2 py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-500 via-emerald-400 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-black text-xs shadow-lg shadow-emerald-500/25 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <Sprout className="w-4 h-4" />
            <span>Mulai Tanam Sekarang</span>
          </button>
        </div>
      </div>
    </div>
  );
};
