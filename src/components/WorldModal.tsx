import React, { useState, useEffect, useMemo, useRef } from 'react';
import { World, GrowAccount } from '../types';
import { CROP_PRESETS } from '../data/presets';
import {
  calculateHarvestTime,
  formatDateTime,
  formatToInputDateTime,
  getCountdownInfo,
} from '../utils/time';
import {
  X,
  Sparkles,
  Calendar,
  Clock,
  Trees,
  User,
  FileText,
  RotateCcw,
  Check,
  Zap,
  Sprout,
  Trash2,
} from 'lucide-react';

interface WorldModalProps {
  isOpen: boolean;
  worldToEdit?: World | null;
  accounts: GrowAccount[];
  onClose: () => void;
  onSave: (worldData: Omit<World, 'id' | 'harvestCount'> & { id?: string }) => void;
  onHarvestAndReplant?: (worldId: string) => void;
  onDelete?: (worldId: string) => void;
}

export const WorldModal: React.FC<WorldModalProps> = ({
  isOpen,
  worldToEdit,
  accounts,
  onClose,
  onSave,
  onHarvestAndReplant,
  onDelete,
}) => {
  const isEditing = Boolean(worldToEdit);

  // Form State
  const [name, setName] = useState('');
  const [cropType, setCropType] = useState('Laser Grid');
  const [customCropName, setCustomCropName] = useState('');
  const [isCustomCrop, setIsCustomCrop] = useState(false);
  const [treeCount, setTreeCount] = useState<number>(2600);
  const [plantedAt, setPlantedAt] = useState<string>(formatToInputDateTime());
  const [durationDays, setDurationDays] = useState<number>(3);
  const [durationHours, setDurationHours] = useState<number>(15);
  const [durationMinutes, setDurationMinutes] = useState<number>(0);
  const [accountId, setAccountId] = useState<string>('');
  const [notes, setNotes] = useState('');
  const [isEmpty, setIsEmpty] = useState(false);
  const [error, setError] = useState('');

  // Track previous open state so we ONLY initialize form when modal opens, NEVER while user is typing
  const prevIsOpenRef = useRef(false);
  const prevWorldIdRef = useRef<string | null | undefined>(undefined);

  // Safe ISO string converter to prevent any RangeError: Invalid time value crashes
  const safeToISO = (val: string): string => {
    if (!val) return '';
    try {
      const d = new Date(val);
      return isNaN(d.getTime()) ? '' : d.toISOString();
    } catch {
      return '';
    }
  };

  // Sync state ONLY when modal transitions from closed to open, or edited world changes
  useEffect(() => {
    if (!isOpen) {
      prevIsOpenRef.current = false;
      return;
    }

    const justOpened = !prevIsOpenRef.current;
    const worldChanged = worldToEdit?.id !== prevWorldIdRef.current;

    if (justOpened || worldChanged) {
      prevIsOpenRef.current = true;
      prevWorldIdRef.current = worldToEdit?.id;

      if (worldToEdit) {
        setName(worldToEdit.name || '');
        const isPreset = CROP_PRESETS.some((c) => c.name === worldToEdit.cropType);
        if (isPreset) {
          setCropType(worldToEdit.cropType);
          setIsCustomCrop(false);
          setCustomCropName('');
        } else {
          setCropType('custom');
          setIsCustomCrop(true);
          setCustomCropName(worldToEdit.cropType || '');
        }
        setTreeCount(worldToEdit.treeCount ?? 2600);
        setIsEmpty(Boolean(worldToEdit.isEmpty));
        setPlantedAt(
          worldToEdit.plantedAt && !isNaN(new Date(worldToEdit.plantedAt).getTime())
            ? formatToInputDateTime(new Date(worldToEdit.plantedAt))
            : formatToInputDateTime(new Date())
        );
        setDurationDays(worldToEdit.durationDays ?? 3);
        setDurationHours(worldToEdit.durationHours ?? 15);
        setDurationMinutes(worldToEdit.durationMinutes ?? 0);
        setAccountId(worldToEdit.accountId || (accounts[0]?.id ?? ''));
        setNotes(worldToEdit.notes || '');
      } else {
        // New World default
        setName('');
        setCropType('Laser Grid');
        setIsCustomCrop(false);
        setCustomCropName('');
        setTreeCount(2600);
        setIsEmpty(false);
        setPlantedAt(formatToInputDateTime(new Date()));
        setDurationDays(3);
        setDurationHours(15);
        setDurationMinutes(0);
        setAccountId(accounts[0]?.id ?? '');
        setNotes('');
      }
      setError('');
    }
  }, [worldToEdit, isOpen]);

  // Live auto-calculated harvest time (safe fallback)
  const autoHarvestISO = useMemo(() => {
    if (!plantedAt) return new Date().toISOString();
    try {
      return calculateHarvestTime(plantedAt, durationDays, durationHours, durationMinutes);
    } catch {
      return new Date().toISOString();
    }
  }, [plantedAt, durationDays, durationHours, durationMinutes]);

  // Preview countdown info without crashing
  const previewWorldObj: World = useMemo(
    () => ({
      id: 'preview',
      name: name.trim() || 'WORLD_BARU',
      cropType: isCustomCrop ? customCropName.trim() || 'Kustom' : cropType,
      treeCount: Number(treeCount) || 0,
      plantedAt: isEmpty ? '' : safeToISO(plantedAt) || new Date().toISOString(),
      durationDays: Number(durationDays) || 0,
      durationHours: Number(durationHours) || 0,
      durationMinutes: Number(durationMinutes) || 0,
      harvestAt: isEmpty ? '' : autoHarvestISO,
      accountId: accountId || accounts[0]?.id || 'acc-1',
      notes,
      harvestCount: 0,
      isEmpty,
    }),
    [name, isCustomCrop, customCropName, cropType, treeCount, plantedAt, durationDays, durationHours, durationMinutes, autoHarvestISO, accountId, notes, isEmpty, accounts]
  );

  const countdown = useMemo(() => {
    try {
      return getCountdownInfo(previewWorldObj, Date.now());
    } catch {
      return {
        status: 'growing' as const,
        isReady: false,
        isOverdue: false,
        formatted: 'Menghitung...',
        diffMs: 0,
        progressPercent: 0,
        days: 0,
        hours: 0,
        minutes: 0,
        seconds: 0,
      };
    }
  }, [previewWorldObj]);

  const applyCropPreset = (presetName: string, days: number, hours: number, mins: number) => {
    setCropType(presetName);
    setIsCustomCrop(false);
    setCustomCropName('');
    setDurationDays(days);
    setDurationHours(hours);
    setDurationMinutes(mins);
  };

  const handleSubmit = (e?: React.FormEvent) => {
    if (e && e.preventDefault) {
      e.preventDefault();
    }
    const trimmedName = name.trim();
    if (!trimmedName) {
      setError('Nama world tidak boleh kosong! Masukkan nama world (misal: BUYFARM12).');
      return;
    }

    const finalCropType = isCustomCrop ? customCropName.trim() || 'Custom Tree' : cropType;
    const finalPlantedAt = isEmpty
      ? ''
      : safeToISO(plantedAt) || new Date().toISOString();

    onSave({
      id: worldToEdit?.id,
      name: trimmedName.toUpperCase(),
      cropType: finalCropType,
      treeCount: Math.max(0, Number(treeCount) || 0),
      plantedAt: finalPlantedAt,
      durationDays: Math.max(0, Number(durationDays) || 0),
      durationHours: Math.max(0, Number(durationHours) || 0),
      durationMinutes: Math.max(0, Number(durationMinutes) || 0),
      harvestAt: isEmpty ? '' : autoHarvestISO,
      accountId: accountId || accounts[0]?.id || 'acc-1',
      notes: notes.trim(),
      isEmpty,
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-sm overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        className="w-full max-w-2xl bg-[#0d1527] border border-slate-700/80 rounded-3xl shadow-2xl shadow-black/90 overflow-hidden my-6 relative animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 bg-[#111c33] border-b border-slate-700/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 p-0.5">
              <div className="w-full h-full bg-[#0a1122] rounded-[10px] flex items-center justify-center text-emerald-400">
                <Trees className="w-5 h-5" />
              </div>
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-100 font-game tracking-wider">
                {isEditing ? 'EDIT WORLD FARMING' : 'TAMBAH WORLD BARU'}
              </h2>
              <p className="text-xs text-slate-400">
                Pantau rotasi bibit dan estimasi panen Growtopia
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form noValidate onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          {error && (
            <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/40 text-rose-300 text-xs font-semibold">
              {error}
            </div>
          )}

          {/* Row 1: Nama World & Jumlah Pohon */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Nama World <span className="text-amber-400">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value.toUpperCase());
                    if (error) setError('');
                  }}
                  placeholder="CONTOH: BUYFARM12"
                  className="w-full px-4 py-2.5 rounded-xl bg-[#142038] border border-slate-700 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 text-slate-100 text-sm font-bold uppercase placeholder:text-slate-500 tracking-wider transition-all"
                  autoFocus
                  autoComplete="off"
                />
                <span className="absolute right-3 top-2.5 text-[10px] font-bold text-slate-500 bg-slate-800 px-1.5 py-0.5 rounded">
                  GT WORLD
                </span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Jumlah Pohon
              </label>
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <input
                    type="number"
                    min="0"
                    value={treeCount || ''}
                    onChange={(e) => setTreeCount(Math.max(0, parseInt(e.target.value) || 0))}
                    placeholder="2600"
                    className="w-full px-4 py-2.5 rounded-xl bg-[#142038] border border-slate-700 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 text-slate-100 text-sm font-semibold transition-all"
                  />
                  <span className="absolute right-3 top-2.5 text-xs text-slate-400 font-medium">
                    pohon
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setTreeCount(2600)}
                  className="px-2.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-[11px] font-semibold text-slate-300 border border-slate-700 whitespace-nowrap cursor-pointer"
                  title="Standar 1 World Farm ~2,600 Pohon"
                >
                  2.6K Full
                </button>
              </div>
            </div>
          </div>

          {/* Status Farm: Aktif Ditanam vs Farm Kosong */}
          <div className={`p-4 rounded-2xl border transition-all ${isEmpty ? 'bg-amber-500/10 border-amber-500/40 shadow-sm' : 'bg-[#121c33] border-slate-700/80'}`}>
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-lg ${isEmpty ? 'bg-amber-500/20 text-amber-300' : 'bg-emerald-500/20 text-emerald-300'}`}>
                  {isEmpty ? '🪹' : '🌱'}
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-100 flex items-center gap-2">
                    <span>{isEmpty ? 'World Farm Kosong (Belum Ditanam)' : 'World Sedang Aktif Ditanam'}</span>
                    {isEmpty && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 font-extrabold uppercase">
                        Farm Kosong
                      </span>
                    )}
                  </span>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    {isEmpty
                      ? 'Pilih opsi ini jika world baru dibersihkan/selesai panen dan belum diisi bibit.'
                      : 'World sedang memiliki tanaman tumbuh dan hitung mundur panen aktif.'}
                  </p>
                </div>
              </div>

              <label className="relative inline-flex items-center cursor-pointer shrink-0">
                <input
                  type="checkbox"
                  checked={isEmpty}
                  onChange={(e) => setIsEmpty(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
              </label>
            </div>
          </div>

          {/* Row 2: Jenis Tanaman (Dropdown & Custom option) */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Jenis Tanaman
              </label>
              <span className="text-[11px] text-emerald-400">
                Pilih atau klik preset di bawah
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <select
                value={isCustomCrop ? 'custom' : cropType}
                onChange={(e) => {
                  if (e.target.value === 'custom') {
                    setIsCustomCrop(true);
                  } else {
                    const preset = CROP_PRESETS.find((c) => c.name === e.target.value);
                    if (preset) {
                      applyCropPreset(preset.name, preset.days, preset.hours, preset.minutes);
                    }
                  }
                }}
                className="w-full px-4 py-2.5 rounded-xl bg-[#142038] border border-slate-700 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 text-slate-100 text-sm font-medium transition-all"
              >
                {CROP_PRESETS.map((crop) => (
                  <option key={crop.name} value={crop.name}>
                    {crop.icon} {crop.name} ({crop.days}h {crop.hours}j)
                  </option>
                ))}
                <option value="custom">✨ Tanaman Kustom Lainnya...</option>
              </select>

              {isCustomCrop && (
                <input
                  type="text"
                  value={customCropName}
                  onChange={(e) => setCustomCropName(e.target.value)}
                  placeholder="Ketik nama tanaman kustom..."
                  className="w-full px-4 py-2.5 rounded-xl bg-[#142038] border border-amber-500/50 focus:border-amber-400 focus:ring-1 focus:ring-amber-400 text-slate-100 text-sm font-medium placeholder:text-slate-500 animate-in fade-in duration-150"
                  autoFocus
                />
              )}
            </div>

            {/* Presets buttons like requested: "Laser Grid 3h 15j", "Pepper Tree 1h 10j", etc. */}
            <div className="mt-3">
              <span className="text-[11px] text-slate-400 font-medium block mb-2 flex items-center gap-1">
                <Zap className="w-3 h-3 text-amber-400" />
                Tombol Preset Cepat Growtopia:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {CROP_PRESETS.slice(0, 6).map((preset) => {
                  const isSelected = !isCustomCrop && cropType === preset.name;
                  return (
                    <button
                      key={preset.name}
                      type="button"
                      onClick={() =>
                        applyCropPreset(preset.name, preset.days, preset.hours, preset.minutes)
                      }
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 border transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/60 shadow-sm shadow-emerald-500/20 ring-1 ring-emerald-500/50'
                          : 'bg-[#121c33] text-slate-300 border-slate-700/80 hover:bg-slate-800 hover:text-white'
                      }`}
                    >
                      <span>{preset.icon}</span>
                      <span>
                        {preset.name} {preset.days}h {preset.hours}j
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Row 3: Tanggal & Jam Tanam */}
          <div>
            {isEmpty ? (
              <div className="p-3.5 rounded-2xl bg-[#142038] border border-dashed border-amber-500/40 flex items-center gap-2.5">
                <Clock className="w-4 h-4 text-amber-400 shrink-0" />
                <span className="text-xs text-amber-200/90 font-medium">
                  World saat ini ditandai <strong>Farm Kosong</strong>. Tanggal dan jam tanam akan diset otomatis saat bibit mulai ditanam.
                </span>
              </div>
            ) : (
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-emerald-400" />
                    Tanggal & Jam Tanam
                  </label>
                  <button
                    type="button"
                    onClick={() => setPlantedAt(formatToInputDateTime(new Date()))}
                    className="text-[11px] text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    <Clock className="w-3 h-3" />
                    <span>Set Waktu Sekarang</span>
                  </button>
                </div>
                <input
                  type="datetime-local"
                  value={plantedAt}
                  onChange={(e) => setPlantedAt(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-[#142038] border border-slate-700 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 text-slate-100 text-sm font-medium transition-all"
                />
              </div>
            )}
          </div>

          {/* Row 4: Durasi Tumbuh (Hari, Jam, Menit) */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              Durasi Tumbuh
            </label>
            <div className="grid grid-cols-3 gap-3">
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  max="365"
                  value={durationDays}
                  onChange={(e) => setDurationDays(Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-full px-3 py-2.5 rounded-xl bg-[#142038] border border-slate-700 text-slate-100 text-sm font-bold text-center"
                />
                <span className="block text-center text-[10px] text-slate-400 font-semibold mt-1">
                  Hari (h)
                </span>
              </div>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  max="23"
                  value={durationHours}
                  onChange={(e) => setDurationHours(Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-full px-3 py-2.5 rounded-xl bg-[#142038] border border-slate-700 text-slate-100 text-sm font-bold text-center"
                />
                <span className="block text-center text-[10px] text-slate-400 font-semibold mt-1">
                  Jam (j)
                </span>
              </div>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  max="59"
                  value={durationMinutes}
                  onChange={(e) => setDurationMinutes(Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-full px-3 py-2.5 rounded-xl bg-[#142038] border border-slate-700 text-slate-100 text-sm font-bold text-center"
                />
                <span className="block text-center text-[10px] text-slate-400 font-semibold mt-1">
                  Menit (m)
                </span>
              </div>
            </div>
          </div>

          {/* Highlighted Automatic Harvest Time (Waktu Panen yang Dihitung Otomatis) */}
          {isEmpty ? (
            <div className="p-4 rounded-2xl bg-gradient-to-r from-[#181820] via-[#151c2a] to-[#121927] border border-slate-700/80 shadow-inner">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[11px] font-bold text-slate-400 tracking-wider uppercase flex items-center gap-1.5">
                  <span>🪹</span>
                  <span>STATUS: FARM KOSONG</span>
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 border border-slate-700">
                  Belum Ditanam
                </span>
              </div>
              <div className="text-sm sm:text-base font-extrabold text-slate-200 font-game tracking-wider">
                Siap ditanami {treeCount.toLocaleString()} slot pohon
              </div>
              <div className="mt-1 text-xs text-slate-400">
                Durasi panen yang disiapkan: <strong className="text-amber-400">{durationDays}h {durationHours}j {durationMinutes}m</strong> ({cropType})
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-2xl bg-gradient-to-r from-[#0a1b24] via-[#0f2324] to-[#142921] border border-emerald-500/40 shadow-inner">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] font-bold text-emerald-400 tracking-wider uppercase flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  Waktu Panen Otomatis Dihitung
                </span>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                    countdown.isReady
                      ? 'bg-emerald-500 text-slate-950 font-bold'
                      : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  }`}
                >
                  {countdown.formatted}
                </span>
              </div>
              <div className="text-base sm:text-lg font-black text-slate-100 font-game tracking-wider">
                {formatDateTime(autoHarvestISO)}
              </div>
              <div className="mt-2 text-xs text-slate-400 flex items-center gap-2">
                <div className="flex-1 bg-slate-800 rounded-full h-1.5 overflow-hidden">
                  <div
                    className="bg-emerald-400 h-full rounded-full transition-all duration-300"
                    style={{ width: `${countdown.progressPercent}%` }}
                  />
                </div>
                <span className="text-[11px] font-semibold text-emerald-400">
                  {countdown.progressPercent}%
                </span>
              </div>
            </div>
          )}

          {/* Row 5: Pilihan Akun */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-slate-400" />
              Pilihan Akun Terkait
            </label>
            <select
              value={accountId}
              onChange={(e) => setAccountId(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-[#142038] border border-slate-700 focus:border-emerald-500 text-slate-100 text-sm font-medium transition-all"
            >
              {accounts.map((acc) => (
                <option key={acc.id} value={acc.id}>
                  {acc.growId} ({acc.label})
                </option>
              ))}
            </select>
          </div>

          {/* Row 6: Catatan */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-slate-400" />
              Catatan Khusus (Opsional)
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Contoh: Lokasi pintu platform, nomor lock, slot BFG, dll."
              className="w-full px-4 py-2.5 rounded-xl bg-[#142038] border border-slate-700 focus:border-emerald-500 text-slate-100 text-sm font-medium placeholder:text-slate-500 transition-all resize-none"
            />
          </div>

          {/* Modal Footer Buttons */}
          <div className="pt-4 border-t border-slate-700/80 flex flex-col sm:flex-row gap-2.5 sm:items-center sm:justify-between">
            {isEditing && worldToEdit?.isEmpty ? (
              <button
                type="button"
                onClick={() => {
                  setIsEmpty(false);
                  setPlantedAt(formatToInputDateTime(new Date()));
                }}
                className="order-3 sm:order-1 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 text-xs font-black shadow-md shadow-emerald-500/20 active:scale-95 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Sprout className="w-4 h-4" />
                <span>Mulai Tanam Bibit Sekarang</span>
              </button>
            ) : isEditing && worldToEdit && onHarvestAndReplant ? (
              <button
                type="button"
                onClick={() => {
                  onHarvestAndReplant(worldToEdit.id);
                  onClose();
                }}
                className="order-3 sm:order-1 px-4 py-2.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <RotateCcw className="w-4 h-4 text-amber-400" />
                <span>Tandai Sudah Dipanen / Tanam Ulang</span>
              </button>
            ) : (
              <div className="order-3 sm:order-1" />
            )}

            {isEditing && onDelete && worldToEdit && (
              <button
                type="button"
                onClick={() => {
                  onDelete(worldToEdit.id);
                  onClose();
                }}
                className="order-4 sm:order-1 px-3.5 py-2.5 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/40 text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                title="Hapus World ini"
              >
                <Trash2 className="w-4 h-4 text-rose-400" />
                <span>Hapus World</span>
              </button>
            )}

            <div className="flex items-center gap-2.5 order-1 sm:order-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-700 transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                type="submit"
                onClick={() => handleSubmit()}
                className="flex-1 sm:flex-none px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 text-xs font-bold shadow-lg shadow-emerald-500/20 active:scale-95 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>Simpan World</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
