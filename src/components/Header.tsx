import React, { useState, useEffect } from 'react';
import { World, UserSession } from '../types';
import { getWorldStatus } from '../utils/time';
import { NotificationPopover } from './NotificationPopover';
import {
  Bell,
  Volume2,
  VolumeX,
  Plus,
  LogOut,
  Clock,
  Sparkles,
} from 'lucide-react';
import { playClickSound } from '../utils/audio';

import { NavTab } from './Sidebar';

interface HeaderProps {
  worlds: World[];
  userSession: UserSession;
  soundEnabled: boolean;
  syncStatus?: 'synced' | 'syncing' | 'offline';
  currentTab?: NavTab;
  onTabChange?: (tab: NavTab) => void;
  onOpenChat?: () => void;
  onToggleSound: () => void;
  onOpenAddWorld: () => void;
  onSelectWorld: (world: World) => void;
  onHarvestWorld: (world: World) => void;
  onNavigateToWorlds: () => void;
  onManualSync?: () => void;
  onConnectGoogle?: () => void;
  onLogout: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  worlds,
  userSession,
  soundEnabled,
  syncStatus = 'synced',
  currentTab = 'dashboard',
  onTabChange,
  onOpenChat,
  onToggleSound,
  onOpenAddWorld,
  onSelectWorld,
  onHarvestWorld,
  onNavigateToWorlds,
  onManualSync,
  onConnectGoogle,
  onLogout,
}) => {
  const [currentTimeStr, setCurrentTimeStr] = useState('');
  const [isNotifOpen, setIsNotifOpen] = useState(false);

  // Live clock
  useEffect(() => {
    const updateTime = () => {
      const d = new Date();
      const hours = String(d.getHours()).padStart(2, '0');
      const minutes = String(d.getMinutes()).padStart(2, '0');
      const seconds = String(d.getSeconds()).padStart(2, '0');
      setCurrentTimeStr(`${hours}:${minutes}:${seconds} WIB`);
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const now = Date.now();
  const readyWorlds = worlds.filter((w) => {
    const s = getWorldStatus(w, now);
    return s === 'ready' || s === 'overdue';
  });

  const tabDetails: Record<NavTab, { title: string; icon: string; subtitle: string }> = {
    dashboard: { title: 'Dashboard', icon: '🧭', subtitle: 'Ringkasan Siklus Panen' },
    worlds: { title: 'Daftar World', icon: '🌍', subtitle: 'Monitoring Pohon & Farm' },
    calculator: { title: 'Kalkulator Farm', icon: '🧮', subtitle: 'Estimasi Gems & Penjualan' },
    accounts: { title: 'Akun Petani', icon: '👥', subtitle: 'Kelola GrowID' },
    files: { title: 'Berkas Dokumen', icon: '📁', subtitle: 'PDF & Spreadsheet' },
  };

  const currentTabInfo = tabDetails[currentTab] || tabDetails.dashboard;

  return (
    <header className="sticky top-0 z-30 bg-[#090e1c]/95 backdrop-blur-md border-b border-slate-800/80 px-3 sm:px-6 py-2.5">
      <div className="flex items-center justify-between gap-2 sm:gap-3">
        {/* Left Section: Mobile Brand + Page Title / Desktop Breadcrumb */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          {/* Mobile Brand */}
          <div
            onClick={() => onTabChange && onTabChange('dashboard')}
            className="flex items-center gap-2 lg:hidden cursor-pointer shrink-0"
          >
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 p-0.5 shadow-md shadow-emerald-500/20">
              <div className="w-full h-full bg-[#080d1a] rounded-[10px] flex items-center justify-center text-sm">
                🌱
              </div>
            </div>
          </div>

          {/* Active Page Indicator / Breadcrumb Badge */}
          <div className="flex items-center gap-2 min-w-0">
            <div className="px-2.5 py-1 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center gap-1.5 min-w-0 shadow-xs">
              <span className="text-sm shrink-0">{currentTabInfo.icon}</span>
              <span className="text-xs sm:text-sm font-bold text-slate-100 font-game tracking-wide truncate">
                {currentTabInfo.title}
              </span>
              <span className="hidden xl:inline text-[11px] text-slate-500 font-normal">
                • {currentTabInfo.subtitle}
              </span>
            </div>
          </div>

          {/* Desktop Left: Live Clock */}
          <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-900/80 border border-slate-800 text-slate-300 text-xs font-mono">
            <Clock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span className="font-semibold">{currentTimeStr || '16:00:00 WIB'}</span>
          </div>

          {/* Multi-Device Cloud Sync Status (Desktop + Mobile) */}
          <button
            onClick={() => {
              if (onManualSync) {
                playClickSound(soundEnabled);
                onManualSync();
              }
            }}
            title="Klik untuk sinkronisasi paksa antar device sekarang"
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl border text-[11px] sm:text-xs font-medium transition-all cursor-pointer ${
              syncStatus === 'syncing'
                ? 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                : syncStatus === 'offline'
                ? 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/20'
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full shrink-0 ${
                syncStatus === 'syncing'
                  ? 'bg-amber-400 animate-spin'
                  : syncStatus === 'offline'
                  ? 'bg-rose-400'
                  : 'bg-emerald-400 animate-pulse'
              }`}
            />
            <span className="hidden sm:inline">
              {syncStatus === 'syncing'
                ? 'Sinkronisasi...'
                : syncStatus === 'offline'
                ? 'Offline'
                : 'Sinkron Multi-Device'}
            </span>
            <span className="sm:hidden text-[10px]">
              {syncStatus === 'syncing' ? 'Sync...' : 'Synced'}
            </span>
          </button>
        </div>

        {/* Right Action Icons & Controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Gemini AI Guru Farming Chatbot Button */}
          {onOpenChat && (
            <button
              onClick={() => {
                playClickSound(soundEnabled);
                onOpenChat();
              }}
              title="Tanya Guru Farming AI (Gemini 3.8 Flash + Google Search Grounding)"
              className="flex items-center gap-1.5 px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-xl bg-gradient-to-r from-amber-500/15 via-emerald-500/15 to-cyan-500/15 hover:from-amber-500/25 hover:to-emerald-500/25 text-amber-300 border border-amber-500/40 text-xs font-bold shadow-md shadow-amber-500/10 active:scale-95 transition-all cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden md:inline">Tanya AI Farming</span>
              <span className="md:hidden">AI Bot</span>
            </button>
          )}

          {/* Quick Add Button (Desktop & Mobile) */}
          <button
            onClick={() => {
              playClickSound(soundEnabled);
              onOpenAddWorld();
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-bold text-xs shadow-md shadow-emerald-500/20 active:scale-95 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Tambah World</span>
            <span className="sm:hidden">Tambah</span>
          </button>

          {/* Sound Toggle */}
          <button
            onClick={() => {
              onToggleSound();
              playClickSound(!soundEnabled);
            }}
            title={soundEnabled ? 'Matikan Suara SFX' : 'Nyalakan Suara SFX'}
            className="p-2 sm:p-2.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-300 border border-slate-800 transition-colors cursor-pointer"
          >
            {soundEnabled ? (
              <Volume2 className="w-4 h-4 text-emerald-400" />
            ) : (
              <VolumeX className="w-4 h-4 text-slate-500" />
            )}
          </button>

          {/* Notification Bell with Dropdown Popover */}
          <div className="relative">
            <button
              onClick={() => {
                playClickSound(soundEnabled);
                setIsNotifOpen(!isNotifOpen);
              }}
              title="Notifikasi World Siap Panen"
              className={`p-2 sm:p-2.5 rounded-xl border transition-all cursor-pointer relative ${
                readyWorlds.length > 0
                  ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/25 shadow-md shadow-emerald-500/10'
                  : 'bg-slate-900/80 hover:bg-slate-800 text-slate-300 border-slate-800'
              }`}
            >
              <Bell className="w-4 h-4" />
              {readyWorlds.length > 0 && (
                <span className="absolute -top-1 -right-1 px-1.5 py-0.2 min-w-4 text-[10px] font-black rounded-full bg-emerald-500 text-slate-950 text-center animate-bounce shadow-sm">
                  {readyWorlds.length}
                </span>
              )}
            </button>

            {/* Notification Popover Dropdown */}
            <NotificationPopover
              worlds={worlds}
              isOpen={isNotifOpen}
              onClose={() => setIsNotifOpen(false)}
              onSelectWorld={onSelectWorld}
              onHarvestWorld={onHarvestWorld}
              onNavigateToWorlds={onNavigateToWorlds}
            />
          </div>

          {/* Google Sync Button or Connected Indicator */}
          {!userSession.email && onConnectGoogle && (
            <button
              onClick={() => {
                playClickSound(soundEnabled);
                onConnectGoogle();
              }}
              title="Hubungkan akun Google agar data tersimpan di Cloud SQL dan otomatis muncul di HP / Laptop lain"
              className="flex items-center gap-1.5 px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 text-blue-300 border border-blue-500/40 text-xs font-bold shadow-xs active:scale-95 transition-all cursor-pointer"
            >
              <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span className="hidden sm:inline">Sambung Google</span>
              <span className="sm:hidden">Google</span>
            </button>
          )}

          {/* User Profile Chip & Logout */}
          <div className="flex items-center gap-1.5 pl-2 border-l border-slate-800">
            <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-[#121c33] border border-slate-800">
              <div className="w-6 h-6 rounded-lg bg-gradient-to-tr from-amber-500 to-amber-300 flex items-center justify-center text-xs font-bold text-slate-950 font-game shrink-0">
                {userSession.growId ? userSession.growId.charAt(0).toUpperCase() : 'G'}
              </div>
              <div className="hidden md:block text-left">
                <span className="text-xs font-bold text-slate-200 block leading-tight truncate max-w-[130px]">
                  {userSession.growId}
                </span>
                <span
                  className={`text-[10px] font-medium block leading-none truncate max-w-[130px] ${
                    userSession.email ? 'text-emerald-400' : 'text-slate-400'
                  }`}
                  title={userSession.email || 'Mode Petani Lokal'}
                >
                  {userSession.email ? userSession.email : 'Lokal / Guest'}
                </span>
              </div>
            </div>

            <button
              onClick={onLogout}
              title="Keluar / Ganti Akun"
              className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
