import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { events, eventItems } from '@/db/schema';
import { eq, desc, isNull, isNotNull } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (id) {
    // Get single event with items
    const event = await db.select().from(events).where(eq(events.id, parseInt(id))).get();
    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }
    const items = await db.select().from(eventItems).where(eq(eventItems.eventId, parseInt(id)));
    return NextResponse.json({ ...event, items });
  }

  // Get archived or active events
  const archived = searchParams.get('archived');
  if (archived === 'true') {
    const archivedEvents = await db.select().from(events).where(isNotNull(events.deletedAt)).orderBy(desc(events.eventDate));
    return NextResponse.json(archivedEvents);
  }

  const allEvents = await db.select().from(events).where(isNull(events.deletedAt)).orderBy(desc(events.eventDate));
  return NextResponse.json(allEvents);
}

export async function POST(request: NextRequest) {
  const body = await request.json();

  const result = await db.insert(events).values({
    name: body.name,
    eventDate: body.eventDate,
    location: body.location || null,
    eventCost: body.eventCost || 0,
    totalPrepared: body.totalPrepared || 0,
    totalSold: body.totalSold || 0,
    totalGiveaway: body.totalGiveaway || 0,
    totalRevenue: body.totalRevenue || 0,
    totalCost: body.totalCost || 0,
    netProfit: body.netProfit || 0,
    cashCollected: body.cashCollected || 0,
    venmoCollected: body.venmoCollected || 0,
    otherCollected: body.otherCollected || 0,
    notes: body.notes || null,
  }).returning();

  return NextResponse.json(result[0]);
}

export async function PUT(request: NextRequest) {
  const body = await request.json();
  const { id, ...updates } = body;

  // Recalculate totals if updating event items
  if (updates.recalculate) {
    const items = await db.select().from(eventItems).where(eq(eventItems.eventId, id));
    updates.totalPrepared = items.reduce((sum, i) => sum + (i.prepared || 0), 0);
    updates.totalSold = items.reduce((sum, i) => sum + (i.sold || 0), 0);
    updates.totalGiveaway = items.reduce((sum, i) => sum + (i.giveaway || 0), 0);
    updates.totalRevenue = items.reduce((sum, i) => sum + (i.revenue || 0), 0);
    updates.totalCost = items.reduce((sum, i) => sum + (i.cogs || 0), 0);

    updates.netProfit = updates.totalRevenue - updates.totalCost;
    delete updates.recalculate;
  }

  await db.update(events).set(updates).where(eq(events.id, id));
  const updated = await db.select().from(events).where(eq(events.id, id)).get();
  return NextResponse.json(updated);
}

export async function DELETE(request: NextRequest) {
  const body = await request.json();
  const { id, hard } = body;

  if (hard) {
    // Hard delete — permanently remove from database
    await db.delete(eventItems).where(eq(eventItems.eventId, id));
    await db.delete(events).where(eq(events.id, id));
  } else {
    // Soft delete — set deletedAt timestamp
    await db.update(events).set({
      deletedAt: new Date().toISOString(),
    }).where(eq(events.id, id));
  }

  return NextResponse.json({ success: true });
}
