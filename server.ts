import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { INITIAL_WORLDS, INITIAL_ACCOUNTS, INITIAL_FILES, INITIAL_SALES_RECORDS } from './src/data/presets.ts';
import { World, GrowAccount, FarmFile, FarmSaleRecord } from './src/types.ts';
import { adminAuth } from './src/lib/firebase-admin.ts';
import { ai, GROWTOPIA_SYSTEM_INSTRUCTION } from './src/lib/gemini.ts';
import { answerGrowtopiaQuestion } from './src/lib/growtopia-advisor.ts';
import {
  getOrCreateUser,
  getUserWorlds,
  saveUserWorlds,
  getUserAccounts,
  saveUserAccounts,
  getUserFiles,
  saveUserFiles,
  getUserSales,
  saveUserSales,
  getChatMessages,
  addChatMessage,
  clearChatHistory,
  getUserLastUpdated,
  touchUserLastUpdated,
} from './src/db/helpers.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

// High limit for base64 file sync
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Helper to extract UID from Authorization header or custom headers
async function extractUserIdentifier(req: Request): Promise<{ uid: string | null; email?: string | null }> {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split('Bearer ')[1];
    if (token && token !== 'undefined' && token !== 'null') {
      try {
        const decoded = await adminAuth.verifyIdToken(token);
        return { uid: decoded.uid, email: decoded.email };
      } catch (err: any) {
        // Token might be transiently expired or verifying
      }
    }
  }

  const headerUid = req.headers['x-user-uid'] as string;
  if (headerUid && typeof headerUid === 'string' && headerUid.trim() && headerUid !== 'undefined') {
    return { uid: headerUid.trim(), email: (req.headers['x-user-email'] as string) || null };
  }

  const queryUid = (req.query.uid as string) || (req.body?.uid as string);
  if (queryUid && typeof queryUid === 'string' && queryUid.trim() && queryUid !== 'undefined') {
    return { uid: queryUid.trim(), email: (req.query.email as string) || null };
  }

  return { uid: null };
}

// Local fallback DB for unauthenticated/demo mode
const DATA_DIR = path.join(__dirname, 'data');
const DB_FILE = path.join(DATA_DIR, 'farm_database.json');

function loadLocalFallbackDb(): Record<string, any> {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (fs.existsSync(DB_FILE)) {
      const raw = fs.readFileSync(DB_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed.users === 'object') return parsed.users;
    }
  } catch (err) {
    console.error('Local fallback read error:', err);
  }
  return {};
}

function saveLocalFallbackDb(usersObj: Record<string, any>) {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(DB_FILE, JSON.stringify({ users: usersObj }, null, 2), 'utf-8');
  } catch (err) {
    console.error('Local fallback save error:', err);
  }
}

// API ROUTES
// 1. Health check
app.get('/api/health', async (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    timestamp: Date.now(),
    database: 'Cloud SQL (PostgreSQL)',
    auth: 'Firebase Auth',
    ai: 'Gemini 3.8 Flash (Search Grounding)',
  });
});

// 2. Firebase Google Sign-in Endpoint with Auto-Migration of Local Data
app.post('/api/auth/firebase-login', async (req: Request, res: Response) => {
  try {
    const { idToken, growId, localWorlds, localAccounts, localFiles, localSales } = req.body;
    if (!idToken) {
      return res.status(400).json({ error: 'ID Token wajib disertakan' });
    }

    const decoded = await adminAuth.verifyIdToken(idToken);
    const uid = decoded.uid;
    const email = decoded.email || `${uid}@growtopia.farm`;
    const userGrowId = growId || decoded.name || email.split('@')[0] || 'GrowFarmer';

    // Register or get user in Cloud SQL PostgreSQL
    await getOrCreateUser(uid, email, userGrowId);

    // Fetch existing PostgreSQL data
    let userWorlds = await getUserWorlds(uid);
    let userAccounts = await getUserAccounts(uid);
    let userFiles = await getUserFiles(uid);
    let userSales = await getUserSales(uid);

    // If new user with no data in Cloud SQL, populate with migrated local data or starter kit
    if (userWorlds.length === 0 && userAccounts.length === 0) {
      if (Array.isArray(localWorlds) && localWorlds.length > 0) {
        userWorlds = localWorlds;
        userAccounts = Array.isArray(localAccounts) && localAccounts.length > 0
          ? localAccounts
          : [
              {
                id: `acc-${Date.now()}`,
                growId: userGrowId,
                label: 'Akun Utama (Google)',
                notes: `Akun Google: ${email}`,
                level: 1,
                createdAt: new Date().toISOString(),
              },
              ...INITIAL_ACCOUNTS.slice(1),
            ];
        userFiles = Array.isArray(localFiles) ? localFiles : INITIAL_FILES;
        userSales = Array.isArray(localSales) ? localSales : INITIAL_SALES_RECORDS;
      } else {
        // Check if demo-nuzulfarmer has existing data in SQL to migrate
        const demoWorlds = await getUserWorlds('demo-nuzulfarmer');
        if (demoWorlds.length > 0) {
          userWorlds = demoWorlds;
          userAccounts = await getUserAccounts('demo-nuzulfarmer');
          userFiles = await getUserFiles('demo-nuzulfarmer');
          userSales = await getUserSales('demo-nuzulfarmer');
        } else {
          userWorlds = INITIAL_WORLDS;
          userAccounts = [
            {
              id: `acc-${Date.now()}`,
              growId: userGrowId,
              label: 'Akun Utama (Google)',
              notes: `Akun Google: ${email}`,
              level: 1,
              createdAt: new Date().toISOString(),
            },
            ...INITIAL_ACCOUNTS.slice(1),
          ];
          userFiles = INITIAL_FILES;
          userSales = INITIAL_SALES_RECORDS;
        }
      }

      await saveUserWorlds(uid, userWorlds);
      await saveUserAccounts(uid, userAccounts);
      await saveUserFiles(uid, userFiles);
      await saveUserSales(uid, userSales);
      await touchUserLastUpdated(uid);
    }

    const lastUpdated = (await getUserLastUpdated(uid)) || Date.now();

    return res.json({
      success: true,
      user: {
        uid,
        email,
        username: userGrowId,
        growId: userGrowId,
        avatarSeed: uid.slice(0, 8),
      },
      data: {
        worlds: userWorlds,
        accounts: userAccounts,
        files: userFiles,
        salesRecords: userSales,
        soundEnabled: true,
        updatedAt: lastUpdated,
      },
    });
  } catch (error: any) {
    console.error('Firebase login error:', error);
    return res.status(401).json({ error: error.message || 'Verifikasi Firebase gagal' });
  }
});

// 3. Traditional / Demo Login (with Cloud SQL + Local Fallback)
app.post('/api/auth/login', async (req: Request, res: Response) => {
  const { username, password } = req.body;
  if (!username || typeof username !== 'string') {
    return res.status(400).json({ error: 'Username atau GrowID wajib diisi' });
  }

  const cleanName = username.trim();
  const userKey = cleanName.toLowerCase();

  try {
    // Try Cloud SQL with pseudo-UID for demo user
    const pseudoUid = `demo-${userKey}`;
    await getOrCreateUser(pseudoUid, `${userKey}@demo.farm`, cleanName);

    let userWorlds = await getUserWorlds(pseudoUid);
    let userAccounts = await getUserAccounts(pseudoUid);
    let userFiles = await getUserFiles(pseudoUid);
    let userSales = await getUserSales(pseudoUid);

    if (userWorlds.length === 0) {
      userWorlds = userKey === 'nuzulfarmer' ? INITIAL_WORLDS : [];
      userAccounts =
        userKey === 'nuzulfarmer'
          ? INITIAL_ACCOUNTS
          : [
              {
                id: `acc-${Date.now()}`,
                growId: cleanName,
                label: 'Akun Utama',
                notes: 'Akun Growtopia',
                level: 1,
                createdAt: new Date().toISOString(),
              },
            ];
      userFiles = userKey === 'nuzulfarmer' ? INITIAL_FILES : [];
      userSales = userKey === 'nuzulfarmer' ? INITIAL_SALES_RECORDS : [];

      await saveUserWorlds(pseudoUid, userWorlds);
      await saveUserAccounts(pseudoUid, userAccounts);
      await saveUserFiles(pseudoUid, userFiles);
      await saveUserSales(pseudoUid, userSales);
    }

    return res.json({
      success: true,
      user: {
        username: cleanName,
        growId: cleanName,
        avatarSeed: userKey,
      },
      data: {
        worlds: userWorlds,
        accounts: userAccounts,
        files: userFiles,
        salesRecords: userSales,
        soundEnabled: true,
        updatedAt: Date.now(),
      },
    });
  } catch (err) {
    console.error('Fallback to local disk login:', err);
    // Fallback if SQL is idle or local mode
    const localDb = loadLocalFallbackDb();
    let user = localDb[userKey];
    if (!user) {
      user = {
        username: cleanName,
        growId: cleanName,
        avatarSeed: userKey,
        updatedAt: Date.now(),
        worlds: userKey === 'nuzulfarmer' ? INITIAL_WORLDS : [],
        accounts: userKey === 'nuzulfarmer' ? INITIAL_ACCOUNTS : [],
        files: userKey === 'nuzulfarmer' ? INITIAL_FILES : [],
        salesRecords: userKey === 'nuzulfarmer' ? INITIAL_SALES_RECORDS : [],
        soundEnabled: true,
      };
      localDb[userKey] = user;
      saveLocalFallbackDb(localDb);
    }

    return res.json({
      success: true,
      user: {
        username: user.username,
        growId: user.growId,
        avatarSeed: user.avatarSeed,
      },
      data: {
        worlds: user.worlds,
        accounts: user.accounts,
        files: user.files,
        salesRecords: user.salesRecords || [],
        soundEnabled: user.soundEnabled,
        updatedAt: user.updatedAt,
      },
    });
  }
});

// 4. Get User Latest Data (Cloud SQL & Multi-device Polling)
app.get('/api/user/data', async (req: Request, res: Response) => {
  const username = req.query.username as string;
  const userIdent = await extractUserIdentifier(req);

  const targetUid =
    userIdent.uid ||
    (username ? (username.startsWith('demo-') ? username : `demo-${username.trim().toLowerCase()}`) : null);

  if (!targetUid) {
    return res.status(400).json({ error: 'Username atau Auth Token diperlukan' });
  }

  try {
    const userWorlds = await getUserWorlds(targetUid);
    const userAccounts = await getUserAccounts(targetUid);
    const userFiles = await getUserFiles(targetUid);
    const userSales = await getUserSales(targetUid);
    const lastUpdated =
      (await getUserLastUpdated(targetUid)) ||
      (username ? loadLocalFallbackDb()[username.trim().toLowerCase()]?.updatedAt : 0) ||
      1;

    return res.json({
      success: true,
      updatedAt: lastUpdated,
      worlds: userWorlds,
      accounts: userAccounts,
      files: userFiles,
      salesRecords: userSales,
      soundEnabled: true,
    });
  } catch (error) {
    console.error('Error fetching user data from Cloud SQL:', error);
    // Fallback to local
    if (username) {
      const localDb = loadLocalFallbackDb();
      const user = localDb[username.trim().toLowerCase()];
      if (user) {
        return res.json({
          success: true,
          updatedAt: user.updatedAt || 1,
          worlds: user.worlds,
          accounts: user.accounts,
          files: user.files,
          salesRecords: user.salesRecords || [],
          soundEnabled: user.soundEnabled,
        });
      }
    }
    return res.status(500).json({ error: 'Gagal mengambil data dari database' });
  }
});

// 5. Sync Client Changes to Cloud SQL Database
app.post('/api/user/sync', async (req: Request, res: Response) => {
  const { username, worlds, accounts, files, salesRecords, soundEnabled, uid: bodyUid } = req.body;
  const userIdent = await extractUserIdentifier(req);
  const targetUid =
    userIdent.uid ||
    bodyUid ||
    (username ? (username.startsWith('demo-') ? username : `demo-${username.trim().toLowerCase()}`) : null);

  if (!targetUid) {
    return res.status(400).json({ error: 'Username atau Auth Token wajib disertakan' });
  }

  try {
    if (Array.isArray(worlds)) await saveUserWorlds(targetUid, worlds);
    if (Array.isArray(accounts)) await saveUserAccounts(targetUid, accounts);
    if (Array.isArray(files)) await saveUserFiles(targetUid, files);
    if (Array.isArray(salesRecords)) await saveUserSales(targetUid, salesRecords);
    const newTimestamp = (await touchUserLastUpdated(targetUid)) || Date.now();

    // Also update local cache as safety backup
    if (username) {
      const localDb = loadLocalFallbackDb();
      const userKey = username.trim().toLowerCase();
      localDb[userKey] = {
        username: username.trim(),
        growId: username.trim(),
        avatarSeed: userKey,
        updatedAt: newTimestamp,
        worlds,
        accounts,
        files,
        salesRecords,
        soundEnabled: soundEnabled !== undefined ? soundEnabled : true,
      };
      saveLocalFallbackDb(localDb);
    }

    return res.json({
      success: true,
      updatedAt: newTimestamp,
    });
  } catch (error: any) {
    console.error('Sync to Cloud SQL error:', error);
    return res.status(500).json({ error: error.message || 'Gagal menyinkronkan ke Cloud SQL' });
  }
});

// 6. Gemini Chatbot with Google Search Grounding
app.post('/api/chat', async (req: Request, res: Response) => {
  try {
    const { message, conversationHistory } = req.body;
    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'Pesan pertanyaan wajib diisi' });
    }

    const userIdent = await extractUserIdentifier(req);
    const uid = userIdent.uid;
    const userIdentifier = uid || 'guest_farmer';

    // Format conversation history for Gemini API
    const contents: any[] = [];

    if (Array.isArray(conversationHistory)) {
      for (const msg of conversationHistory) {
        if (msg.role === 'user' || msg.role === 'assistant') {
          contents.push({
            role: msg.role === 'assistant' ? 'model' : 'user',
            parts: [{ text: msg.content }],
          });
        }
      }
    }

    // Append the latest user query
    contents.push({
      role: 'user',
      parts: [{ text: message }],
    });

    // Call Gemini with intelligent Growtopia Advisor engine fallback
    let replyText = '';
    let webSources: { title: string; uri: string }[] = [];

    try {
      const timeoutPromise = new Promise<null>((_, reject) =>
        setTimeout(() => reject(new Error('Cloud AI timeout')), 6000)
      );

      const response: any = await Promise.race([
        ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents,
          config: {
            systemInstruction: GROWTOPIA_SYSTEM_INSTRUCTION,
          },
        }),
        timeoutPromise,
      ]);

      if (response && response.text) {
        replyText = response.text;
        const groundingChunks =
          response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
        for (const chunk of groundingChunks) {
          if (chunk.web && chunk.web.uri) {
            webSources.push({
              title: chunk.web.title || chunk.web.uri,
              uri: chunk.web.uri,
            });
          }
        }
      }
    } catch (apiError: any) {
      console.warn('Gemini cloud quota/timeout, switching to Growtopia AI Advisor:', apiError?.message);
    }

    // If cloud API was rate-limited or returned empty, generate instant Growtopia response
    if (!replyText || replyText.trim().length === 0) {
      const expertResult = answerGrowtopiaQuestion(message);
      replyText = expertResult.reply;
      webSources = expertResult.sources || [];
    }

    // Save to PostgreSQL if user is identified
    try {
      if (uid) {
        await addChatMessage(uid, 'user', message);
        await addChatMessage(uid, 'assistant', replyText, webSources);
      }
    } catch (saveErr) {
      console.warn('Failed to save chat message to SQL:', saveErr);
    }

    return res.json({
      success: true,
      reply: replyText,
      sources: webSources,
      timestamp: Date.now(),
    });
  } catch (error: any) {
    console.error('Gemini Chat API error:', error);
    return res.status(500).json({
      error: error.message || 'Gagal menghubungi Gemini AI. Silakan coba lagi.',
    });
  }
});

// 7. Get Chat History
app.get('/api/chat/history', async (req: Request, res: Response) => {
  const userIdent = await extractUserIdentifier(req);
  const uid = userIdent.uid;
  if (!uid) {
    return res.json({ success: true, messages: [] });
  }

  try {
    const messages = await getChatMessages(uid);
    return res.json({ success: true, messages });
  } catch (error) {
    return res.json({ success: true, messages: [] });
  }
});

// 8. Clear Chat History
app.delete('/api/chat/history', async (req: Request, res: Response) => {
  const userIdent = await extractUserIdentifier(req);
  const uid = userIdent.uid;
  if (uid) {
    await clearChatHistory(uid);
  }
  return res.json({ success: true });
});

// Mount Vite in development or serve static in production
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: process.env.DISABLE_HMR !== 'true',
        watch: process.env.DISABLE_HMR === 'true' ? null : {},
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    if (fs.existsSync(distPath)) {
      app.use(express.static(distPath));
      app.get('*', (_req, res) => {
        res.sendFile(path.resolve(distPath, 'index.html'));
      });
    } else {
      console.warn('dist directory does not exist, run npm run build first');
    }
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Growtopia Farm Manager Server running on port ${PORT}`);
  });
}

startServer();
