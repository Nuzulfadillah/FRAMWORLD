import React, { useState } from 'react';
import { UserSession } from '../types';
import {
  Lock,
  User,
  Sparkles,
  Zap,
  ShieldCheck,
  Trees,
  Gem,
  ArrowRight,
  Clock,
  CheckCircle,
} from 'lucide-react';

import { apiLogin, apiFirebaseGoogleLogin, UserServerData } from '../utils/api';
import { loginWithGoogle } from '../lib/firebase';

interface LoginPageProps {
  onLogin: (session: UserSession, serverData?: UserServerData) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLogin }) => {
  const [username, setUsername] = useState('NuzulFarmer');
  const [password, setPassword] = useState('123456');
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleGoogleLogin = async () => {
    setErrorMsg('');
    setLoading(true);

    try {
      const user = await loginWithGoogle();
      const idToken = await user.getIdToken();

      // Read current device worlds/accounts/sales if any exist to migrate to Google account
      let localData: {
        worlds?: any[];
        accounts?: any[];
        files?: any[];
        salesRecords?: any[];
      } = {};

      try {
        const savedWorlds = localStorage.getItem('gt_farm_worlds_v1');
        if (savedWorlds) localData.worlds = JSON.parse(savedWorlds);
        const savedAccounts = localStorage.getItem('gt_farm_accounts_v1');
        if (savedAccounts) localData.accounts = JSON.parse(savedAccounts);
        const savedFiles = localStorage.getItem('gt_farm_files_v1');
        if (savedFiles) localData.files = JSON.parse(savedFiles);
        const savedSales = localStorage.getItem('gt_farm_sales_v1');
        if (savedSales) localData.salesRecords = JSON.parse(savedSales);
      } catch (e) {
        // ignore
      }

      const growId = user.displayName || user.email?.split('@')[0] || 'GrowFarmer';
      const loginRes = await apiFirebaseGoogleLogin(idToken, growId, localData);

      if (!loginRes.success || !loginRes.user) {
        throw new Error(loginRes.error || 'Autentikasi Firebase gagal');
      }

      onLogin(loginRes.user, loginRes.data);
    } catch (err: any) {
      console.error('Google Sign-In failed:', err);
      setErrorMsg(err.message || 'Gagal masuk dengan akun Google.');
    } finally {
      setLoading(false);
    }
  };

  const handleCustomLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    const res = await apiLogin(username.trim() || 'NuzulFarmer', password, false);
    setLoading(false);

    if (!res.success || !res.user) {
      setErrorMsg(res.error || 'Gagal masuk. Periksa kembali GrowID dan Sandi.');
      return;
    }

    onLogin(res.user, res.data);
  };

  const handleQuickDemoLogin = async (growId: string = 'NuzulFarmer') => {
    setErrorMsg('');
    setLoading(true);

    const res = await apiLogin(growId, '', true);
    setLoading(false);

    if (!res.success || !res.user) {
      setErrorMsg(res.error || 'Gagal masuk.');
      return;
    }

    onLogin(res.user, res.data);
  };

  return (
    <div className="min-h-screen bg-[#070b14] text-slate-100 flex flex-col justify-between relative overflow-hidden">
      {/* Background Glow Orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-600/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-amber-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-10 right-10 w-64 h-64 bg-cyan-500/10 rounded-full blur-[100px] pointer-events-none" />

      {/* Top Navbar */}
      <header className="px-6 py-5 flex items-center justify-between max-w-6xl mx-auto w-full z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-500 via-emerald-600 to-teal-700 p-0.5 shadow-lg shadow-emerald-500/20">
            <div className="w-full h-full bg-[#080d1a] rounded-[14px] flex items-center justify-center text-xl">
              🌱
            </div>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-pixel text-[10px] text-amber-400">GROWTOPIA</span>
              <span className="text-[10px] px-1.5 py-0.2 bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 rounded font-bold">
                FARM
              </span>
            </div>
            <span className="font-bold text-xs text-slate-100 font-game tracking-wider uppercase">
              Manager
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 hidden sm:inline">
            Status Sistem:
          </span>
          <span className="inline-flex items-center gap-1.5 text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-3 py-1 rounded-full font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            Online & Siap Pakai
          </span>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 flex items-center justify-center px-4 py-8 z-10">
        <div className="max-w-4xl w-full grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Left Column: Game Brand & Highlights */}
          <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#101b33] border border-amber-500/30 text-amber-300 text-xs font-bold tracking-wider uppercase">
              <Gem className="w-3.5 h-3.5 text-amber-400" />
              <span>Personal Farm Tracker & Scheduler</span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-50 font-game tracking-wider leading-tight">
              PANTAU WORLD FARMING <br className="hidden sm:inline" />
              <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-amber-300 bg-clip-text text-transparent">
                TIDAK PERNAH TERLAMBAT
              </span>
            </h1>

            <p className="text-sm sm:text-base text-slate-400 max-w-xl mx-auto lg:mx-0 leading-relaxed">
              Catat rotasi Laser Grid, Pepper Tree, dan Chandelier Anda. Dapatkan hitung mundur detik, notifikasi siap panen, dan simpan dokumen strategi farming dalam satu tempat.
            </p>

            {/* Feature Pills */}
            <div className="grid grid-cols-2 gap-3 pt-2 max-w-md mx-auto lg:mx-0 text-left">
              <div className="p-3 rounded-2xl bg-[#0f172a]/80 border border-slate-800 flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-emerald-500/15 text-emerald-400">
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-200 block">Countdown Presisi</span>
                  <span className="text-[10px] text-slate-500">Preset jam panen GT</span>
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-[#0f172a]/80 border border-slate-800 flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-amber-500/15 text-amber-400">
                  <Trees className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-200 block">Multi World & Akun</span>
                  <span className="text-[10px] text-slate-500">Kelompokkan GrowID</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Game Login Card */}
          <div className="lg:col-span-5 w-full">
            <div className="bg-[#0e1628] border-2 border-slate-700/80 rounded-3xl p-6 sm:p-7 shadow-2xl shadow-black/80 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />

              <div className="text-center mb-6">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 p-0.5 mx-auto mb-3 shadow-lg shadow-emerald-500/20">
                  <div className="w-full h-full bg-[#090f1f] rounded-[14px] flex items-center justify-center text-emerald-400">
                    <Lock className="w-6 h-6" />
                  </div>
                </div>
                <h2 className="text-xl font-black text-slate-100 font-game tracking-wider uppercase">
                  MASUK PETANI
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Akses dashboard farming Growtopia Anda
                </p>
              </div>

              {/* Google Sign-in with Firebase Auth & Demo button */}
              <div className="mb-4 space-y-2.5">
                <button
                  type="button"
                  onClick={handleGoogleLogin}
                  disabled={loading}
                  className="w-full py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-100 font-bold text-xs sm:text-sm border border-slate-700/80 shadow-md active:scale-95 transition-all flex items-center justify-center gap-2.5 cursor-pointer"
                >
                  <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
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
                  <span>Masuk dengan Google (Firebase Auth)</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleQuickDemoLogin('NuzulFarmer')}
                  disabled={loading}
                  className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-300 hover:from-amber-400 hover:to-yellow-200 text-slate-950 font-black text-xs shadow-md shadow-amber-500/20 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Zap className="w-4 h-4" />
                  <span>⚡ Masuk Cepat Demo (NuzulFarmer)</span>
                </button>
                <div className="relative my-3">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-slate-800" />
                  </div>
                  <div className="relative flex justify-center text-center">
                    <span className="px-3 bg-[#0e1628] text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                      atau masuk akun GrowID
                    </span>
                  </div>
                </div>
              </div>

              {/* Error Alert */}
              {errorMsg && (
                <div className="mb-4 p-3 rounded-xl bg-red-500/15 border border-red-500/40 text-red-300 text-xs flex items-center gap-2">
                  <span className="text-base">⚠️</span>
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Form Login */}
              <form onSubmit={handleCustomLogin} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-emerald-400" />
                    GrowID / Nama Pengguna
                  </label>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Contoh: NuzulFarmer"
                    className="w-full px-4 py-2.5 rounded-xl bg-[#142038] border border-slate-700 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 text-slate-100 text-sm font-semibold transition-all"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-amber-400" />
                    PIN / Sandi Akun
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Sandi akun multi-device..."
                    className="w-full px-4 py-2.5 rounded-xl bg-[#142038] border border-slate-700 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 text-slate-100 text-sm font-semibold transition-all"
                    required
                  />
                </div>

                <div className="flex items-center justify-between text-xs pt-1">
                  <label className="flex items-center gap-2 cursor-pointer text-slate-400 hover:text-slate-200">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="rounded border-slate-700 bg-slate-900 text-emerald-500 focus:ring-emerald-500 w-3.5 h-3.5"
                    />
                    <span>Ingat sesi saya</span>
                  </label>
                  <span className="text-[11px] text-emerald-400 flex items-center gap-1 font-medium">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Sinkron Antar Device
                  </span>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-500 via-emerald-400 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-black text-xs sm:text-sm shadow-lg shadow-emerald-500/25 active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer mt-2"
                >
                  <span>{loading ? 'Menyinkronkan Akun...' : 'Masuk ke Farm Manager'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>

              {/* Safety guarantee */}
              <div className="mt-5 pt-4 border-t border-slate-800/80 flex items-center justify-center gap-2 text-[11px] text-slate-400 text-center">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Akun & world Anda otomatis tersinkron di HP & Komputer</span>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="px-6 py-4 border-t border-slate-800/60 max-w-6xl mx-auto w-full flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-2 z-10">
        <div>
          Growtopia Farm Manager © 2026 • Dibuat khusus untuk komunitas farmer Growtopia
        </div>
        <div className="flex items-center gap-4 text-[11px]">
          <span>Tema Gelap Navy & Emas</span>
          <span>•</span>
          <span>Hitung Mundur Realtime</span>
        </div>
      </footer>
    </div>
  );
};
