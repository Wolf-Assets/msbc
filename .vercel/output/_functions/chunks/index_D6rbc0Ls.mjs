import { drizzle } from 'drizzle-orm/libsql';
import { createClient } from '@libsql/client';
import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';

const flavors = sqliteTable("flavors", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  unitPrice: real("unit_price").notNull(),
  unitCost: real("unit_cost"),
  isActive: integer("is_active", { mode: "boolean" }).default(true),
  createdAt: text("created_at").default("CURRENT_TIMESTAMP")
});
const events = sqliteTable("events", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  eventDate: text("event_date").notNull(),
  location: text("location"),
  eventCost: real("event_cost").default(0),
  totalPrepared: integer("total_prepared").default(0),
  totalSold: integer("total_sold").default(0),
  totalGiveaway: integer("total_giveaway").default(0),
  totalRevenue: real("total_revenue").default(0),
  totalCost: real("total_cost").default(0),
  netProfit: real("net_profit").default(0),
  cashCollected: real("cash_collected").default(0),
  venmoCollected: real("venmo_collected").default(0),
  otherCollected: real("other_collected").default(0),
  notes: text("notes"),
  createdAt: text("created_at").default("CURRENT_TIMESTAMP")
});
const eventItems = sqliteTable("event_items", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  eventId: integer("event_id").notNull(),
  flavorName: text("flavor_name").notNull(),
  prepared: integer("prepared").default(0),
  remaining: integer("remaining").default(0),
  giveaway: integer("giveaway").default(0),
  sold: integer("sold").default(0),
  revenue: real("revenue").default(0),
  unitCost: real("unit_cost"),
  cogs: real("cogs").default(0),
  profit: real("profit").default(0)
});

const schema = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  eventItems,
  events,
  flavors
}, Symbol.toStringTag, { value: 'Module' }));

const client = createClient({
  url: "libsql://mighty-sweet-baking-co-bhatnag8.aws-us-east-2.turso.io",
  authToken: "eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3NzAyNDMzNDQsImlkIjoiZDQzYjZhNTgtYmI4Ni00MDlmLTkwN2QtM2UyMmYzYzc3YTE1IiwicmlkIjoiYzljYmMzZDItZTYxNi00Nzg3LTliYTYtNGNjODY0MjkzZWEzIn0.ybhM84zqnJagHIWHbaZU5JkyeBPQpSYQiwzIjX7ibnFh00kQnwV62l9TOqgt4z6s-BTCkRpNJLmAE1rp8Ty_Cw"
});
const db = drizzle(client, { schema });

export { events as a, db as d, eventItems as e, flavors as f };
