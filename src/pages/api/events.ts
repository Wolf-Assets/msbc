import type { APIRoute } from 'astro';
import { db } from '../../db';
import { events, eventItems } from '../../db/schema';
import type { NewEvent } from '../../db/schema';
import { eq } from 'drizzle-orm';

// Request body types for API operations
interface CreateEventRequest {
  name: string;
  eventDate: string;
  location?: string | null;
  eventCost?: number;
  totalPrepared?: number;
  totalSold?: number;
  totalGiveaway?: number;
  totalRevenue?: number;
  totalCost?: number;
  netProfit?: number;
  cashCollected?: number;
  venmoCollected?: number;
  otherCollected?: number;
  notes?: string | null;
}

interface UpdateEventRequest {
  id: number;
  name?: string;
  eventDate?: string;
  location?: string | null;
  eventCost?: number;
  totalPrepared?: number;
  totalSold?: number;
  totalGiveaway?: number;
  totalRevenue?: number;
  totalCost?: number;
  netProfit?: number;
  cashCollected?: number;
  venmoCollected?: number;
  otherCollected?: number;
  notes?: string | null;
}

interface DeleteEventRequest {
  id: number;
}

export const GET: APIRoute = async ({ url }) => {
  const idParam = url.searchParams.get('id');

  if (idParam) {
    const id = parseInt(idParam, 10);
    // Get single event with items
    const event = await db.select().from(events).where(eq(events.id, id)).get();
    if (!event) {
      return new Response(JSON.stringify({ error: 'Event not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    const items = await db.select().from(eventItems).where(eq(eventItems.eventId, id)).all();
    return new Response(JSON.stringify({ ...event, items }), {
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Get all events
  const allEvents = await db.select().from(events).all();
  return new Response(JSON.stringify(allEvents), {
    headers: { 'Content-Type': 'application/json' },
  });
};

export const POST: APIRoute = async ({ request }) => {
  try {
    const data: CreateEventRequest = await request.json();

    const newEvent: NewEvent = {
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
      notes: data.notes ?? null,
    };

    const result = await db.insert(events).values(newEvent).returning().get();

    return new Response(JSON.stringify(result), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Failed to create event:', error);
    return new Response(JSON.stringify({ error: 'Failed to create event' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

export const PUT: APIRoute = async ({ request }) => {
  try {
    const data: UpdateEventRequest = await request.json();
    const { id, ...updateData } = data;

    await db.update(events).set(updateData).where(eq(events.id, id)).run();

    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Failed to update event:', error);
    return new Response(JSON.stringify({ error: 'Failed to update event' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

export const DELETE: APIRoute = async ({ request }) => {
  try {
    const data: DeleteEventRequest = await request.json();
    const { id } = data;

    // Delete event items first
    await db.delete(eventItems).where(eq(eventItems.eventId, id)).run();
    // Delete event
    await db.delete(events).where(eq(events.id, id)).run();

    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Failed to delete event:', error);
    return new Response(JSON.stringify({ error: 'Failed to delete event' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
