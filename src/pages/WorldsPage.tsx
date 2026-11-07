import React, { useState, useMemo } from 'react';
import { World, GrowAccount } from '../types';
import { CROP_PRESETS } from '../data/presets';
import { getWorldStatus, getCountdownInfo, formatDateTime } from '../utils/time';
import { EmptyState } from '../components/EmptyState';
import { CropProgressBar } from '../components/CropProgressBar';
import {
  Search,
  Plus,
  LayoutGrid,
  Table as TableIcon,
  RotateCcw,
  Edit2,
  Trash2,
  Sparkles,
  AlertTriangle,
  Clock,
  ArrowUpDown,
  Filter,
  CheckCircle,
  Sprout,
  Download,
  FileSpreadsheet,
  X,
  Zap,
} from 'lucide-react';
import { exportWorldsToCsv } from '../utils/csvExport';
import { VirtualizedWorldTable } from '../components/VirtualizedWorldTable';
import { VirtualizedWorldCards } from '../components/VirtualizedWorldCards';
import { ConfirmDeleteModal } from '../components/ConfirmDeleteModal';

interface WorldsPageProps {
  worlds: World[];
  accounts: GrowAccount[];
  currentTimeMs: number;
  initialFilterStatus?: string;
  onOpenAddWorld: () => void;
  onEditWorld: (world: World) => void;
  onDeleteWorld: (worldId: string) => void;
  onHarvestWorld: (world: World) => void;
  onPlantWorld: (world: World) => void;
}

export const WorldsPage: React.FC<WorldsPageProps> = ({
  worlds,
  accounts,
  currentTimeMs,
  initialFilterStatus,
  onOpenAddWorld,
  onEditWorld,
  onDeleteWorld,
  onHarvestWorld,
  onPlantWorld,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>(initialFilterStatus || 'all');
  const [cropFilter, setCropFilter] = useState<string>('all');
  const [accountFilter, setAccountFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('soonest');
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('table');
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [exportNotification, setExportNotification] = useState<string | null>(null);
  const [worldToDelete, setWorldToDelete] = useState<World | null>(null);

  // Sync initialFilterStatus if changed by parent navigation
  React.useEffect(() => {
    if (initialFilterStatus !== undefined) {
      setStatusFilter(initialFilterStatus);
    }
  }, [initialFilterStatus]);

  const getAccountName = (accountId: string) => {
    const acc = accounts.find((a) => a.id === accountId);
    return acc ? acc.growId : 'Umum';
  };

  const getCropIcon = (cropType: string) => {
    const p = CROP_PRESETS.find((c) => c.name === cropType);
    return p ? p.icon : '🌱';
  };

  // Distinct crop types
  const cropTypes = useMemo(() => {
    const set = new Set<string>();
    worlds.forEach((w) => set.add(w.cropType));
    return Array.from(set);
  }, [worlds]);

  // Status counts
  const statusCounts = useMemo(() => {
    let ready = 0;
    let growing = 0;
    let overdue = 0;
    let empty = 0;

    worlds.forEach((w) => {
      const s = getWorldStatus(w, currentTimeMs);
      if (s === 'ready') ready++;
      else if (s === 'overdue') overdue++;
      else if (s === 'growing') growing++;
      else if (s === 'empty') empty++;
    });

    return { ready, growing, overdue, empty, all: worlds.length };
  }, [worlds, currentTimeMs]);

  // Filtering & Sorting
  const filteredWorlds = useMemo(() => {
    return worlds
      .filter((w) => {
        const status = getWorldStatus(w, currentTimeMs);

        // Status Filter
        if (statusFilter === 'ready' && status !== 'ready' && status !== 'overdue') return false;
        if (statusFilter === 'growing' && status !== 'growing') return false;
        if (statusFilter === 'overdue' && status !== 'overdue') return false;
        if (statusFilter === 'empty' && status !== 'empty') return false;

        // Crop filter
        if (cropFilter !== 'all' && w.cropType !== cropFilter) return false;

        // Account filter
        if (accountFilter !== 'all' && w.accountId !== accountFilter) return false;

        // Search query
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchName = w.name.toLowerCase().includes(q);
          const matchCrop = w.cropType.toLowerCase().includes(q);
          const matchNotes = (w.notes || '').toLowerCase().includes(q);
          const accName = getAccountName(w.accountId).toLowerCase();
          const matchAcc = accName.includes(q);
          if (!matchName && !matchCrop && !matchNotes && !matchAcc) return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'soonest') {
          if (a.isEmpty && !b.isEmpty) return 1;
          if (!a.isEmpty && b.isEmpty) return -1;
          return new Date(a.harvestAt).getTime() - new Date(b.harvestAt).getTime();
        }
        if (sortBy === 'latest') {
          if (a.isEmpty && !b.isEmpty) return 1;
          if (!a.isEmpty && b.isEmpty) return -1;
          return new Date(b.harvestAt).getTime() - new Date(a.harvestAt).getTime();
        }
        if (sortBy === 'name') {
          return a.name.localeCompare(b.name);
        }
        if (sortBy === 'trees') {
          return b.treeCount - a.treeCount;
        }
        return 0;
      });
  }, [worlds, currentTimeMs, statusFilter, cropFilter, accountFilter, searchQuery, sortBy]);

  const renderStatusBadge = (world: World) => {
    const status = getWorldStatus(world, currentTimeMs);
    const countdown = getCountdownInfo(world, currentTimeMs);

    if (status === 'empty') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30">
          <span>🪹</span>
          <span>Farm Kosong</span>
        </span>
      );
    }
    if (status === 'ready') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
          <Sparkles className="w-3 h-3 text-amber-400" />
          <span>Siap Panen</span>
        </span>
      );
    }
    if (status === 'overdue') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-rose-500/20 text-rose-400 border border-rose-500/40 animate-pulse">
          <AlertTriangle className="w-3 h-3" />
          <span>Terlambat</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-500/20 text-amber-400 border border-amber-500/40">
        <Clock className="w-3 h-3" />
        <span>Tumbuh ({countdown.progressPercent}%)</span>
      </span>
    );
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-100 font-game tracking-wider uppercase flex items-center gap-2">
            <span>DAFTAR WORLD FARMING</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-800 text-emerald-400 border border-slate-700">
              {filteredWorlds.length} World
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 hidden sm:inline-flex items-center gap-1 font-mono">
              <Zap className="w-3 h-3 text-emerald-400" />
              <span>Windowing 60fps</span>
            </span>
          </h1>
          <p className="text-xs text-slate-400">
            Daftar lengkap world Growtopia, status bibit, dan waktu panen otomatis
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* View Mode Switcher */}
          <div className="flex items-center bg-slate-900 border border-slate-800 p-1 rounded-xl">
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-lg text-xs transition-colors cursor-pointer ${
                viewMode === 'table'
                  ? 'bg-emerald-500/20 text-emerald-400 font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Tampilan Tabel"
            >
              <TableIcon className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('cards')}
              className={`p-1.5 rounded-lg text-xs transition-colors cursor-pointer ${
                viewMode === 'cards'
                  ? 'bg-emerald-500/20 text-emerald-400 font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Tampilan Kartu"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
          </div>

          {/* Ekspor CSV Button */}
          <div className="relative">
            <button
              onClick={() => setShowExportMenu((prev) => !prev)}
              className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700/80 hover:border-emerald-500/50 text-slate-200 hover:text-emerald-300 font-bold text-xs active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
              title="Ekspor daftar world ke file CSV (Excel / Spreadsheet)"
            >
              <Download className="w-4 h-4 text-emerald-400" />
              <span className="hidden sm:inline">Ekspor CSV</span>
            </button>

            {showExportMenu && (
              <>
                <div
                  className="fixed inset-0 z-20"
                  onClick={() => setShowExportMenu(false)}
                />
                <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-[#0f172a] border border-slate-700 shadow-2xl p-2 z-30 animate-in fade-in zoom-in-95">
                  <div className="px-2.5 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-800 flex items-center gap-1.5">
                    <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Format CSV (Excel)</span>
                  </div>
                  <div className="pt-1.5 space-y-1">
                    <button
                      onClick={() => {
                        exportWorldsToCsv(filteredWorlds, accounts, currentTimeMs);
                        setExportNotification(`Berhasil mengekspor ${filteredWorlds.length} world (sesuai filter aktif) ke CSV!`);
                        setShowExportMenu(false);
                        setTimeout(() => setExportNotification(null), 4000);
                      }}
                      className="w-full text-left px-3 py-2 rounded-xl text-xs hover:bg-emerald-500/15 text-slate-200 hover:text-emerald-300 font-medium flex items-center justify-between cursor-pointer transition-colors"
                    >
                      <span>Ekspor Hasil Filter</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-slate-800 text-emerald-400 font-mono font-bold">
                        {filteredWorlds.length}
                      </span>
                    </button>
                    <button
                      onClick={() => {
                        exportWorldsToCsv(worlds, accounts, currentTimeMs);
                        setExportNotification(`Berhasil mengekspor seluruh (${worlds.length}) world ke CSV!`);
                        setShowExportMenu(false);
                        setTimeout(() => setExportNotification(null), 4000);
                      }}
                      className="w-full text-left px-3 py-2 rounded-xl text-xs hover:bg-emerald-500/15 text-slate-200 hover:text-emerald-300 font-medium flex items-center justify-between cursor-pointer transition-colors"
                    >
                      <span>Ekspor Semua World</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-slate-800 text-slate-300 font-mono font-bold">
                        {worlds.length}
                      </span>
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>

          <button
            onClick={onOpenAddWorld}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-bold text-xs shadow-md shadow-emerald-500/20 active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah World</span>
          </button>
        </div>
      </div>

      {/* Export Notification Banner */}
      {exportNotification && (
        <div className="p-3.5 rounded-2xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 text-xs flex items-center justify-between shadow-lg shadow-emerald-950/40 animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-2.5">
            <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="font-semibold">{exportNotification}</span>
          </div>
          <button
            onClick={() => setExportNotification(null)}
            className="p-1 text-emerald-400/80 hover:text-emerald-200 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-2xl bg-[#0f172a] border border-slate-800 space-y-3">
        {/* Row 1: Search & Quick Status Tabs */}
        <div className="flex flex-col md:flex-row gap-3 md:items-center justify-between">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari nama world, tanaman, akun, catatan..."
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-[#142038] border border-slate-700/80 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 text-slate-100 text-xs placeholder:text-slate-500 transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-2.5 text-xs text-slate-400 hover:text-slate-200"
              >
                ✕
              </button>
            )}
          </div>

          {/* Status Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
            {[
              { id: 'all', label: 'Semua', count: statusCounts.all },
              { id: 'ready', label: 'Siap Panen', count: statusCounts.ready, color: 'text-emerald-400' },
              { id: 'growing', label: 'Tumbuh', count: statusCounts.growing, color: 'text-amber-400' },
              { id: 'empty', label: 'Farm Kosong', count: statusCounts.empty, color: 'text-amber-300' },
              { id: 'overdue', label: 'Terlambat', count: statusCounts.overdue, color: 'text-rose-400' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setStatusFilter(tab.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer flex items-center gap-1.5 ${
                  statusFilter === tab.id
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                    : 'bg-slate-800/60 text-slate-400 hover:text-slate-200 border border-transparent'
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                    statusFilter === tab.id
                      ? 'bg-emerald-400 text-slate-950'
                      : 'bg-slate-700/80 text-slate-300'
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Row 2: Secondary Dropdowns (Crop, Account, Sort) */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-800/80 text-xs">
          {/* Crop Filter */}
          <div className="flex items-center gap-2">
            <span className="text-slate-400 shrink-0 font-medium">Tanaman:</span>
            <select
              value={cropFilter}
              onChange={(e) => setCropFilter(e.target.value)}
              className="flex-1 px-3 py-1.5 rounded-xl bg-[#142038] border border-slate-700/80 text-slate-200 text-xs focus:border-emerald-500"
            >
              <option value="all">Semua Tanaman ({cropTypes.length})</option>
              {cropTypes.map((crop) => (
                <option key={crop} value={crop}>
                  {getCropIcon(crop)} {crop}
                </option>
              ))}
            </select>
          </div>

          {/* Account Filter */}
          <div className="flex items-center gap-2">
            <span className="text-slate-400 shrink-0 font-medium">Akun:</span>
            <select
              value={accountFilter}
              onChange={(e) => setAccountFilter(e.target.value)}
              className="flex-1 px-3 py-1.5 rounded-xl bg-[#142038] border border-slate-700/80 text-slate-200 text-xs focus:border-emerald-500"
            >
              <option value="all">Semua Akun ({accounts.length})</option>
              {accounts.map((acc) => (
                <option key={acc.id} value={acc.id}>
                  {acc.growId} ({acc.label})
                </option>
              ))}
            </select>
          </div>

          {/* Sort By */}
          <div className="flex items-center gap-2">
            <span className="text-slate-400 shrink-0 font-medium flex items-center gap-1">
              <ArrowUpDown className="w-3 h-3 text-amber-400" />
              Urutkan:
            </span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="flex-1 px-3 py-1.5 rounded-xl bg-[#142038] border border-slate-700/80 text-slate-200 text-xs focus:border-emerald-500 font-medium"
            >
              <option value="soonest">⏳ Sisa Waktu (Tercepat Panen)</option>
              <option value="latest">⏱️ Sisa Waktu (Terlama Panen)</option>
              <option value="name">🔤 Nama World (A - Z)</option>
              <option value="trees">🌳 Jumlah Pohon (Terbanyak)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main World List Content */}
      {filteredWorlds.length === 0 ? (
        <EmptyState
          title="Tidak Ada World Ditemukan"
          description={
            searchQuery || statusFilter !== 'all' || cropFilter !== 'all'
              ? 'Tidak ada world yang cocok dengan filter atau kata kunci pencarian Anda.'
              : 'Anda belum memiliki world farming yang terdaftar. Tambahkan world pertama Anda!'
          }
          actionText={
            searchQuery || statusFilter !== 'all' || cropFilter !== 'all'
              ? 'Reset Filter'
              : 'Tambah World Baru'
          }
          onAction={() => {
            if (searchQuery || statusFilter !== 'all' || cropFilter !== 'all') {
              setSearchQuery('');
              setStatusFilter('all');
              setCropFilter('all');
              setAccountFilter('all');
            } else {
              onOpenAddWorld();
            }
          }}
        />
      ) : viewMode === 'table' ? (
        /* VIRTUALIZED TABLE VIEW (Windowing) */
        <VirtualizedWorldTable
          worlds={filteredWorlds}
          accounts={accounts}
          currentTimeMs={currentTimeMs}
          getCropIcon={getCropIcon}
          getAccountName={getAccountName}
          renderStatusBadge={renderStatusBadge}
          onPlantWorld={onPlantWorld}
          onHarvestWorld={onHarvestWorld}
          onEditWorld={onEditWorld}
          onDeleteWorld={(world) => setWorldToDelete(world)}
        />
      ) : (
        /* VIRTUALIZED CARD VIEW (Windowing) */
        <VirtualizedWorldCards
          worlds={filteredWorlds}
          accounts={accounts}
          currentTimeMs={currentTimeMs}
          getCropIcon={getCropIcon}
          getAccountName={getAccountName}
          renderStatusBadge={renderStatusBadge}
          onPlantWorld={onPlantWorld}
          onHarvestWorld={onHarvestWorld}
          onEditWorld={onEditWorld}
          onDeleteWorld={(world) => setWorldToDelete(world)}
        />
      )}

      {/* Confirmation Modal for World Deletion */}
      <ConfirmDeleteModal
        isOpen={Boolean(worldToDelete)}
        title="Hapus World Farming"
        itemName={worldToDelete?.name || ''}
        itemTypeLabel="World"
        description="World ini akan dihapus dari pemantauan siklus tanam & panen farm Anda."
        onConfirm={() => {
          if (worldToDelete) {
            onDeleteWorld(worldToDelete.id);
            setWorldToDelete(null);
          }
        }}
        onClose={() => setWorldToDelete(null)}
      />
    </div>
  );
};
