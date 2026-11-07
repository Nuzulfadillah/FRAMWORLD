import React from 'react';
import {
  LayoutDashboard,
  Globe2,
  Users,
  FolderKanban,
  Sprout,
  ShieldCheck,
  PlusCircle,
  Gem,
  Calculator,
} from 'lucide-react';
import { World, GrowAccount } from '../types';
import { getWorldStatus } from '../utils/time';

export type NavTab = 'dashboard' | 'worlds' | 'calculator' | 'accounts' | 'files';

interface SidebarProps {
  currentTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  worlds: World[];
  accounts: GrowAccount[];
  onOpenAddWorld: () => void;
  onNavigateToWorlds?: (statusFilter?: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onTabChange,
  worlds,
  accounts,
  onOpenAddWorld,
  onNavigateToWorlds,
}) => {
  const now = Date.now();
  const readyCount = worlds.filter((w) => {
    const s = getWorldStatus(w, now);
    return s === 'ready' || s === 'overdue';
  }).length;

  const totalTrees = worlds.reduce((acc, w) => acc + (w.treeCount || 0), 0);

  const navItems = [
    {
      id: 'dashboard' as NavTab,
      label: 'Dashboard',
      sublabel: 'Ringkasan & Countdown',
      icon: LayoutDashboard,
      badge: readyCount > 0 ? readyCount : undefined,
      badgeColor: 'bg-emerald-500 text-slate-950',
    },
    {
      id: 'worlds' as NavTab,
      label: 'Daftar World',
      sublabel: `${worlds.length} World Terdaftar`,
      icon: Globe2,
      badge: worlds.length,
      badgeColor: 'bg-slate-800 text-slate-300',
    },
    {
      id: 'calculator' as NavTab,
      label: 'Kalkulator Farm',
      sublabel: 'Profit, Gems & Rotasi',
      icon: Calculator,
      badge: 'PRO',
      badgeColor: 'bg-amber-500/20 text-amber-300 border border-amber-500/30',
    },
    {
      id: 'accounts' as NavTab,
      label: 'Akun Growtopia',
      sublabel: `${accounts.length} Akun Terkait`,
      icon: Users,
    },
    {
      id: 'files' as NavTab,
      label: 'Berkas & Dokumen',
      sublabel: 'PDF & Spreadsheet',
      icon: FolderKanban,
    },
  ];

  return (
    <aside className="hidden lg:flex flex-col w-64 shrink-0 bg-[#0a101f] border-r border-slate-800/80 min-h-screen z-20">
      {/* Brand Logo */}
      <div className="p-5 border-b border-slate-800/80 bg-gradient-to-b from-[#0e162b] to-[#0a101f]">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-emerald-500 via-emerald-600 to-teal-700 p-0.5 shadow-lg shadow-emerald-500/20">
            <div className="w-full h-full bg-[#080d1a] rounded-[14px] flex items-center justify-center text-xl text-emerald-400">
              🌱
            </div>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-pixel text-[11px] text-amber-400 tracking-tighter">
                GROWTOPIA
              </span>
              <span className="text-[10px] px-1 py-0.2 bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 rounded font-bold">
                PRO
              </span>
            </div>
            <h1 className="font-bold text-sm text-slate-100 font-game tracking-wider uppercase">
              Farm Manager
            </h1>
          </div>
        </div>
      </div>

      {/* Quick Add World CTA */}
      <div className="p-4">
        <button
          onClick={onOpenAddWorld}
          className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/20 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Tambah World Baru</span>
        </button>
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 px-3 py-2 space-y-1.5">
        <div className="px-3 pb-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
          Navigasi Utama
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`w-full text-left px-3.5 py-3 rounded-2xl transition-all flex items-center justify-between group cursor-pointer ${
                isActive
                  ? 'bg-gradient-to-r from-emerald-500/15 to-transparent text-emerald-300 border-l-4 border-emerald-400 font-bold shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`p-2 rounded-xl transition-colors ${
                    isActive
                      ? 'bg-emerald-500/20 text-emerald-300'
                      : 'bg-slate-800/50 text-slate-400 group-hover:text-slate-200 group-hover:bg-slate-800'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-semibold tracking-wide">{item.label}</div>
                  <div className="text-[10px] text-slate-500 font-normal">{item.sublabel}</div>
                </div>
              </div>

              {item.badge !== undefined && (
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    item.badgeColor || 'bg-slate-800 text-slate-300'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Mini Stats Card in Sidebar */}
      <div className="p-4 mx-3 mb-3 rounded-2xl bg-[#0e1629] border border-slate-800/90">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
            <Gem className="w-3 h-3 text-amber-400" />
            Statistik Petani
          </span>
          <span className="text-[10px] text-emerald-400 font-bold">Aktif</span>
        </div>
        <div className="grid grid-cols-2 gap-2 text-center">
          <button
            onClick={() => {
              if (onNavigateToWorlds) onNavigateToWorlds('all');
              else onTabChange('worlds');
            }}
            title="Lihat semua world"
            className="p-2 rounded-xl bg-slate-900/60 hover:bg-slate-800/80 border border-slate-800 hover:border-slate-700 transition-colors text-left sm:text-center cursor-pointer"
          >
            <span className="text-[10px] text-slate-400 block">Total Pohon</span>
            <span className="text-xs font-extrabold text-amber-400 font-game">
              {totalTrees.toLocaleString()}
            </span>
          </button>
          <button
            onClick={() => {
              if (onNavigateToWorlds) onNavigateToWorlds('ready');
              else onTabChange('worlds');
            }}
            title="Lihat world siap panen"
            className={`p-2 rounded-xl border transition-colors cursor-pointer text-left sm:text-center ${
              readyCount > 0
                ? 'bg-emerald-500/10 hover:bg-emerald-500/20 border-emerald-500/30'
                : 'bg-slate-900/60 hover:bg-slate-800/80 border-slate-800'
            }`}
          >
            <span className="text-[10px] text-slate-400 block">Siap Panen</span>
            <span
              className={`text-xs font-extrabold font-game ${
                readyCount > 0 ? 'text-emerald-400 animate-pulse' : 'text-slate-400'
              }`}
            >
              {readyCount} World
            </span>
          </button>
        </div>
      </div>

      {/* Bottom Footer Info */}
      <div className="p-4 border-t border-slate-800/80 bg-[#070c17]">
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
          <span className="text-[11px] leading-tight">
            Penyimpanan aman lokal di browser Anda
          </span>
        </div>
      </div>
    </aside>
  );
};
