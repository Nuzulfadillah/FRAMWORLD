import { relations } from 'drizzle-orm';
import {
  pgTable,
  serial,
  text,
  integer,
  boolean,
  timestamp,
  json,
} from 'drizzle-orm/pg-core';

// 1. Users table (linked to Firebase Auth UID)
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull().unique(), // Firebase Auth UID
  email: text('email').notNull(),
  growId: text('grow_id'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// 2. Worlds table
export const worlds = pgTable('worlds', {
  id: text('id').primaryKey(), // world client id e.g. "world-123"
  userId: text('user_id').notNull(), // links to users.uid
  name: text('name').notNull(),
  cropType: text('crop_type').notNull(),
  treeCount: integer('tree_count').notNull().default(0),
  plantedAt: text('planted_at').default(''),
  durationDays: integer('duration_days').notNull().default(0),
  durationHours: integer('duration_hours').notNull().default(0),
  durationMinutes: integer('duration_minutes').notNull().default(0),
  harvestAt: text('harvest_at').default(''),
  accountId: text('account_id').notNull().default(''),
  notes: text('notes'),
  harvestCount: integer('harvest_count').notNull().default(0),
  lastHarvestedAt: text('last_harvested_at'),
  isEmpty: boolean('is_empty').notNull().default(false),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// 3. GrowAccounts table
export const growAccounts = pgTable('grow_accounts', {
  id: text('id').primaryKey(), // e.g. "acc-1"
  userId: text('user_id').notNull(), // links to users.uid
  growId: text('grow_id').notNull(),
  label: text('label').notNull(),
  notes: text('notes'),
  level: integer('level').default(1),
  createdAt: text('created_at').notNull(),
});

// 4. FarmFiles table
export const farmFiles = pgTable('farm_files', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull(), // links to users.uid
  name: text('name').notNull(),
  type: text('type').notNull(),
  size: integer('size').notNull().default(0),
  uploadDate: text('upload_date').notNull(),
  tags: json('tags').$type<string[]>().default([]),
  dataUrl: text('data_url'),
  notes: text('notes'),
});

// 5. FarmSaleRecords table
export const farmSaleRecords = pgTable('farm_sale_records', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull(), // links to users.uid
  date: text('date').notNull(),
  title: text('title').notNull(),
  category: text('category').notNull(),
  itemSold: text('item_sold').notNull(),
  quantity: integer('quantity').notNull().default(0),
  quantityUnit: text('quantity_unit').notNull().default('WL'),
  revenueWl: integer('revenue_wl').notNull().default(0),
  buyerName: text('buyer_name'),
  worldName: text('world_name'),
  priceRate: text('price_rate'),
  notes: text('notes'),
  createdAt: text('created_at').notNull(),
});

// 6. ChatMessages table for Gemini Chatbot history
export const chatMessages = pgTable('chat_messages', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull(), // links to users.uid
  role: text('role').notNull(), // 'user' | 'assistant'
  content: text('content').notNull(),
  groundingSources: json('grounding_sources').$type<{ title: string; uri: string }[]>().default([]),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  worlds: many(worlds),
  growAccounts: many(growAccounts),
  farmFiles: many(farmFiles),
  farmSaleRecords: many(farmSaleRecords),
  chatMessages: many(chatMessages),
}));
