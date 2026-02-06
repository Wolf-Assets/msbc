import { d as db, e as eventItems, a as events } from '../../chunks/index_D6rbc0Ls.mjs';
import { eq } from 'drizzle-orm';
export { renderers } from '../../renderers.mjs';

const GET = async ({ url }) => {
  const idParam = url.searchParams.get("id");
  if (idParam) {
    const id = parseInt(idParam, 10);
    const event = await db.select().from(events).where(eq(events.id, id)).get();
    if (!event) {
      return new Response(JSON.stringify({ error: "Event not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" }
      });
    }
    const items = await db.select().from(eventItems).where(eq(eventItems.eventId, id)).all();
    return new Response(JSON.stringify({ ...event, items }), {
      headers: { "Content-Type": "application/json" }
    });
  }
  const allEvents = await db.select().from(events).all();
  return new Response(JSON.stringify(allEvents), {
    headers: { "Content-Type": "application/json" }
  });
};
const POST = async ({ request }) => {
  try {
    const data = await request.json();
    const newEvent = {
      name: data.name,
      eventDate: data.eventDate,
      location: data.location ?? null,
      eventCost: data.eventCost ?? 0,
      totalPrepared: data.totalPrepared ?? 0,
      totalSold: data.totalSold ?? 0,
      totalGiveaway: data.totalGiveaway ?? 0,
      totalRevenue: data.totalRevenue ?? 0,
      totalCost: data.totalCost ?? 0,
      netProfit: data.netProfit ?? 0,
      cashCollected: data.cashCollected ?? 0,
      venmoCollected: data.venmoCollected ?? 0,
      otherCollected: data.otherCollected ?? 0,
      notes: data.notes ?? null
    };
    const result = await db.insert(events).values(newEvent).returning().get();
    return new Response(JSON.stringify(result), {
      status: 201,
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error("Failed to create event:", error);
    return new Response(JSON.stringify({ error: "Failed to create event" }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
};
const PUT = async ({ request }) => {
  try {
    const data = await request.json();
    const { id, ...updateData } = data;
    await db.update(events).set(updateData).where(eq(events.id, id)).run();
    return new Response(JSON.stringify({ success: true }), {
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error("Failed to update event:", error);
    return new Response(JSON.stringify({ error: "Failed to update event" }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
};
const DELETE = async ({ request }) => {
  try {
    const data = await request.json();
    const { id } = data;
    await db.delete(eventItems).where(eq(eventItems.eventId, id)).run();
    await db.delete(events).where(eq(events.id, id)).run();
    return new Response(JSON.stringify({ success: true }), {
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error("Failed to delete event:", error);
    return new Response(JSON.stringify({ error: "Failed to delete event" }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
};

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  DELETE,
  GET,
  POST,
  PUT
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
