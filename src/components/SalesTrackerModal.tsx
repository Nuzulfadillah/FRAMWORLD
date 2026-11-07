import React, { useState, useEffect } from 'react';
import { FarmSaleRecord, World } from '../types';
import {
  X,
  Plus,
  Coins,
  Gem,
  Sprout,
  Package,
  Layers,
  Key,
  Calendar,
  User,
  MapPin,
  Tag,
  Sparkles,
} from 'lucide-react';

interface SalesTrackerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (record: Omit<FarmSaleRecord, 'id' | 'createdAt'>) => void;
  initialPreset?: Partial<Omit<FarmSaleRecord, 'id' | 'createdAt'>> | null;
  worlds?: World[];
}

export const SalesTrackerModal: React.FC<SalesTrackerModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialPreset,
  worlds = [],
}) => {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<FarmSaleRecord['category']>('gems');
  const [itemSold, setItemSold] = useState('');
  const [quantity, setQuantity] = useState<number>(100000);
  const [quantityUnit, setQuantityUnit] = useState<string>('Gems');
  const [revenueWl, setRevenueWl] = useState<number>(50);
  const [priceRate, setPriceRate] = useState<string>('');
  const [buyerName, setBuyerName] = useState('');
  const [worldName, setWorldName] = useState('');
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 16));
  const [notes, setNotes] = useState('');

  // Apply initial preset if provided
  useEffect(() => {
    if (initialPreset) {
      if (initialPreset.title) setTitle(initialPreset.title);
      if (initialPreset.category) setCategory(initialPreset.category);
      if (initialPreset.itemSold) setItemSold(initialPreset.itemSold);
      if (initialPreset.quantity !== undefined) setQuantity(initialPreset.quantity);
      if (initialPreset.quantityUnit) setQuantityUnit(initialPreset.quantityUnit);
      if (initialPreset.revenueWl !== undefined) setRevenueWl(initialPreset.revenueWl);
      if (initialPreset.priceRate) setPriceRate(initialPreset.priceRate);
      if (initialPreset.buyerName) setBuyerName(initialPreset.buyerName);
      if (initialPreset.worldName) setWorldName(initialPreset.worldName);
      if (initialPreset.notes) setNotes(initialPreset.notes);
    } else {
      // Default initial state
      setTitle('Jual 100,000 Gems ke Surgery Pack');
      setCategory('gems');
      setItemSold('Gems (Surgery Pack)');
      setQuantity(100000);
      setQuantityUnit('Gems');
      setRevenueWl(81);
      setPriceRate('8,000 gems = 6.5 WL');
      setBuyerName('');
      setWorldName(worlds[0]?.name || '');
      setNotes('');
    }
  }, [initialPreset, isOpen, worlds]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || revenueWl <= 0) return;

    onSave({
      title: title.trim(),
      category,
      itemSold: itemSold.trim() || title.trim(),
      quantity: Number(quantity) || 0,
      quantityUnit: quantityUnit || 'Pcs',
      revenueWl: Number(revenueWl) || 0,
      priceRate: priceRate.trim() || undefined,
      buyerName: buyerName.trim() || undefined,
      worldName: worldName.trim() || undefined,
      date: new Date(date).toISOString(),
      notes: notes.trim() || undefined,
    });

    onClose();
  };

  const handleApplyPreset = (preset: {
    title: string;
    category: FarmSaleRecord['category'];
    itemSold: string;
    quantity: number;
    unit: string;
    revenueWl: number;
    rate: string;
  }) => {
    setTitle(preset.title);
    setCategory(preset.category);
    setItemSold(preset.itemSold);
    setQuantity(preset.quantity);
    setQuantityUnit(preset.unit);
    setRevenueWl(preset.revenueWl);
    setPriceRate(preset.rate);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200 overflow-y-auto">
      <div className="bg-[#0e172a] border-2 border-slate-700/80 rounded-3xl w-full max-w-xl shadow-2xl overflow-hidden my-8">
        {/* Header */}
        <div className="flex items-center justify-between p-5 sm:p-6 border-b border-slate-800 bg-[#090f1d]">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <Coins className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-100 font-game tracking-wider uppercase">
                Catat Penjualan Hasil Farm
              </h3>
              <p className="text-xs text-slate-400">
                Simpan hasil penjualan Gems, Seed, Block, atau Pack ke riwayat cloud
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Form */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4">
          {/* Quick Presets Carousel */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <Sparkles className="w-3 h-3 text-amber-400" />
              Template Cepat Penjualan Populer
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() =>
                  handleApplyPreset({
                    title: 'Jual 160,000 Gems (20x Surg Pack)',
                    category: 'gems',
                    itemSold: 'Gems ➔ Surgery Pack',
                    quantity: 160000,
                    unit: 'Gems',
                    revenueWl: 130,
                    rate: '8,000 gems = 6.5 WL',
                  })
                }
                className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800/80 border border-slate-800 text-left transition-colors cursor-pointer"
              >
                <span className="text-xs font-bold text-emerald-400 block truncate">
                  💉 20x Surgery Pack
                </span>
                <span className="text-[10px] text-slate-400">160k gems ➔ 130 WL</span>
              </button>

              <button
                type="button"
                onClick={() =>
                  handleApplyPreset({
                    title: 'Jual 100,000 Gems (200x SSP)',
                    category: 'gems',
                    itemSold: 'Gems ➔ SSP',
                    quantity: 100000,
                    unit: 'Gems',
                    revenueWl: 66,
                    rate: '3 pack / 1 WL',
                  })
                }
                className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800/80 border border-slate-800 text-left transition-colors cursor-pointer"
              >
                <span className="text-xs font-bold text-amber-400 block truncate">
                  🌱 200x SSP Pack
                </span>
                <span className="text-[10px] text-slate-400">100k gems ➔ 66 WL</span>
              </button>

              <button
                type="button"
                onClick={() =>
                  handleApplyPreset({
                    title: 'Jual 2,600 Seed Laser Grid',
                    category: 'seed',
                    itemSold: 'Laser Grid Seed',
                    quantity: 2600,
                    unit: 'Seed',
                    revenueWl: 170,
                    rate: '200 seed / 13 WL',
                  })
                }
                className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800/80 border border-slate-800 text-left transition-colors cursor-pointer"
              >
                <span className="text-xs font-bold text-cyan-400 block truncate">
                  ⚡ 2.6k Seed LGrid
                </span>
                <span className="text-[10px] text-slate-400">1 World ➔ 170 WL</span>
              </button>
            </div>
          </div>

          {/* Row 1: Judul Transaksi & Kategori */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
            <div className="sm:col-span-8">
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Judul Penjualan / Transaksi *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Contoh: Jual 200,000 Gems ke Surg Pack"
                required
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#142038] border border-slate-700 text-slate-100 text-sm focus:border-emerald-500 font-medium"
              />
            </div>

            <div className="sm:col-span-4">
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Kategori
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as FarmSaleRecord['category'])}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#142038] border border-slate-700 text-slate-100 text-sm focus:border-emerald-500"
              >
                <option value="gems">💎 Penjualan Gems</option>
                <option value="seed">🌱 Penjualan Seed</option>
                <option value="block">🧱 Penjualan Block</option>
                <option value="pack">📦 Store Pack</option>
                <option value="lock">🗝️ World Lock / DL</option>
                <option value="other">🛠️ Lain-lain</option>
              </select>
            </div>
          </div>

          {/* Row 2: Jumlah & Satuan & Pendapatan WL */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
            <div className="sm:col-span-4">
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Jumlah Terjual
              </label>
              <input
                type="number"
                min="0"
                step="any"
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value) || 0)}
                placeholder="100000"
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#142038] border border-slate-700 text-slate-100 text-sm font-mono font-bold"
              />
            </div>

            <div className="sm:col-span-3">
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Satuan
              </label>
              <select
                value={quantityUnit}
                onChange={(e) => setQuantityUnit(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#142038] border border-slate-700 text-slate-100 text-sm"
              >
                <option value="Gems">💎 Gems</option>
                <option value="Pack">📦 Pack</option>
                <option value="Seed">🌱 Seed</option>
                <option value="Block">🧱 Block</option>
                <option value="WL">🗝️ WL</option>
                <option value="DL">💠 DL</option>
                <option value="Pcs">Item / Pcs</option>
              </select>
            </div>

            <div className="sm:col-span-5">
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1 flex items-center justify-between">
                <span>Pendapatan (World Lock) *</span>
                {revenueWl >= 100 && (
                  <span className="text-[10px] text-cyan-300 font-bold">
                    = {(revenueWl / 100).toFixed(2)} DL
                  </span>
                )}
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="0.1"
                  step="0.1"
                  value={revenueWl}
                  onChange={(e) => setRevenueWl(Number(e.target.value) || 0)}
                  placeholder="Contoh: 130"
                  required
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-[#142038] border border-amber-500/50 text-amber-300 text-sm font-black font-game"
                />
                <span className="absolute left-3 top-2.5 text-xs">🗝️</span>
              </div>
            </div>
          </div>

          {/* Row 3: Rate Harga & Pembeli */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-amber-400" />
                Rasio Kurs / Rate Harga (Opsional)
              </label>
              <input
                type="text"
                value={priceRate}
                onChange={(e) => setPriceRate(e.target.value)}
                placeholder="Contoh: 8k gems = 6.5 WL / 200:13"
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#142038] border border-slate-700 text-slate-100 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-emerald-400" />
                Nama Pembeli / Buyer (Opsional)
              </label>
              <input
                type="text"
                value={buyerName}
                onChange={(e) => setBuyerName(e.target.value)}
                placeholder="Contoh: Dr_SurgIndo / VEND_SHOP"
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#142038] border border-slate-700 text-slate-100 text-sm"
              />
            </div>
          </div>

          {/* Row 4: World Lokasi & Tanggal */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-cyan-400" />
                World Lokasi Transaksi (Opsional)
              </label>
              <input
                type="text"
                value={worldName}
                onChange={(e) => setWorldName(e.target.value.toUpperCase())}
                placeholder="Contoh: BUYSURG_HQ"
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#142038] border border-slate-700 text-slate-100 text-sm font-mono uppercase"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-amber-400" />
                Tanggal & Jam Transaksi
              </label>
              <input
                type="datetime-local"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#142038] border border-slate-700 text-slate-100 text-xs font-mono"
              />
            </div>
          </div>

          {/* Row 5: Catatan */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
              Catatan Tambahan
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Catatan metode pembayaran, hasil panen world mana, dll..."
              className="w-full px-3.5 py-2 rounded-xl bg-[#142038] border border-slate-700 text-slate-100 text-xs focus:border-emerald-500"
            />
          </div>

          {/* Footer Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-slate-400 hover:text-slate-200 text-xs font-semibold transition-colors cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 via-emerald-400 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-black text-xs shadow-lg shadow-emerald-500/20 active:scale-95 transition-all flex items-center gap-2 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Simpan Catatan Penjualan</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
