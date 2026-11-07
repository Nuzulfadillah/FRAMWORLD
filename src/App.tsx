/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { World, GrowAccount, FarmFile, UserSession, FarmSaleRecord } from './types';
import {
  INITIAL_WORLDS,
  INITIAL_ACCOUNTS,
  INITIAL_FILES,
  INITIAL_SALES_RECORDS,
} from './data/presets';
import { calculateHarvestTime } from './utils/time';
import {
  apiFetchUserData,
  apiSyncUserData,
  apiFirebaseGoogleLogin,
  UserServerData,
} from './utils/api';
import { auth, loginWithGoogle, logoutUser, onAuthStateChanged, User } from './lib/firebase';
import { Header } from './components/Header';
import { Sidebar, NavTab } from './components/Sidebar';
import { BottomNav } from './components/BottomNav';
import { WorldModal } from './components/WorldModal';
import { AccountModal } from './components/AccountModal';
import { FileUploadModal } from './components/FileUploadModal';
import { HarvestModal } from './components/HarvestModal';
import { QuickPlantModal } from './components/QuickPlantModal';
import { DashboardPage } from './pages/DashboardPage';
import { WorldsPage } from './pages/WorldsPage';
import { AccountsPage } from './pages/AccountsPage';
import { FilesPage } from './pages/FilesPage';
import { CalculatorPage } from './pages/CalculatorPage';
import { LoginPage } from './pages/LoginPage';

const STORAGE_KEYS = {
  WORLDS: 'gt_farm_worlds_v1',
  ACCOUNTS: 'gt_farm_accounts_v1',
  FILES: 'gt_farm_files_v1',
  SALES: 'gt_farm_sales_v1',
  SESSION: 'gt_farm_session_v1',
  SOUND: 'gt_farm_sound_v1',
};

export default function App() {
  // Session State
  const [session, setSession] = useState<UserSession>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.SESSION);
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return {
      isLoggedIn: true,
      username: 'NuzulFarmer',
      growId: 'NuzulFarmer',
      avatarSeed: 'nuzulfarmer',
    };
  });

  // Data States with LocalStorage Persistence
  const [worlds, setWorlds] = useState<World[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.WORLDS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed;
        }
      }
    } catch {
      // ignore
    }
    return INITIAL_WORLDS;
  });

  const [accounts, setAccounts] = useState<GrowAccount[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.ACCOUNTS);
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return INITIAL_ACCOUNTS;
  });

  const [files, setFiles] = useState<FarmFile[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.FILES);
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return INITIAL_FILES;
  });

  const [salesRecords, setSalesRecords] = useState<FarmSaleRecord[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.SALES);
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return INITIAL_SALES_RECORDS;
  });

  const [soundEnabled, setSoundEnabled] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.SOUND);
      if (saved !== null) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return true;
  });

  // Current active navigation tab
  const [currentTab, setCurrentTab] = useState<NavTab>('dashboard');
  const [worldStatusFilter, setWorldStatusFilter] = useState<string>('all');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((curr) => (curr === msg ? null : curr));
    }, 4500);
  }, []);

  // Realtime clock ticker (ticks every 1000ms for smooth live countdown)
  const [currentTimeMs, setCurrentTimeMs] = useState<number>(Date.now());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTimeMs(Date.now());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Sync to LocalStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.WORLDS, JSON.stringify(worlds));
    } catch {
      // ignore
    }
  }, [worlds]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.ACCOUNTS, JSON.stringify(accounts));
    } catch {
      // ignore
    }
  }, [accounts]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.FILES, JSON.stringify(files));
    } catch {
      // ignore
    }
  }, [files]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.SALES, JSON.stringify(salesRecords));
    } catch {
      // ignore
    }
  }, [salesRecords]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(session));
    } catch {
      // ignore
    }
  }, [session]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.SOUND, JSON.stringify(soundEnabled));
    } catch {
      // ignore
    }
  }, [soundEnabled]);

  // Cloud Sync & Multi-Device States
  const [syncStatus, setSyncStatus] = useState<'synced' | 'syncing' | 'offline'>('synced');
  const [serverUpdatedAt, setServerUpdatedAt] = useState<number>(0);
  const isInitialMount = useRef(true);
  const skipNextSync = useRef(false);

  // Listen to Firebase Auth state for automatic Google session restoration across devices & reloads
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: User | null) => {
      if (firebaseUser) {
        try {
          const token = await firebaseUser.getIdToken(false);
          const growId =
            firebaseUser.displayName ||
            firebaseUser.email?.split('@')[0] ||
            'GrowFarmer';

          // Fetch fresh Cloud SQL data for this Google account
          const res = await apiFetchUserData(growId, token, firebaseUser.uid);

          setSession((prev) => ({
            ...prev,
            isLoggedIn: true,
            username: growId,
            growId: prev.growId && prev.growId !== 'NuzulFarmer' ? prev.growId : growId,
            avatarSeed: firebaseUser.uid.slice(0, 8),
            email: firebaseUser.email || undefined,
            uid: firebaseUser.uid,
            authToken: token,
          }));

          if (res.success && res.data && res.data.worlds && res.data.worlds.length > 0) {
            skipNextSync.current = true;
            setWorlds(res.data.worlds);
            setAccounts(res.data.accounts);
            setFiles(res.data.files);
            if (res.data.salesRecords) setSalesRecords(res.data.salesRecords);
            setSoundEnabled(res.data.soundEnabled);
            setServerUpdatedAt(res.data.updatedAt);
          }
          setSyncStatus('synced');
        } catch (e) {
          console.warn('Failed restoring Google auth session:', e);
        }
      }
    });

    return () => unsubscribe();
  }, []);

  // 1. Debounced auto-sync to server whenever local state changes
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    if (skipNextSync.current) {
      skipNextSync.current = false;
      return;
    }
    if (!session.isLoggedIn || !session.username) return;

    setSyncStatus('syncing');
    const timer = setTimeout(async () => {
      const res = await apiSyncUserData(
        session.username,
        {
          worlds,
          accounts,
          files,
          salesRecords,
          soundEnabled,
        },
        session.authToken,
        session.uid
      );
      if (res.success && res.updatedAt) {
        setServerUpdatedAt(res.updatedAt);
        setSyncStatus('synced');
      } else {
        setSyncStatus('offline');
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [worlds, accounts, files, salesRecords, soundEnabled, session.isLoggedIn, session.username, session.authToken, session.uid]);

  // 2. Background polling from server so other devices' changes reflect immediately
  useEffect(() => {
    if (!session.isLoggedIn || !session.username) return;

    const fetchFromServer = async () => {
      const res = await apiFetchUserData(session.username, session.authToken, session.uid);
      if (res.success && res.data) {
        if (!serverUpdatedAt) {
          if (res.data.worlds && res.data.worlds.length > 0) {
            skipNextSync.current = true;
            setWorlds(res.data.worlds);
            setAccounts(res.data.accounts);
            setFiles(res.data.files);
            if (res.data.salesRecords) setSalesRecords(res.data.salesRecords);
            setSoundEnabled(res.data.soundEnabled);
          }
          setServerUpdatedAt(res.data.updatedAt || Date.now());
        } else if (res.data.updatedAt > serverUpdatedAt) {
          skipNextSync.current = true;
          setWorlds(res.data.worlds);
          setAccounts(res.data.accounts);
          setFiles(res.data.files);
          if (res.data.salesRecords) setSalesRecords(res.data.salesRecords);
          setSoundEnabled(res.data.soundEnabled);
          setServerUpdatedAt(res.data.updatedAt);
        }
        setSyncStatus('synced');
      }
    };

    fetchFromServer();

    // Poll tiap 20 detik
    const pollInterval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        fetchFromServer();
      }
    }, 20000);

    const onVisibilityOrFocus = () => {
      if (document.visibilityState === 'visible') {
        fetchFromServer();
      }
    };

    window.addEventListener('visibilitychange', onVisibilityOrFocus);
    window.addEventListener('focus', onVisibilityOrFocus);

    return () => {
      clearInterval(pollInterval);
      window.removeEventListener('visibilitychange', onVisibilityOrFocus);
      window.removeEventListener('focus', onVisibilityOrFocus);
    };
  }, [session.isLoggedIn, session.username, session.authToken, session.uid, serverUpdatedAt]);

  const handleManualSync = useCallback(async () => {
    if (!session.isLoggedIn || !session.username) return;
    setSyncStatus('syncing');
    const res = await apiFetchUserData(session.username, session.authToken, session.uid);
    if (res.success && res.data) {
      skipNextSync.current = true;
      setWorlds(res.data.worlds);
      setAccounts(res.data.accounts);
      setFiles(res.data.files);
      if (res.data.salesRecords) setSalesRecords(res.data.salesRecords);
      setSoundEnabled(res.data.soundEnabled);
      setServerUpdatedAt(res.data.updatedAt);
      setSyncStatus('synced');
      showToast('Data farm berhasil disinkronkan dengan Cloud SQL!');
    } else {
      setSyncStatus('offline');
      showToast('Sinkronisasi cloud offline. Coba beberapa saat lagi.');
    }
  }, [session.isLoggedIn, session.username, session.authToken, session.uid, showToast]);

  // Modal States
  const [isWorldModalOpen, setIsWorldModalOpen] = useState(false);
  const [worldToEdit, setWorldToEdit] = useState<World | null>(null);

  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [accountToEdit, setAccountToEdit] = useState<GrowAccount | null>(null);

  const [isFileModalOpen, setIsFileModalOpen] = useState(false);

  const [isHarvestModalOpen, setIsHarvestModalOpen] = useState(false);
  const [worldToHarvest, setWorldToHarvest] = useState<World | null>(null);

  const [isPlantModalOpen, setIsPlantModalOpen] = useState(false);
  const [worldToPlant, setWorldToPlant] = useState<World | null>(null);

  const [isChatOpen, setIsChatOpen] = useState(false);

  // Handlers for World
  const handleOpenAddWorld = () => {
    setWorldToEdit(null);
    setWorldStatusFilter('all');
    setIsWorldModalOpen(true);
  };

  const handleEditWorld = (world: World) => {
    setWorldToEdit(world);
    setIsWorldModalOpen(true);
  };

  const handleSaveWorld = (
    worldData: Omit<World, 'id' | 'harvestCount'> & { id?: string }
  ) => {
    const isEdit = Boolean(worldData.id);
    let updatedWorlds: World[];
    let worldName = worldData.name;

    if (isEdit) {
      updatedWorlds = worlds.map((w) =>
        w.id === worldData.id
          ? {
              ...w,
              ...worldData,
              id: worldData.id!,
            }
          : w
      );
    } else {
      const newWorld: World = {
        ...worldData,
        id: `world-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        harvestCount: 0,
      };
      worldName = newWorld.name;
      updatedWorlds = [newWorld, ...worlds];
    }

    // 1. Immediately update React state
    setWorlds(updatedWorlds);

    // 2. Persist to localStorage immediately
    try {
      localStorage.setItem(STORAGE_KEYS.WORLDS, JSON.stringify(updatedWorlds));
    } catch {
      // ignore
    }

    // 3. Reset status filter to 'all' so new world is always visible
    setWorldStatusFilter('all');

    // 4. Update sync timestamp and skip next effect debounced run
    const nowTimestamp = Date.now();
    setServerUpdatedAt(nowTimestamp);
    skipNextSync.current = true;

    // 5. Instantly push to backend
    if (session.isLoggedIn && session.username) {
      setSyncStatus('syncing');
      apiSyncUserData(
        session.username,
        {
          worlds: updatedWorlds,
          accounts,
          files,
          salesRecords,
          soundEnabled,
        },
        session.authToken,
        session.uid
      ).then((res) => {
        if (res.success && res.updatedAt) {
          setServerUpdatedAt(res.updatedAt);
          setSyncStatus('synced');
        } else {
          setSyncStatus('offline');
        }
      });
    }

    // 6. Show toast notification
    showToast(
      isEdit
        ? `World "${worldName}" berhasil diperbarui!`
        : `World "${worldName}" berhasil ditambahkan dan aktif dipantau!`
    );
  };

  const handleDeleteWorld = (worldId: string) => {
    const target = worlds.find((w) => w.id === worldId);
    const updated = worlds.filter((w) => w.id !== worldId);
    setWorlds(updated);
    try {
      localStorage.setItem(STORAGE_KEYS.WORLDS, JSON.stringify(updated));
    } catch {
      // ignore
    }
    const nowTimestamp = Date.now();
    setServerUpdatedAt(nowTimestamp);
    skipNextSync.current = true;
    if (session.isLoggedIn && session.username) {
      apiSyncUserData(
        session.username,
        {
          worlds: updated,
          accounts,
          files,
          salesRecords,
          soundEnabled,
        },
        session.authToken,
        session.uid
      ).then((res) => {
        if (res.success && res.updatedAt) {
          setServerUpdatedAt(res.updatedAt);
        }
      });
    }
    if (target) {
      showToast(`World "${target.name}" telah dihapus.`);
    }
  };

  // Quick Harvest & Replant action
  const handleTriggerHarvest = (world: World) => {
    setWorldToHarvest(world);
    setIsHarvestModalOpen(true);
  };

  const handleReplantWorld = (worldId: string) => {
    const target = worlds.find((w) => w.id === worldId);
    if (!target) return;

    const nowISO = new Date().toISOString();
    const newHarvestISO = calculateHarvestTime(
      nowISO,
      target.durationDays,
      target.durationHours,
      target.durationMinutes
    );

    setWorlds((prev) =>
      prev.map((w) =>
        w.id === worldId
          ? {
              ...w,
              plantedAt: nowISO,
              harvestAt: newHarvestISO,
              harvestCount: (w.harvestCount || 0) + 1,
              lastHarvestedAt: nowISO,
            }
          : w
      )
    );

    setIsHarvestModalOpen(false);
    setWorldToHarvest(null);
  };

  const handleMarkHarvestedOnly = (worldId: string) => {
    const nowISO = new Date().toISOString();
    setWorlds((prev) =>
      prev.map((w) =>
        w.id === worldId
          ? {
              ...w,
              isEmpty: true,
              plantedAt: '',
              harvestAt: '',
              harvestCount: (w.harvestCount || 0) + 1,
              lastHarvestedAt: nowISO,
            }
          : w
      )
    );
    setIsHarvestModalOpen(false);
    setWorldToHarvest(null);
  };

  const handlePlantWorld = (world: World) => {
    setWorldToPlant(world);
    setIsPlantModalOpen(true);
  };

  const handleConfirmPlant = (
    worldId: string,
    updatedCrop?: {
      cropType: string;
      treeCount: number;
      durationDays: number;
      durationHours: number;
      durationMinutes: number;
    }
  ) => {
    const nowISO = new Date().toISOString();
    setWorlds((prev) =>
      prev.map((w) => {
        if (w.id !== worldId) return w;
        const days = updatedCrop?.durationDays ?? w.durationDays;
        const hours = updatedCrop?.durationHours ?? w.durationHours;
        const mins = updatedCrop?.durationMinutes ?? w.durationMinutes;
        const harvestISO = calculateHarvestTime(nowISO, days, hours, mins);
        return {
          ...w,
          cropType: updatedCrop?.cropType ?? w.cropType,
          treeCount: updatedCrop?.treeCount ?? w.treeCount,
          durationDays: days,
          durationHours: hours,
          durationMinutes: mins,
          plantedAt: nowISO,
          harvestAt: harvestISO,
          isEmpty: false,
        };
      })
    );
  };

  // Handlers for Account
  const handleOpenAddAccount = () => {
    setAccountToEdit(null);
    setIsAccountModalOpen(true);
  };

  const handleEditAccount = (acc: GrowAccount) => {
    setAccountToEdit(acc);
    setIsAccountModalOpen(true);
  };

  const handleSaveAccount = (
    accountData: Omit<GrowAccount, 'id' | 'createdAt'> & { id?: string }
  ) => {
    if (accountData.id) {
      setAccounts((prev) =>
        prev.map((a) =>
          a.id === accountData.id
            ? {
                ...a,
                ...accountData,
                id: accountData.id!,
              }
            : a
        )
      );
    } else {
      const newAcc: GrowAccount = {
        ...accountData,
        id: `acc-${Date.now()}`,
        createdAt: new Date().toISOString(),
      };
      setAccounts((prev) => [...prev, newAcc]);
    }
  };

  const handleDeleteAccount = (accId: string) => {
    if (accounts.length <= 1) {
      showToast('Minimal harus ada 1 akun Growtopia yang tersimpan.');
      return;
    }
    const target = accounts.find((a) => a.id !== accId);
    const updated = accounts.filter((a) => a.id !== accId);
    setAccounts(updated);
    try {
      localStorage.setItem(STORAGE_KEYS.ACCOUNTS, JSON.stringify(updated));
    } catch {
      // ignore
    }
    const nowTimestamp = Date.now();
    setServerUpdatedAt(nowTimestamp);
    skipNextSync.current = true;
    if (session.isLoggedIn && session.username) {
      apiSyncUserData(
        session.username,
        {
          worlds,
          accounts: updated,
          files,
          salesRecords,
          soundEnabled,
        },
        session.authToken,
        session.uid
      ).then((res) => {
        if (res.success && res.updatedAt) {
          setServerUpdatedAt(res.updatedAt);
        }
      });
    }
    if (target) {
      showToast(`Akun "${target.growId}" berhasil dihapus.`);
    }
  };

  // Handlers for Files
  const handleUploadFile = (fileData: Omit<FarmFile, 'id' | 'uploadDate'>) => {
    const newFile: FarmFile = {
      ...fileData,
      id: `file-${Date.now()}`,
      uploadDate: new Date().toISOString(),
    };
    const updated = [newFile, ...files];
    setFiles(updated);
    try {
      localStorage.setItem(STORAGE_KEYS.FILES, JSON.stringify(updated));
    } catch {
      // ignore
    }
    showToast(`Berkas "${newFile.name}" berhasil diunggah.`);
  };

  const handleDeleteFile = (fileId: string) => {
    const target = files.find((f) => f.id === fileId);
    const updated = files.filter((f) => f.id !== fileId);
    setFiles(updated);
    try {
      localStorage.setItem(STORAGE_KEYS.FILES, JSON.stringify(updated));
    } catch {
      // ignore
    }
    const nowTimestamp = Date.now();
    setServerUpdatedAt(nowTimestamp);
    skipNextSync.current = true;
    if (session.isLoggedIn && session.username) {
      apiSyncUserData(
        session.username,
        {
          worlds,
          accounts,
          files: updated,
          salesRecords,
          soundEnabled,
        },
        session.authToken,
        session.uid
      ).then((res) => {
        if (res.success && res.updatedAt) {
          setServerUpdatedAt(res.updatedAt);
        }
      });
    }
    if (target) {
      showToast(`Berkas "${target.name}" telah dihapus.`);
    }
  };

  // Handlers for Sales Records
  const handleAddSaleRecord = (record: Omit<FarmSaleRecord, 'id' | 'createdAt'>) => {
    const newRecord: FarmSaleRecord = {
      ...record,
      id: `sale-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      createdAt: new Date().toISOString(),
    };
    const updated = [newRecord, ...salesRecords];
    setSalesRecords(updated);
    try {
      localStorage.setItem(STORAGE_KEYS.SALES, JSON.stringify(updated));
    } catch {
      // ignore
    }
    showToast(`Penjualan "${newRecord.title}" (+${newRecord.revenueWl} WL) berhasil dicatat.`);
  };

  const handleDeleteSaleRecord = (saleId: string) => {
    const target = salesRecords.find((s) => s.id === saleId);
    const updated = salesRecords.filter((s) => s.id !== saleId);
    setSalesRecords(updated);
    try {
      localStorage.setItem(STORAGE_KEYS.SALES, JSON.stringify(updated));
    } catch {
      // ignore
    }
    const nowTimestamp = Date.now();
    setServerUpdatedAt(nowTimestamp);
    skipNextSync.current = true;
    if (session.isLoggedIn && session.username) {
      apiSyncUserData(
        session.username,
        {
          worlds,
          accounts,
          files,
          salesRecords: updated,
          soundEnabled,
        },
        session.authToken,
        session.uid
      ).then((res) => {
        if (res.success && res.updatedAt) {
          setServerUpdatedAt(res.updatedAt);
        }
      });
    }
    if (target) {
      showToast(`Catatan penjualan "${target.title}" telah dihapus.`);
    }
  };

  // Auth Handlers
  const handleConnectGoogle = async () => {
    try {
      setSyncStatus('syncing');
      const user = await loginWithGoogle();
      const idToken = await user.getIdToken();
      const growId =
        user.displayName || user.email?.split('@')[0] || session.growId || 'GrowFarmer';

      // Migrate existing device worlds & data so user never loses anything
      const loginRes = await apiFirebaseGoogleLogin(idToken, growId, {
        worlds,
        accounts,
        files,
        salesRecords,
      });

      if (!loginRes.success || !loginRes.user) {
        throw new Error(loginRes.error || 'Gagal menyambungkan akun Google');
      }

      setSession(loginRes.user);

      if (loginRes.data) {
        skipNextSync.current = true;
        setWorlds(loginRes.data.worlds);
        setAccounts(loginRes.data.accounts);
        setFiles(loginRes.data.files);
        if (loginRes.data.salesRecords) setSalesRecords(loginRes.data.salesRecords);
        setSoundEnabled(loginRes.data.soundEnabled);
        setServerUpdatedAt(loginRes.data.updatedAt || Date.now());
      }

      setSyncStatus('synced');
      showToast(
        `Berhasil tersambung dengan Google (${user.email})! Data Anda sekarang otomatis tersinkron ke HP & Komputer lain.`
      );
    } catch (err: any) {
      console.error('handleConnectGoogle error:', err);
      showToast(`Gagal menyambungkan Google: ${err.message || 'Coba lagi'}`);
      setSyncStatus('synced');
    }
  };

  const handleLogin = (newSession: UserSession, serverData?: UserServerData) => {
    setSession(newSession);
    if (serverData) {
      skipNextSync.current = true;
      setWorlds(serverData.worlds);
      setAccounts(serverData.accounts);
      setFiles(serverData.files);
      if (serverData.salesRecords) setSalesRecords(serverData.salesRecords);
      setSoundEnabled(serverData.soundEnabled);
      setServerUpdatedAt(serverData.updatedAt || Date.now());
      setSyncStatus('synced');
    } else {
      setSyncStatus('syncing');
      apiFetchUserData(newSession.username, newSession.authToken, newSession.uid).then((res) => {
        if (res.success && res.data) {
          skipNextSync.current = true;
          setWorlds(res.data.worlds);
          setAccounts(res.data.accounts);
          setFiles(res.data.files);
          if (res.data.salesRecords) setSalesRecords(res.data.salesRecords);
          setSoundEnabled(res.data.soundEnabled);
          setServerUpdatedAt(res.data.updatedAt);
          setSyncStatus('synced');
        }
      });
    }
  };

  const handleLogout = async () => {
    try {
      await logoutUser();
    } catch (e) {
      // ignore
    }
    setSession({
      isLoggedIn: false,
      username: '',
      growId: '',
      avatarSeed: '',
    });
    try {
      localStorage.removeItem(STORAGE_KEYS.SESSION);
    } catch {
      // ignore
    }
  };

  // If not logged in, render game Login Page
  if (!session.isLoggedIn) {
    return <LoginPage onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen bg-[#070b14] text-slate-100 flex flex-col antialiased selection:bg-emerald-500 selection:text-white">
      <div className="flex flex-1 min-h-screen">
        {/* Desktop Sidebar Navigation */}
        <Sidebar
          currentTab={currentTab}
          onTabChange={(tab) => {
            setCurrentTab(tab);
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          onNavigateToWorlds={(statusFilter) => {
            if (statusFilter) setWorldStatusFilter(statusFilter);
            setCurrentTab('worlds');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          worlds={worlds}
          accounts={accounts}
          onOpenAddWorld={handleOpenAddWorld}
        />

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0 pb-20 lg:pb-8">
          {/* Top Header */}
          <Header
            worlds={worlds}
            userSession={session}
            soundEnabled={soundEnabled}
            syncStatus={syncStatus}
            currentTab={currentTab}
            onTabChange={(tab) => {
              setCurrentTab(tab);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onManualSync={handleManualSync}
            onConnectGoogle={handleConnectGoogle}
            onToggleSound={() => setSoundEnabled(!soundEnabled)}
            onOpenAddWorld={handleOpenAddWorld}
            onSelectWorld={(world) => {
              setWorldToEdit(world);
              setIsWorldModalOpen(true);
            }}
            onHarvestWorld={handleTriggerHarvest}
            onNavigateToWorlds={() => {
              setCurrentTab('worlds');
              setWorldStatusFilter('ready');
            }}
            onLogout={handleLogout}
          />

          {/* Page Routing */}
          <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
            {currentTab === 'dashboard' && (
              <DashboardPage
                worlds={worlds}
                accounts={accounts}
                salesRecords={salesRecords}
                currentTimeMs={currentTimeMs}
                onOpenAddWorld={handleOpenAddWorld}
                onSelectWorld={(world) => {
                  setWorldToEdit(world);
                  setIsWorldModalOpen(true);
                }}
                onHarvestWorld={handleTriggerHarvest}
                onPlantWorld={handlePlantWorld}
                onNavigateToWorlds={(statusFilter) => {
                  if (statusFilter) setWorldStatusFilter(statusFilter);
                  setCurrentTab('worlds');
                }}
                onNavigateToAccounts={() => setCurrentTab('accounts')}
                onNavigateToCalculator={() => setCurrentTab('calculator')}
              />
            )}

            {currentTab === 'worlds' && (
              <WorldsPage
                worlds={worlds}
                accounts={accounts}
                currentTimeMs={currentTimeMs}
                initialFilterStatus={worldStatusFilter}
                onOpenAddWorld={handleOpenAddWorld}
                onEditWorld={handleEditWorld}
                onDeleteWorld={handleDeleteWorld}
                onHarvestWorld={handleTriggerHarvest}
                onPlantWorld={handlePlantWorld}
              />
            )}

            {currentTab === 'calculator' && (
              <CalculatorPage
                salesRecords={salesRecords}
                onAddSaleRecord={handleAddSaleRecord}
                onDeleteSaleRecord={handleDeleteSaleRecord}
                worlds={worlds}
                accounts={accounts}
                onApplyToNewWorld={(cropData) => {
                  const nowISO = new Date().toISOString();
                  const harvestISO = calculateHarvestTime(
                    nowISO,
                    cropData.days,
                    cropData.hours,
                    cropData.minutes
                  );
                  const newWorldObj: World = {
                    id: '',
                    name: `${cropData.cropType.replace(/\s+/g, '').toUpperCase()}_FARM`,
                    cropType: cropData.cropType,
                    treeCount: cropData.treeCount,
                    plantedAt: nowISO,
                    durationDays: cropData.days,
                    durationHours: cropData.hours,
                    durationMinutes: cropData.minutes,
                    harvestAt: harvestISO,
                    accountId: accounts[0]?.id || 'acc-1',
                    notes: 'Dibuat otomatis dari Kalkulator Farm',
                    harvestCount: 0,
                  };
                  setWorldToEdit(newWorldObj);
                  setIsWorldModalOpen(true);
                }}
              />
            )}

            {currentTab === 'accounts' && (
              <AccountsPage
                accounts={accounts}
                worlds={worlds}
                onOpenAddAccount={handleOpenAddAccount}
                onEditAccount={handleEditAccount}
                onDeleteAccount={handleDeleteAccount}
                onViewWorldsForAccount={(accId) => {
                  setCurrentTab('worlds');
                  setWorldStatusFilter('all');
                }}
              />
            )}

            {currentTab === 'files' && (
              <FilesPage
                files={files}
                worlds={worlds}
                accounts={accounts}
                salesRecords={salesRecords}
                onOpenUploadModal={() => setIsFileModalOpen(true)}
                onDirectUpload={handleUploadFile}
                onDeleteFile={handleDeleteFile}
              />
            )}
          </main>
        </div>
      </div>

      {/* Mobile Bottom Tab Navigation */}
      <BottomNav
        currentTab={currentTab}
        onTabChange={(tab) => {
          setCurrentTab(tab);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        worlds={worlds}
      />

      {/* Modals */}
      <WorldModal
        isOpen={isWorldModalOpen}
        worldToEdit={worldToEdit}
        accounts={accounts}
        onClose={() => {
          setIsWorldModalOpen(false);
          setWorldToEdit(null);
        }}
        onSave={handleSaveWorld}
        onHarvestAndReplant={(worldId) => handleReplantWorld(worldId)}
        onDelete={handleDeleteWorld}
      />

      <AccountModal
        isOpen={isAccountModalOpen}
        accountToEdit={accountToEdit}
        onClose={() => {
          setIsAccountModalOpen(false);
          setAccountToEdit(null);
        }}
        onSave={handleSaveAccount}
      />

      <FileUploadModal
        isOpen={isFileModalOpen}
        onClose={() => setIsFileModalOpen(false)}
        onUpload={handleUploadFile}
      />

      <HarvestModal
        world={worldToHarvest}
        isOpen={isHarvestModalOpen}
        soundEnabled={soundEnabled}
        onClose={() => {
          setIsHarvestModalOpen(false);
          setWorldToHarvest(null);
        }}
        onReplant={(worldId) => handleReplantWorld(worldId)}
        onMarkHarvestedOnly={(worldId) => handleMarkHarvestedOnly(worldId)}
      />

      <QuickPlantModal
        world={worldToPlant}
        isOpen={isPlantModalOpen}
        soundEnabled={soundEnabled}
        onClose={() => {
          setIsPlantModalOpen(false);
          setWorldToPlant(null);
        }}
        onConfirmPlant={handleConfirmPlant}
      />

      {/* Instant Feedback Toast Notification */}
      {toastMessage && (
        <aside
          aria-live="polite"
          className="fixed top-20 right-4 sm:right-6 z-[70] max-w-sm w-full animate-in slide-in-from-top-3 fade-in duration-200 pointer-events-auto"
        >
          <div className="p-4 rounded-2xl bg-[#0f1d33] border border-emerald-500/70 shadow-2xl shadow-black/80 flex items-center justify-between gap-3 text-slate-100 ring-1 ring-emerald-500/30">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center shrink-0 text-emerald-400 font-bold text-lg">
                🌱
              </div>
              <p className="text-xs font-bold text-slate-100 leading-snug">{toastMessage}</p>
            </div>
            <button
              onClick={() => setToastMessage(null)}
              className="text-slate-400 hover:text-slate-200 p-1 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer text-xs font-bold"
              title="Tutup Notifikasi"
            >
              ✕
            </button>
          </div>
        </aside>
      )}
    </div>
  );
}
