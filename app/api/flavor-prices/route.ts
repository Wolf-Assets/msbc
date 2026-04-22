import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { flavorPrices, deliveryItems, deliveries, eventItems, events } from '@/db/schema';
import { eq } from 'drizzle-orm';

interface CreateFlavorPriceBody {
  flavorId: number;
  tierName: string;
  price: number;
  cost?: number | null;
}

interface UpdateFlavorPriceBody {
  id: number;
  flavorId?: number;
  tierName?: string;
  price?: number;
  cost?: number | null;
}

interface DeleteFlavorPriceBody {
  id: number;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const flavorId = searchParams.get('flavorId');

  if (flavorId) {
    const prices = await db.select().from(flavorPrices).where(eq(flavorPrices.flavorId, parseInt(flavorId)));
    return NextResponse.json(prices);
  }

  const allPrices = await db.select().from(flavorPrices);
  return NextResponse.json(allPrices);
}

export async function POST(request: NextRequest) {
  const body: CreateFlavorPriceBody = await request.json();

  const result = await db.insert(flavorPrices).values({
    flavorId: body.flavorId,
    tierName: body.tierName,
    price: body.price,
    cost: body.cost ?? null,
  }).returning();

  return NextResponse.json(result[0]);
}

export async function PUT(request: NextRequest) {
  const body: UpdateFlavorPriceBody = await request.json();
  const { id, ...updates } = body;

  // Update the rate itself
  await db.update(flavorPrices).set(updates).where(eq(flavorPrices.id, id));
  const updated = await db.select().from(flavorPrices).where(eq(flavorPrices.id, id)).get();

  if (!updated) {
    return NextResponse.json({ error: 'Rate not found' }, { status: 404 });
  }

  // Cascade: update all delivery_items linked to this rate
  if (updates.price !== undefined || updates.cost !== undefined) {
    const linkedDeliveryItems = await db.select().from(deliveryItems).where(eq(deliveryItems.rateId, id));

    for (const item of linkedDeliveryItems) {
      const newPrice = updated.price;
      const newCost = updated.cost ?? 0;
      const prepared = item.prepared ?? 0;
      const newRevenue = prepared * newPrice;
      const newCogs = prepared * newCost;
      const newProfit = newRevenue - newCogs;

      await db.update(deliveryItems).set({
        unitPrice: newPrice,
        unitCost: newCost,
        revenue: newRevenue,
        cogs: newCogs,
        profit: newProfit,
      }).where(eq(deliveryItems.id, item.id));

      // Recalculate parent delivery totals
      if (item.deliveryId) {
        await recalculateDeliveryTotals(item.deliveryId);
      }
    }

    // Cascade: update all event_items linked to this rate
    const linkedEventItems = await db.select().from(eventItems).where(eq(eventItems.rateId, id));

    for (const item of linkedEventItems) {
      const newCost = updated.cost ?? 0;
      const sold = item.sold ?? 0;
      const newRevenue = sold * updated.price;
      const newCogs = sold * newCost;
      const newProfit = newRevenue - newCogs;

      await db.update(eventItems).set({
        unitCost: newCost,
        revenue: newRevenue,
        cogs: newCogs,
        profit: newProfit,
      }).where(eq(eventItems.id, item.id));

      // Recalculate parent event totals
      if (item.eventId) {
        await recalculateEventTotals(item.eventId);
      }
    }
  }

  return NextResponse.json(updated);
}

export async function DELETE(request: NextRequest) {
  const body: DeleteFlavorPriceBody = await request.json();
  const { id } = body;

  // Unlink items before deleting the rate
  await db.update(deliveryItems).set({ rateId: null }).where(eq(deliveryItems.rateId, id));
  await db.update(eventItems).set({ rateId: null }).where(eq(eventItems.rateId, id));

  await db.delete(flavorPrices).where(eq(flavorPrices.id, id));
  return NextResponse.json({ success: true });
}

async function recalculateDeliveryTotals(deliveryId: number) {
  const items = await db.select().from(deliveryItems).where(eq(deliveryItems.deliveryId, deliveryId));
  const totalPrepared = items.reduce((sum: number, i) => sum + (i.prepared ?? 0), 0);
  const totalCogs = items.reduce((sum: number, i) => sum + (i.cogs ?? 0), 0);
  const totalRevenue = items.reduce((sum: number, i) => sum + (i.revenue ?? 0), 0);
  const grossProfit = totalRevenue - totalCogs;
  const profitMargin = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;

  await db.update(deliveries).set({
    totalPrepared,
    totalCogs,
    totalRevenue,
    grossProfit,
    profitMargin,
  }).where(eq(deliveries.id, deliveryId));
}

async function recalculateEventTotals(eventId: number) {
  const items = await db.select().from(eventItems).where(eq(eventItems.eventId, eventId));
  const totalPrepared = items.reduce((sum: number, i) => sum + (i.prepared ?? 0), 0);
  const totalSold = items.reduce((sum: number, i) => sum + (i.sold ?? 0), 0);
  const totalGiveaway = items.reduce((sum: number, i) => sum + (i.giveaway ?? 0), 0);
  const totalRevenue = items.reduce((sum: number, i) => sum + (i.revenue ?? 0), 0);
  const totalCost = items.reduce((sum: number, i) => sum + (i.cogs ?? 0), 0);
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
