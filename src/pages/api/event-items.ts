import type { APIRoute } from 'astro';
import { db } from '../../db';
import { eventItems, events } from '../../db/schema';
import type { NewEventItem } from '../../db/schema';
import { eq } from 'drizzle-orm';

// Request body types for API operations
interface CreateEventItemRequest {
  eventId: number;
  flavorName: string;
  prepared?: number;
  remaining?: number;
  giveaway?: number;
  sold?: number;
  revenue?: number;
  unitCost?: number | null;
  cogs?: number;
  profit?: number;
}

interface UpdateEventItemRequest {
  id: number;
  eventId?: number;
  flavorName?: string;
  prepared?: number;
  remaining?: number;
  giveaway?: number;
  sold?: number;
  revenue?: number;
  unitCost?: number | null;
  cogs?: number;
  profit?: number;
}

interface DeleteEventItemRequest {
  id: number;
  eventId?: number;
}

// Type for the totals accumulator in recalculateEventTotals
interface EventTotals {
  totalPrepared: number;
  totalSold: number;
  totalGiveaway: number;
  totalRevenue: number;
  totalCost: number;
  netProfit: number;
}

export const POST: APIRoute = async ({ request }) => {
  try {
    const data: CreateEventItemRequest = await request.json();

    const newItem: NewEventItem = {
      eventId: data.eventId,
      flavorName: data.flavorName,
      prepared: data.prepared ?? 0,
      remaining: data.remaining ?? 0,
      giveaway: data.giveaway ?? 0,
      sold: data.sold ?? 0,
      revenue: data.revenue ?? 0,
      unitCost: data.unitCost ?? null,
      cogs: data.cogs ?? 0,
      profit: data.profit ?? 0,
    };

    const result = await db.insert(eventItems).values(newItem).returning().get();

    // Update event totals
    await recalculateEventTotals(data.eventId);

    return new Response(JSON.stringify(result), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Failed to create event item:', error);
    return new Response(JSON.stringify({ error: 'Failed to create event item' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

export const PUT: APIRoute = async ({ request }) => {
  try {
    const data: UpdateEventItemRequest = await request.json();
    const { id, eventId, ...updateData } = data;

    await db.update(eventItems).set(updateData).where(eq(eventItems.id, id)).run();

    // Update event totals if eventId provided
    if (eventId) {
      await recalculateEventTotals(eventId);
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Failed to update event item:', error);
    return new Response(JSON.stringify({ error: 'Failed to update event item' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

export const DELETE: APIRoute = async ({ request }) => {
  try {
    const data: DeleteEventItemRequest = await request.json();
    const { id, eventId } = data;

    await db.delete(eventItems).where(eq(eventItems.id, id)).run();

    // Update event totals
    if (eventId) {
      await recalculateEventTotals(eventId);
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Failed to delete event item:', error);
    return new Response(JSON.stringify({ error: 'Failed to delete event item' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

async function recalculateEventTotals(eventId: number): Promise<void> {
  const items = await db.select().from(eventItems).where(eq(eventItems.eventId, eventId)).all();

  const initialTotals: EventTotals = {
    totalPrepared: 0,
    totalSold: 0,
    totalGiveaway: 0,
    totalRevenue: 0,
    totalCost: 0,
    netProfit: 0,
  };

  const totals = items.reduce<EventTotals>((acc, item) => ({
    totalPrepared: acc.totalPrepared + (item.prepared ?? 0),
    totalSold: acc.totalSold + (item.sold ?? 0),
    totalGiveaway: acc.totalGiveaway + (item.giveaway ?? 0),
    totalRevenue: acc.totalRevenue + (item.revenue ?? 0),
    totalCost: acc.totalCost + (item.cogs ?? 0),
    netProfit: acc.netProfit + (item.profit ?? 0),
  }), initialTotals);

  await db.update(events).set(totals).where(eq(events.id, eventId)).run();
}
