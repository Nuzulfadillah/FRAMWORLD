export type CropPreset = {
  name: string;
  category: string;
  days: number;
  hours: number;
  minutes: number;
  icon: string;
  color: string;
  description: string;
};

export type WorldStatus = 'growing' | 'ready' | 'overdue' | 'empty';

export interface World {
  id: string;
  name: string;
  cropType: string;
  treeCount: number;
  plantedAt: string; // ISO date string
  durationDays: number;
  durationHours: number;
  durationMinutes: number;
  harvestAt: string; // ISO date string
  accountId: string; // reference to GrowAccount.id
  notes?: string;
  harvestCount: number;
  lastHarvestedAt?: string;
  isEmpty?: boolean; // True if world is empty / not planted yet
}

export interface GrowAccount {
  id: string;
  growId: string;
  label: string; // e.g. "Akun Utama", "Holder Seed", "BFG Farm"
  notes?: string;
  level?: number;
  createdAt: string;
}

export interface FarmFile {
  id: string;
  name: string;
  type: 'pdf' | 'xlsx' | 'xls' | 'csv' | 'other';
  size: number;
  uploadDate: string;
  tags: string[];
  dataUrl?: string;
  notes?: string;
}

export interface UserSession {
  isLoggedIn: boolean;
  username: string;
  growId: string;
  avatarSeed: string;
  email?: string;
  uid?: string;
  authToken?: string;
}

export interface FarmSaleRecord {
  id: string;
  date: string; // ISO date string
  title: string;
  category: 'gems' | 'seed' | 'block' | 'pack' | 'lock' | 'other';
  itemSold: string;
  quantity: number;
  quantityUnit: string; // e.g. "Gems", "Seed", "Block", "Pack", "WL"
  revenueWl: number; // Pendapatan dalam World Lock
  buyerName?: string;
  worldName?: string;
  priceRate?: string; // e.g. "1,600 gems/WL", "15 seed/WL"
  notes?: string;
  createdAt: string;
}
