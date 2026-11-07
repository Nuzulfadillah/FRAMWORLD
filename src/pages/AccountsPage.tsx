import React, { useState } from 'react';
import { GrowAccount, World } from '../types';
import { EmptyState } from '../components/EmptyState';
import { ConfirmDeleteModal } from '../components/ConfirmDeleteModal';
import {
  ShieldAlert,
  Plus,
  User,
  Globe2,
  Edit2,
  Trash2,
  Award,
  Sparkles,
  ExternalLink,
} from 'lucide-react';

interface AccountsPageProps {
  accounts: GrowAccount[];
  worlds: World[];
  onOpenAddAccount: () => void;
  onEditAccount: (account: GrowAccount) => void;
  onDeleteAccount: (accountId: string) => void;
  onViewWorldsForAccount: (accountId: string) => void;
}

export const AccountsPage: React.FC<AccountsPageProps> = ({
  accounts,
  worlds,
  onOpenAddAccount,
  onEditAccount,
  onDeleteAccount,
  onViewWorldsForAccount,
}) => {
  const [accountToDelete, setAccountToDelete] = useState<GrowAccount | null>(null);

  const getWorldCountForAccount = (accountId: string) => {
    return worlds.filter((w) => w.accountId === accountId).length;
  };

  const getTreeCountForAccount = (accountId: string) => {
    return worlds
      .filter((w) => w.accountId === accountId)
      .reduce((sum, w) => sum + (w.treeCount || 0), 0);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-100 font-game tracking-wider uppercase flex items-center gap-2">
            <span>DAFTAR AKUN GROWTOPIA</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-800 text-amber-400 border border-slate-700">
              {accounts.length} Akun
            </span>
          </h1>
          <p className="text-xs text-slate-400">
            Kelola inventaris GrowID, peran bot/storage, dan pembagian world farming
          </p>
        </div>

        <button
          onClick={onOpenAddAccount}
          className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-bold text-xs shadow-md shadow-amber-500/20 active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah Akun Baru</span>
        </button>
      </div>

      {/* Clear Security Warning Banner as explicitly requested */}
      <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-rose-950/40 via-rose-900/20 to-slate-900/60 border-2 border-rose-500/40 shadow-xl flex flex-col sm:flex-row items-start gap-4">
        <div className="w-10 h-10 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center shrink-0">
          <ShieldAlert className="w-6 h-6" />
        </div>
        <div>
          <h4 className="text-sm font-black text-rose-300 font-game tracking-wider uppercase">
            ⚠️ PERINGATAN KEAMANAN PENTING
          </h4>
          <p className="text-xs text-rose-200/90 leading-relaxed mt-1">
            <strong>Jangan simpan password asli</strong>, passphrase email, atau data rahasia Growtopia Anda di sini! Aplikasi ini murni untuk mencatat nama GrowID dan memantau panen world. Selalu amankan akun Growtopia Anda dengan 2FA resmi dari Ubisoft/Growtopia.
          </p>
        </div>
      </div>

      {/* Account Cards */}
      {accounts.length === 0 ? (
        <EmptyState
          title="Belum Ada Akun Terdaftar"
          description="Tambahkan GrowID Anda untuk mengelompokkan world farm berdasarkan akun pemilik atau holder seed."
          actionText="Tambah Akun Pertama"
          onAction={onOpenAddAccount}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {accounts.map((account) => {
            const worldCount = getWorldCountForAccount(account.id);
            const totalTrees = getTreeCountForAccount(account.id);

            return (
              <div
                key={account.id}
                className="p-5 rounded-2xl bg-[#0f172a] border border-slate-800 hover:border-slate-700 transition-all flex flex-col justify-between shadow-lg group"
              >
                <div>
                  {/* Top: Avatar & GrowID */}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 via-amber-400 to-yellow-300 p-0.5 shadow-md shadow-amber-500/20">
                        <div className="w-full h-full bg-[#0a1122] rounded-[14px] flex items-center justify-center text-lg font-black text-amber-400 font-game">
                          {account.growId.charAt(0).toUpperCase()}
                        </div>
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <h3 className="font-extrabold text-base text-slate-100 font-game tracking-wider group-hover:text-amber-300 transition-colors">
                            {account.growId}
                          </h3>
                        </div>
                        <span className="inline-block text-[11px] font-semibold px-2 py-0.5 rounded-md bg-amber-500/15 text-amber-300 border border-amber-500/30 mt-0.5">
                          {account.label}
                        </span>
                      </div>
                    </div>

                    {account.level && (
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700 flex items-center gap-1">
                        <Award className="w-3 h-3 text-amber-400" />
                        Lv. {account.level}
                      </span>
                    )}
                  </div>

                  {/* World & Tree Stats */}
                  <div className="grid grid-cols-2 gap-2 my-4">
                    <div
                      onClick={() => onViewWorldsForAccount(account.id)}
                      className="p-2.5 rounded-xl bg-[#121c33] border border-slate-800 hover:border-emerald-500/40 transition-colors cursor-pointer text-center group/sub"
                    >
                      <span className="text-[10px] text-slate-400 block font-medium">
                        World Terkait
                      </span>
                      <span className="text-base font-black text-emerald-400 font-game mt-0.5 flex items-center justify-center gap-1">
                        <Globe2 className="w-3.5 h-3.5 text-emerald-400" />
                        {worldCount} World
                      </span>
                      <span className="text-[9px] text-slate-500 group-hover/sub:text-emerald-400 flex items-center justify-center gap-0.5 mt-0.5">
                        Lihat <ExternalLink className="w-2.5 h-2.5" />
                      </span>
                    </div>

                    <div className="p-2.5 rounded-xl bg-[#121c33] border border-slate-800 text-center">
                      <span className="text-[10px] text-slate-400 block font-medium">
                        Total Pohon
                      </span>
                      <span className="text-base font-black text-amber-400 font-game mt-0.5 block">
                        {totalTrees.toLocaleString()}
                      </span>
                      <span className="text-[9px] text-slate-500 block mt-0.5">di semua world</span>
                    </div>
                  </div>

                  {/* Notes */}
                  {account.notes ? (
                    <p className="text-xs text-slate-400 bg-slate-900/60 p-2.5 rounded-xl border border-slate-800/80 mb-3 leading-relaxed">
                      💬 {account.notes}
                    </p>
                  ) : (
                    <p className="text-xs text-slate-500 italic mb-3">Tidak ada catatan.</p>
                  )}
                </div>

                {/* Footer Actions */}
                <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between">
                  <span className="text-[10px] text-slate-500">
                    ID: {account.id}
                  </span>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => onEditAccount(account)}
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors cursor-pointer"
                      title="Edit Akun"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setAccountToDelete(account)}
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 border border-slate-700 transition-colors cursor-pointer"
                      title="Hapus Akun"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Confirmation Modal for Account Deletion */}
      <ConfirmDeleteModal
        isOpen={Boolean(accountToDelete)}
        title="Hapus Akun GrowID"
        itemName={accountToDelete?.growId || ''}
        itemTypeLabel="Akun"
        description="Akun ini akan dihapus dari daftar akun Growtopia yang Anda kelola."
        onConfirm={() => {
          if (accountToDelete) {
            onDeleteAccount(accountToDelete.id);
            setAccountToDelete(null);
          }
        }}
        onClose={() => setAccountToDelete(null)}
      />
    </div>
  );
};
