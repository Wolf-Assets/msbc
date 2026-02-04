import { sqliteTable, text, real, integer } from 'drizzle-orm/sqlite-core';

export const flavors = sqliteTable('flavors', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  unitPrice: real('unit_price').notNull(),
  unitCost: real('unit_cost'),
  isActive: integer('is_active', { mode: 'boolean' }).default(true),
  createdAt: text('created_at').default('CURRENT_TIMESTAMP'),
});

export const events = sqliteTable('events', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  eventDate: text('event_date').notNull(),
  location: text('location'),
  totalPrepared: integer('total_prepared').default(0),
  totalSold: integer('total_sold').default(0),
  totalGiveaway: integer('total_giveaway').default(0),
  totalRevenue: real('total_revenue').default(0),
  totalCost: real('total_cost').default(0),
  netProfit: real('net_profit').default(0),
  cashCollected: real('cash_collected').default(0),
  venmoCollected: real('venmo_collected').default(0),
  otherCollected: real('other_collected').default(0),
  notes: text('notes'),
  createdAt: text('created_at').default('CURRENT_TIMESTAMP'),
});

export const eventItems = sqliteTable('event_items', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  eventId: integer('event_id').notNull(),
  flavorName: text('flavor_name').notNull(),
  prepared: integer('prepared').default(0),
  remaining: integer('remaining').default(0),
  giveaway: integer('giveaway').default(0),
  sold: integer('sold').default(0),
  revenue: real('revenue').default(0),
  unitCost: real('unit_cost'),
  cogs: real('cogs').default(0),
  profit: real('profit').default(0),
});

export type Flavor = typeof flavors.$inferSelect;
export type NewFlavor = typeof flavors.$inferInsert;
export type Event = typeof events.$inferSelect;
export type NewEvent = typeof events.$inferInsert;
export type EventItem = typeof eventItems.$inferSelect;
export type NewEventItem = typeof eventItems.$inferInsert;
