import { World, GrowAccount, FarmFile, UserSession, FarmSaleRecord } from '../types';
import { auth } from '../lib/firebase';

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

/**
 * Login or automatically create account on server
 */
export async function apiLogin(
  username: string,
  password?: string,
  isQuickDemo: boolean = false
): Promise<LoginResult> {
  // Versi GitHub Pages: login lokal tanpa server (data tersimpan di browser)
  const name = (username || 'NuzulFarmer').trim();
  return {
    success: true,
    user: { isLoggedIn: true, username: name, growId: name, avatarSeed: name.toLowerCase() },
  };
  try {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password, isQuickDemo }),
    });

    const json = await res.json();
    if (!res.ok) {
      return {
        success: false,
        error: json.error || 'Gagal masuk ke server farm',
      };
    }

    return {
      success: true,
      user: {
        isLoggedIn: true,
        username: json.user.username,
        growId: json.user.growId,
        avatarSeed: json.user.avatarSeed,
      },
      data: json.data,
    };
  } catch (err) {
    console.warn('API login network error, fallback to offline:', err);
    return {
      success: false,
      error: 'Tidak dapat terhubung ke server cloud. Periksa jaringan Anda.',
    };
  }
}

/**
 * Google Sign-in to server with data migration from device to Google account
 */
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
  return { success: false, error: 'Login Google tidak tersedia di versi GitHub Pages' };
  try {
    const res = await fetch('/api/auth/firebase-login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        idToken,
        growId,
        localWorlds: localData?.worlds,
        localAccounts: localData?.accounts,
        localFiles: localData?.files,
        localSales: localData?.salesRecords,
      }),
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      return {
        success: false,
        error: data.error || 'Verifikasi akun Google gagal di server.',
      };
    }

    return {
      success: true,
      user: {
        isLoggedIn: true,
        username: data.user.username,
        growId: data.user.growId,
        avatarSeed: data.user.avatarSeed,
        email: data.user.email,
        uid: data.user.uid,
        authToken: idToken,
      },
      data: data.data,
    };
  } catch (err: any) {
    console.error('apiFirebaseGoogleLogin error:', err);
    return {
      success: false,
      error: err.message || 'Gagal menyambungkan akun Google ke server cloud.',
    };
  }
}

/**
 * Fetch latest user data from server (used for multi-device sync polling)
 */
export async function apiFetchUserData(
  username: string,
  authToken?: string,
  userUid?: string
): Promise<{ success: boolean; data?: UserServerData; error?: string }> {
  return { success: false, error: 'Mode statis (tanpa server)' };
  try {
    const authHeaders = await getAuthHeaders(authToken, userUid);
    const headers: Record<string, string> = {
      'Cache-Control': 'no-cache',
      ...authHeaders,
    };

    const uidParam = authHeaders['x-user-uid'] ? `&uid=${encodeURIComponent(authHeaders['x-user-uid'])}` : '';
    const res = await fetch(
      `/api/user/data?username=${encodeURIComponent(username)}${uidParam}&t=${Date.now()}`,
      { headers }
    );

    if (!res.ok) {
      const errJson = await res.json().catch(() => ({}));
      return { success: false, error: errJson.error || 'Server error' };
    }

    const json = await res.json();
    return {
      success: true,
      data: {
        worlds: json.worlds,
        accounts: json.accounts,
        files: json.files,
        salesRecords: json.salesRecords || [],
        soundEnabled: json.soundEnabled,
        updatedAt: json.updatedAt,
      },
    };
  } catch (err) {
    return { success: false, error: 'Offline' };
  }
}

/**
 * Push local state changes to server so other devices see them immediately
 */
export async function apiSyncUserData(
  username: string,
  payload: {
    worlds: World[];
    accounts: GrowAccount[];
    files: FarmFile[];
    salesRecords?: FarmSaleRecord[];
    soundEnabled: boolean;
    clientUpdatedAt?: number;
  },
  authToken?: string,
  userUid?: string
): Promise<{ success: boolean; updatedAt?: number }> {
  return { success: true, updatedAt: Date.now() };
  try {
    const authHeaders = await getAuthHeaders(authToken, userUid);
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...authHeaders,
    };

    const res = await fetch('/api/user/sync', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        username,
        uid: authHeaders['x-user-uid'] || userUid,
        ...payload,
      }),
    });

    if (!res.ok) return { success: false };
    const json = await res.json();
    return { success: true, updatedAt: json.updatedAt };
  } catch (err) {
    console.warn('Failed to sync to server (offline):', err);
    return { success: false };
  }
}
