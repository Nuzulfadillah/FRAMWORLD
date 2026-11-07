import React, { useState, useEffect } from 'react';
import { GrowAccount } from '../types';
import { X, ShieldAlert, User, Tag, FileText, Check, AlertTriangle } from 'lucide-react';

interface AccountModalProps {
  isOpen: boolean;
  accountToEdit?: GrowAccount | null;
  onClose: () => void;
  onSave: (accountData: Omit<GrowAccount, 'id' | 'createdAt'> & { id?: string }) => void;
}

export const AccountModal: React.FC<AccountModalProps> = ({
  isOpen,
  accountToEdit,
  onClose,
  onSave,
}) => {
  const [growId, setGrowId] = useState('');
  const [label, setLabel] = useState('Akun Utama');
  const [level, setLevel] = useState<number>(40);
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (accountToEdit) {
      setGrowId(accountToEdit.growId);
      setLabel(accountToEdit.label);
      setLevel(accountToEdit.level || 1);
      setNotes(accountToEdit.notes || '');
    } else {
      setGrowId('');
      setLabel('Akun Utama');
      setLevel(35);
      setNotes('');
    }
    setError('');
  }, [accountToEdit, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!growId.trim()) {
      setError('GrowID tidak boleh kosong.');
      return;
    }

    onSave({
      id: accountToEdit?.id,
      growId: growId.trim(),
      label: label.trim() || 'Farming',
      level: Math.max(1, Number(level) || 1),
      notes: notes.trim(),
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div
        className="w-full max-w-lg bg-[#0d1527] border border-slate-700/80 rounded-3xl shadow-2xl shadow-black/80 overflow-hidden animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 bg-[#111c33] border-b border-slate-700/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-amber-300 p-0.5">
              <div className="w-full h-full bg-[#0a1122] rounded-[10px] flex items-center justify-center text-amber-400">
                <User className="w-5 h-5" />
              </div>
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-100 font-game tracking-wider">
                {accountToEdit ? 'EDIT AKUN GROWTOPIA' : 'TAMBAH AKUN GROWTOPIA'}
              </h2>
              <p className="text-xs text-slate-400">Kelola identitas akun dan penyimpanan world</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Clear Security Warning Banner as requested */}
        <div className="mx-6 mt-5 p-3.5 rounded-2xl bg-rose-500/15 border border-rose-500/40 text-rose-200 text-xs flex items-start gap-3">
          <ShieldAlert className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold text-rose-300 block mb-0.5">
              PERINGATAN KEAMANAN PENTING:
            </span>
            <p className="text-[11px] leading-relaxed text-rose-200/90 font-medium">
              <strong>Jangan pernah simpan password asli</strong>, passphrase email, atau data login sensitif Growtopia Anda di sini! Form ini hanya untuk mencatat GrowID dan pengelompokan farming.
            </p>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/40 text-rose-300 text-xs font-semibold">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-amber-400" />
              GrowID <span className="text-amber-400">*</span>
            </label>
            <input
              type="text"
              value={growId}
              onChange={(e) => setGrowId(e.target.value)}
              placeholder="Contoh: NuzulFarmer"
              className="w-full px-4 py-2.5 rounded-xl bg-[#142038] border border-slate-700 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 text-slate-100 text-sm font-bold placeholder:text-slate-500 transition-all"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-slate-400" />
                Label / Peran
              </label>
              <select
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-[#142038] border border-slate-700 focus:border-amber-500 text-slate-100 text-sm font-medium transition-all"
              >
                <option value="Akun Utama (Main)">Akun Utama (Main)</option>
                <option value="Holder Seed / Storage">Holder Seed / Storage</option>
                <option value="Sub-Farm & BFG">Sub-Farm & BFG</option>
                <option value="World Lock Buyer/Seller">World Lock Buyer/Seller</option>
                <option value="Kustom">Kustom / Lainnya</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Level Akun (Opsional)
              </label>
              <input
                type="number"
                min="1"
                max="125"
                value={level}
                onChange={(e) => setLevel(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-full px-4 py-2.5 rounded-xl bg-[#142038] border border-slate-700 focus:border-amber-500 text-slate-100 text-sm font-semibold transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-slate-400" />
              Catatan Akun
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Contoh: Simpan 50k seed Laser Grid, Rayman item aktif, dll."
              className="w-full px-4 py-2.5 rounded-xl bg-[#142038] border border-slate-700 focus:border-amber-500 text-slate-100 text-sm font-medium placeholder:text-slate-500 transition-all resize-none"
            />
          </div>

          <div className="pt-4 border-t border-slate-700/80 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-700 transition-colors cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 text-xs font-bold shadow-lg shadow-amber-500/20 active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>Simpan Akun</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
