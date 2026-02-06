import { d as db, e as eventItems, a as events } from '../../chunks/index_D6rbc0Ls.mjs';
import { eq, sql } from 'drizzle-orm';
export { renderers } from '../../renderers.mjs';

const POST = async ({ request }) => {
  try {
    const data = await request.json();
    const newItem = {
      eventId: data.eventId,
      flavorName: data.flavorName,
      prepared: data.prepared ?? 0,
      remaining: data.remaining ?? 0,
      giveaway: data.giveaway ?? 0,
      sold: data.sold ?? 0,
      revenue: data.revenue ?? 0,
      unitCost: data.unitCost ?? null,
      cogs: data.cogs ?? 0,
      profit: data.profit ?? 0
    };
    const result = await db.insert(eventItems).values(newItem).returning().get();
    await recalculateEventTotals(data.eventId);
    return new Response(JSON.stringify(result), {
      status: 201,
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error("Failed to create event item:", error);
    return new Response(JSON.stringify({ error: "Failed to create event item" }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
};
const PUT = async ({ request }) => {
  try {
    const data = await request.json();
    const { id, eventId, ...updateData } = data;
    await db.update(eventItems).set(updateData).where(eq(eventItems.id, id)).run();
    if (eventId) {
      await recalculateEventTotals(eventId);
    }
    return new Response(JSON.stringify({ success: true }), {
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error("Failed to update event item:", error);
    return new Response(JSON.stringify({ error: "Failed to update event item" }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
};
const DELETE = async ({ request }) => {
  try {
    const data = await request.json();
    const { id, eventId } = data;
    await db.delete(eventItems).where(eq(eventItems.id, id)).run();
    if (eventId) {
      await recalculateEventTotals(eventId);
    }
    return new Response(JSON.stringify({ success: true }), {
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error("Failed to delete event item:", error);
    return new Response(JSON.stringify({ error: "Failed to delete event item" }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
};
async function recalculateEventTotals(eventId) {
  const result = await db.select({
    totalPrepared: sql`COALESCE(SUM(${eventItems.prepared}), 0)`,
    totalSold: sql`COALESCE(SUM(${eventItems.sold}), 0)`,
    totalGiveaway: sql`COALESCE(SUM(${eventItems.giveaway}), 0)`,
    totalRevenue: sql`COALESCE(SUM(${eventItems.revenue}), 0)`,
    totalCost: sql`COALESCE(SUM(${eventItems.cogs}), 0)`,
    netProfit: sql`COALESCE(SUM(${eventItems.profit}), 0)`
  }).from(eventItems).where(eq(eventItems.eventId, eventId)).get();
  if (result) {
    await db.update(events).set(result).where(eq(events.id, eventId)).run();
  }
}

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  DELETE,
  POST,
  PUT
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
