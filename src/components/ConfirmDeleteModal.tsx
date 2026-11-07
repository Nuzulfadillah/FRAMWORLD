import React from 'react';
import { Trash2, AlertTriangle, X } from 'lucide-react';

interface ConfirmDeleteModalProps {
  isOpen: boolean;
  title: string;
  itemName: string;
  itemTypeLabel?: string;
  description?: string;
  onConfirm: () => void;
  onClose: () => void;
}

export const ConfirmDeleteModal: React.FC<ConfirmDeleteModalProps> = ({
  isOpen,
  title,
  itemName,
  itemTypeLabel = 'Item',
  description,
  onConfirm,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div
        className="w-full max-w-md bg-[#0e1628] border-2 border-rose-500/40 rounded-3xl p-6 sm:p-7 shadow-2xl shadow-rose-950/40 relative overflow-hidden animate-scale-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Ambient Top Glow */}
        <div className="absolute top-0 right-0 w-36 h-36 bg-rose-500/10 rounded-full blur-2xl pointer-events-none" />

        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-800/80 transition-colors cursor-pointer"
          title="Tutup"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header Icon + Title */}
        <div className="flex items-start gap-4 mb-5">
          <div className="w-12 h-12 rounded-2xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-400 shrink-0 shadow-lg shadow-rose-500/10">
            <Trash2 className="w-6 h-6" />
          </div>
          <div className="pt-0.5">
            <span className="text-[11px] font-bold text-rose-400 uppercase tracking-wider block font-pixel">
              KONFIRMASI PENGHAPUSAN
            </span>
            <h3 className="text-lg font-black text-slate-100 font-game tracking-wide mt-0.5">
              {title}
            </h3>
          </div>
        </div>

        {/* Content Box */}
        <div className="p-3.5 rounded-2xl bg-[#090f1f] border border-slate-800 mb-5">
          <div className="flex items-center gap-2 text-xs text-slate-400 mb-1">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span>Anda akan menghapus {itemTypeLabel.toLowerCase()}:</span>
          </div>
          <div className="text-sm font-bold text-slate-100 font-game tracking-wide truncate px-1">
            "{itemName}"
          </div>
          {description && (
            <p className="text-xs text-slate-400 mt-2 leading-relaxed border-t border-slate-800/80 pt-2">
              {description}
            </p>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs border border-slate-700 transition-colors cursor-pointer"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-rose-600 via-rose-500 to-red-500 hover:from-rose-500 hover:to-red-400 text-white font-black text-xs shadow-lg shadow-rose-600/30 active:scale-95 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Ya, Hapus Sekarang</span>
          </button>
        </div>
      </div>
    </div>
  );
};
