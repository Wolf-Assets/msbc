import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { eventItems, events } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const eventId = searchParams.get('eventId');

  if (eventId) {
    const items = await db.select().from(eventItems).where(eq(eventItems.eventId, parseInt(eventId)));
    return NextResponse.json(items);
  }

  const allItems = await db.select().from(eventItems);
  return NextResponse.json(allItems);
}

export async function POST(request: NextRequest) {
  const body = await request.json();

  const result = await db.insert(eventItems).values({
    eventId: body.eventId,
    flavorName: body.flavorName,
    prepared: body.prepared || 0,
    remaining: body.remaining || 0,
    giveaway: body.giveaway || 0,
    sold: body.sold || 0,
    revenue: body.revenue || 0,
    unitCost: body.unitCost || null,
    cogs: body.cogs || 0,
    profit: body.profit || 0,
  }).returning();

  // Recalculate event totals
  await recalculateEventTotals(body.eventId);

  return NextResponse.json(result[0]);
}

export async function PUT(request: NextRequest) {
  const body = await request.json();
  const { id, eventId, ...updates } = body;

  await db.update(eventItems).set(updates).where(eq(eventItems.id, id));

  // Recalculate event totals
  if (eventId) {
    await recalculateEventTotals(eventId);
  }

  const updated = await db.select().from(eventItems).where(eq(eventItems.id, id)).get();
  return NextResponse.json(updated);
}

export async function DELETE(request: NextRequest) {
  const body = await request.json();
  const { id, eventId } = body;

  await db.delete(eventItems).where(eq(eventItems.id, id));

  // Recalculate event totals
  if (eventId) {
    await recalculateEventTotals(eventId);
  }

  return NextResponse.json({ success: true });
}

async function recalculateEventTotals(eventId: number) {
  const items = await db.select().from(eventItems).where(eq(eventItems.eventId, eventId));

  const totalPrepared = items.reduce((sum, i) => sum + (i.prepared || 0), 0);
  const totalSold = items.reduce((sum, i) => sum + (i.sold || 0), 0);
  const totalGiveaway = items.reduce((sum, i) => sum + (i.giveaway || 0), 0);
  const totalRevenue = items.reduce((sum, i) => sum + (i.revenue || 0), 0);
  const totalCost = items.reduce((sum, i) => sum + (i.cogs || 0), 0);

  const netProfit = totalRevenue - totalCost;

  await db.update(events).set({
    totalPrepared,
    totalSold,
    totalGiveaway,
    totalRevenue,
    totalCost,
    netProfit,
  }).where(eq(events.id, eventId));
}
