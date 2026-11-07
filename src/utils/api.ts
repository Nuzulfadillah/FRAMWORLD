import { World, GrowAccount, FarmFile, UserSession, FarmSaleRecord } from '../types';
import { auth, db, doc, getDoc, setDoc } from '../lib/firebase';

export interface UserServerData {
  worlds: World[];
  accounts: GrowAccount[];
  files: FarmFile[];
  salesRecords?: FarmSaleRecord[];
  soundEnabled: boolean;
  updatedAt: number;
}

export interface LoginResult {
  success: boolean;
  error?: string;
  user?: UserSession;
  data?: UserServerData;
}

/**
 * Get valid authentication headers (auto-refreshes Firebase token if expired)
 */
export async function getAuthHeaders(
  explicitToken?: string,
  explicitUid?: string
): Promise<Record<string, string>> {
  const headers: Record<string, string> = {};

  let token = explicitToken;
  let uid = explicitUid;
  let email = '';

  if (auth.currentUser) {
    try {
      token = await auth.currentUser.getIdToken(false);
      uid = auth.currentUser.uid;
      email = auth.currentUser.email || '';
    } catch (e) {
      // ignore
    }
  }

  if (token && token !== 'undefined') {
    headers['Authorization'] = `Bearer ${token}`;
  }
  if (uid && uid !== 'undefined') {
    headers['x-user-uid'] = uid;
  }
  if (email) {
    headers['x-user-email'] = email;
  }

  return headers;
}

const FILES_KEY = 'gt_farm_files_v1';

/** File besar (dataUrl) hanya disimpan di perangkat; ke cloud hanya metadata. */
function stripFileContents(files: FarmFile[] = []): FarmFile[] {
  return files.map((f) => {
    const { dataUrl, ...rest } = f;
    return rest as FarmFile;
  });
}

/** Saat menarik data dari cloud, pertahankan isi file yang sudah ada di perangkat ini. */
function restoreLocalFileContents(files: FarmFile[] = []): FarmFile[] {
  try {
    const raw = localStorage.getItem(FILES_KEY);
    const local: FarmFile[] = raw ? JSON.parse(raw) : [];
    const map = new Map(local.map((f) => [f.id, f.dataUrl]));
    return files.map((f) => (map.get(f.id) ? { ...f, dataUrl: map.get(f.id) } : f));
  } catch {
    return files;
  }
}

async function readCloud(uid: string): Promise<UserServerData | null> {
  const snap = await getDoc(doc(db, 'users', uid));
  if (!snap.exists()) return null;
  const raw = snap.data() as { data?: string; updatedAt?: number };
  if (!raw.data) return null;
  const d = JSON.parse(raw.data);
  return {
    worlds: d.worlds || [],
    accounts: d.accounts || [],
    files: restoreLocalFileContents(d.files || []),
    salesRecords: d.salesRecords || [],
    soundEnabled: d.soundEnabled !== false,
    updatedAt: raw.updatedAt || 0,
  };
}

async function writeCloud(
  uid: string,
  payload: {
    worlds: World[];
    accounts: GrowAccount[];
    files: FarmFile[];
    salesRecords?: FarmSaleRecord[];
    soundEnabled: boolean;
  }
): Promise<number> {
  const updatedAt = Date.now();
  await setDoc(doc(db, 'users', uid), {
    updatedAt,
    data: JSON.stringify({
      worlds: payload.worlds,
      accounts: payload.accounts,
      files: stripFileContents(payload.files),
      salesRecords: payload.salesRecords || [],
      soundEnabled: payload.soundEnabled,
    }),
  });
  return updatedAt;
}

/** Login lokal (tanpa cloud): data tersimpan di browser ini saja. */
export async function apiLogin(
  username: string,
  _password?: string,
  _isQuickDemo: boolean = false
): Promise<LoginResult> {
  const name = (username || 'NuzulFarmer').trim();
  return {
    success: true,
    user: { isLoggedIn: true, username: name, growId: name, avatarSeed: name.toLowerCase() },
  };
}

/** Setelah login Google: ambil data cloud, atau unggah data perangkat ini kalau akun masih baru. */
export async function apiFirebaseGoogleLogin(
  idToken: string,
  growId?: string,
  localData?: {
    worlds?: World[];
    accounts?: GrowAccount[];
    files?: FarmFile[];
    salesRecords?: FarmSaleRecord[];
  }
): Promise<LoginResult> {
  try {
    const u = auth.currentUser;
    if (!u) return { success: false, error: 'Belum login Google' };
    const name = growId || u.displayName || u.email?.split('@')[0] || 'GrowFarmer';

    let data = await readCloud(u.uid);
    if (!data || (data.worlds.length === 0 && data.accounts.length === 0)) {
      const payload = {
        worlds: localData?.worlds || [],
        accounts: localData?.accounts || [],
        files: localData?.files || [],
        salesRecords: localData?.salesRecords || [],
        soundEnabled: true,
      };
      const updatedAt = await writeCloud(u.uid, payload);
      data = { ...payload, updatedAt };
    }

    return {
      success: true,
      user: {
        isLoggedIn: true,
        username: name,
        growId: name,
        avatarSeed: u.uid.slice(0, 8),
        email: u.email || undefined,
        uid: u.uid,
        authToken: idToken,
      },
      data,
    };
  } catch (err: any) {
    console.error('Cloud login error:', err);
    return { success: false, error: err?.message || 'Gagal terhubung ke Firestore' };
  }
}

/** Ambil data terbaru dari cloud (untuk sinkron antar perangkat). */
export async function apiFetchUserData(
  _username: string,
  _authToken?: string,
  userUid?: string
): Promise<{ success: boolean; data?: UserServerData; error?: string }> {
  const uid = auth.currentUser?.uid || userUid;
  if (!auth.currentUser || !uid) return { success: false, error: 'Mode lokal' };
  try {
    const data = await readCloud(uid);
    return data ? { success: true, data } : { success: false, error: 'Belum ada data' };
  } catch (err) {
    return { success: false, error: 'Offline' };
  }
}

/** Kirim perubahan ke cloud. Tanpa login Google, data hanya disimpan lokal. */
export async function apiSyncUserData(
  _username: string,
  payload: {
    worlds: World[];
    accounts: GrowAccount[];
    files: FarmFile[];
    salesRecords?: FarmSaleRecord[];
    soundEnabled: boolean;
    clientUpdatedAt?: number;
  },
  _authToken?: string,
  _userUid?: string
): Promise<{ success: boolean; updatedAt?: number }> {
  const u = auth.currentUser;
  if (!u) return { success: true, updatedAt: Date.now() };
  try {
    const updatedAt = await writeCloud(u.uid, payload);
    return { success: true, updatedAt };
  } catch (err) {
    console.warn('Gagal sinkron ke cloud:', err);
    return { success: false };
  }
}
