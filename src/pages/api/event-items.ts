import type { APIRoute } from 'astro';
import { db } from '../../db';
import { eventItems, events } from '../../db/schema';
import type { NewEventItem } from '../../db/schema';
import { eq, sql } from 'drizzle-orm';

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

// Type for SQL aggregation result
interface TotalsRow {
  totalPrepared: number | null;
  totalSold: number | null;
  totalGiveaway: number | null;
  totalRevenue: number | null;
  totalCost: number | null;
  netProfit: number | null;
}

export const GET: APIRoute = async ({ url }) => {
  const eventIdParam = url.searchParams.get('eventId');

  if (!eventIdParam) {
    return new Response(JSON.stringify({ error: 'eventId required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const eventId = parseInt(eventIdParam, 10);
  const items = await db.select().from(eventItems).where(eq(eventItems.eventId, eventId)).all();

  return new Response(JSON.stringify(items), {
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 's-maxage=1, stale-while-revalidate=59',
    },
  });
};

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
  // Use SQL SUM for efficiency instead of fetching all rows and reducing in JS
  const result = await db
    .select({
      totalPrepared: sql<number>`COALESCE(SUM(${eventItems.prepared}), 0)`,
      totalSold: sql<number>`COALESCE(SUM(${eventItems.sold}), 0)`,
      totalGiveaway: sql<number>`COALESCE(SUM(${eventItems.giveaway}), 0)`,
      totalRevenue: sql<number>`COALESCE(SUM(${eventItems.revenue}), 0)`,
      totalCost: sql<number>`COALESCE(SUM(${eventItems.cogs}), 0)`,
      netProfit: sql<number>`COALESCE(SUM(${eventItems.profit}), 0)`,
    })
    .from(eventItems)
    .where(eq(eventItems.eventId, eventId))
    .get();

  if (result) {
    await db.update(events).set(result).where(eq(events.id, eventId)).run();
  }
}
