import { db } from './index.ts';
import { users, worlds, growAccounts, farmFiles, farmSaleRecords, chatMessages } from './schema.ts';
import { eq, desc } from 'drizzle-orm';
import { World, GrowAccount, FarmFile, FarmSaleRecord } from '../types.ts';

// 1. Get or create user
export async function getOrCreateUser(uid: string, email: string, growId?: string) {
  try {
    const result = await db
      .insert(users)
      .values({
        uid,
        email: email || `${uid}@growtopia.farm`,
        growId: growId || 'NuzulFarmer',
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: users.uid,
        set: {
          email: email || `${uid}@growtopia.farm`,
          growId: growId || 'NuzulFarmer',
          updatedAt: new Date(),
        },
      })
      .returning();
    return result[0];
  } catch (error) {
    console.error('getOrCreateUser error:', error);
    throw new Error('Database user lookup failed', { cause: error });
  }
}

export async function touchUserLastUpdated(userId: string): Promise<number> {
  const now = new Date();
  try {
    await db.update(users).set({ updatedAt: now }).where(eq(users.uid, userId));
  } catch (error) {
    console.warn('touchUserLastUpdated error:', error);
  }
  return now.getTime();
}

export async function getUserLastUpdated(userId: string): Promise<number> {
  try {
    const row = await db.select({ updatedAt: users.updatedAt }).from(users).where(eq(users.uid, userId)).limit(1);
    if (row && row[0]?.updatedAt) {
      return new Date(row[0].updatedAt).getTime();
    }
  } catch (error) {
    console.warn('getUserLastUpdated error:', error);
  }
  return 0;
}

// 2. Worlds
export async function getUserWorlds(userId: string): Promise<World[]> {
  try {
    const rows = await db.select().from(worlds).where(eq(worlds.userId, userId));
    return rows.map((r) => ({
      id: r.id,
      name: r.name,
      cropType: r.cropType,
      treeCount: r.treeCount,
      plantedAt: r.plantedAt || '',
      durationDays: r.durationDays,
      durationHours: r.durationHours,
      durationMinutes: r.durationMinutes,
      harvestAt: r.harvestAt || '',
      accountId: r.accountId,
      notes: r.notes || '',
      harvestCount: r.harvestCount,
      lastHarvestedAt: r.lastHarvestedAt || undefined,
      isEmpty: r.isEmpty,
    }));
  } catch (error) {
    console.error('getUserWorlds error:', error);
    return [];
  }
}

export async function saveUserWorlds(userId: string, worldList: World[]): Promise<void> {
  try {
    // Delete existing worlds for user and insert current
    await db.delete(worlds).where(eq(worlds.userId, userId));
    if (worldList.length > 0) {
      await db.insert(worlds).values(
        worldList.map((w) => ({
          id: w.id,
          userId,
          name: w.name,
          cropType: w.cropType,
          treeCount: w.treeCount || 0,
          plantedAt: w.plantedAt || '',
          durationDays: w.durationDays || 0,
          durationHours: w.durationHours || 0,
          durationMinutes: w.durationMinutes || 0,
          harvestAt: w.harvestAt || '',
          accountId: w.accountId || '',
          notes: w.notes || '',
          harvestCount: w.harvestCount || 0,
          lastHarvestedAt: w.lastHarvestedAt || null,
          isEmpty: !!w.isEmpty,
          updatedAt: new Date(),
        }))
      );
    }
  } catch (error) {
    console.error('saveUserWorlds error:', error);
    throw new Error('Gagal menyimpan world ke database', { cause: error });
  }
}

// 3. Grow Accounts
export async function getUserAccounts(userId: string): Promise<GrowAccount[]> {
  try {
    const rows = await db.select().from(growAccounts).where(eq(growAccounts.userId, userId));
    return rows.map((r) => ({
      id: r.id,
      growId: r.growId,
      label: r.label,
      notes: r.notes || '',
      level: r.level || 1,
      createdAt: r.createdAt,
    }));
  } catch (error) {
    console.error('getUserAccounts error:', error);
    return [];
  }
}

export async function saveUserAccounts(userId: string, accountList: GrowAccount[]): Promise<void> {
  try {
    await db.delete(growAccounts).where(eq(growAccounts.userId, userId));
    if (accountList.length > 0) {
      await db.insert(growAccounts).values(
        accountList.map((a) => ({
          id: a.id,
          userId,
          growId: a.growId,
          label: a.label,
          notes: a.notes || '',
          level: a.level || 1,
          createdAt: a.createdAt || new Date().toISOString(),
        }))
      );
    }
  } catch (error) {
    console.error('saveUserAccounts error:', error);
    throw new Error('Gagal menyimpan akun ke database', { cause: error });
  }
}

// 4. Farm Files
export async function getUserFiles(userId: string): Promise<FarmFile[]> {
  try {
    const rows = await db.select().from(farmFiles).where(eq(farmFiles.userId, userId));
    return rows.map((r) => ({
      id: r.id,
      name: r.name,
      type: r.type as any,
      size: r.size,
      uploadDate: r.uploadDate,
      tags: (r.tags as string[]) || [],
      dataUrl: r.dataUrl || undefined,
      notes: r.notes || '',
    }));
  } catch (error) {
    console.error('getUserFiles error:', error);
    return [];
  }
}

export async function saveUserFiles(userId: string, fileList: FarmFile[]): Promise<void> {
  try {
    await db.delete(farmFiles).where(eq(farmFiles.userId, userId));
    if (fileList.length > 0) {
      await db.insert(farmFiles).values(
        fileList.map((f) => ({
          id: f.id,
          userId,
          name: f.name,
          type: f.type,
          size: f.size || 0,
          uploadDate: f.uploadDate || new Date().toISOString(),
          tags: f.tags || [],
          dataUrl: f.dataUrl || null,
          notes: f.notes || '',
        }))
      );
    }
  } catch (error) {
    console.error('saveUserFiles error:', error);
    throw new Error('Gagal menyimpan berkas ke database', { cause: error });
  }
}

// 5. Sales Records
export async function getUserSales(userId: string): Promise<FarmSaleRecord[]> {
  try {
    const rows = await db.select().from(farmSaleRecords).where(eq(farmSaleRecords.userId, userId));
    return rows.map((r) => ({
      id: r.id,
      date: r.date,
      title: r.title,
      category: r.category as any,
      itemSold: r.itemSold,
      quantity: r.quantity,
      quantityUnit: r.quantityUnit,
      revenueWl: r.revenueWl,
      buyerName: r.buyerName || undefined,
      worldName: r.worldName || undefined,
      priceRate: r.priceRate || undefined,
      notes: r.notes || '',
      createdAt: r.createdAt,
    }));
  } catch (error) {
    console.error('getUserSales error:', error);
    return [];
  }
}

export async function saveUserSales(userId: string, salesList: FarmSaleRecord[]): Promise<void> {
  try {
    await db.delete(farmSaleRecords).where(eq(farmSaleRecords.userId, userId));
    if (salesList.length > 0) {
      await db.insert(farmSaleRecords).values(
        salesList.map((s) => ({
          id: s.id,
          userId,
          date: s.date,
          title: s.title,
          category: s.category,
          itemSold: s.itemSold,
          quantity: s.quantity || 0,
          quantityUnit: s.quantityUnit || 'WL',
          revenueWl: s.revenueWl || 0,
          buyerName: s.buyerName || null,
          worldName: s.worldName || null,
          priceRate: s.priceRate || null,
          notes: s.notes || '',
          createdAt: s.createdAt || new Date().toISOString(),
        }))
      );
    }
  } catch (error) {
    console.error('saveUserSales error:', error);
    throw new Error('Gagal menyimpan catatan penjualan ke database', { cause: error });
  }
}

// 6. Chat Messages
export async function getChatMessages(userId: string, limit = 40) {
  try {
    return await db
      .select()
      .from(chatMessages)
      .where(eq(chatMessages.userId, userId))
      .orderBy(chatMessages.createdAt)
      .limit(limit);
  } catch (error) {
    console.error('getChatMessages error:', error);
    return [];
  }
}

export async function addChatMessage(
  userId: string,
  role: 'user' | 'assistant',
  content: string,
  groundingSources: { title: string; uri: string }[] = []
) {
  try {
    const id = `msg-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const result = await db
      .insert(chatMessages)
      .values({
        id,
        userId,
        role,
        content,
        groundingSources,
        createdAt: new Date(),
      })
      .returning();
    return result[0];
  } catch (error) {
    console.error('addChatMessage error:', error);
    throw new Error('Gagal menyimpan pesan chat ke database', { cause: error });
  }
}

export async function clearChatHistory(userId: string) {
  try {
    await db.delete(chatMessages).where(eq(chatMessages.userId, userId));
  } catch (error) {
    console.error('clearChatHistory error:', error);
  }
}
