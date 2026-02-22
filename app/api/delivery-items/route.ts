import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { deliveryItems, deliveries } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const deliveryId = searchParams.get('deliveryId');

  if (deliveryId) {
    const items = await db.select().from(deliveryItems).where(eq(deliveryItems.deliveryId, parseInt(deliveryId)));
    return NextResponse.json(items);
  }

  const allItems = await db.select().from(deliveryItems);
  return NextResponse.json(allItems);
}

export async function POST(request: NextRequest) {
  const body = await request.json();

  const result = await db.insert(deliveryItems).values({
    deliveryId: body.deliveryId,
    flavorName: body.flavorName,
    prepared: body.prepared || 0,
    unitPrice: body.unitPrice || null,
    unitCost: body.unitCost || null,
    revenue: body.revenue || 0,
    cogs: body.cogs || 0,
    profit: body.profit || 0,
  }).returning();

  await recalculateDeliveryTotals(body.deliveryId);

  return NextResponse.json(result[0]);
}

export async function PUT(request: NextRequest) {
  const body = await request.json();
  const { id, deliveryId, ...updates } = body;

  await db.update(deliveryItems).set(updates).where(eq(deliveryItems.id, id));

  if (deliveryId) {
    await recalculateDeliveryTotals(deliveryId);
  }

  const updated = await db.select().from(deliveryItems).where(eq(deliveryItems.id, id)).get();
  return NextResponse.json(updated);
}

export async function DELETE(request: NextRequest) {
  const body = await request.json();
  const { id, deliveryId } = body;

  await db.delete(deliveryItems).where(eq(deliveryItems.id, id));

  if (deliveryId) {
    await recalculateDeliveryTotals(deliveryId);
  }

  return NextResponse.json({ success: true });
}

async function recalculateDeliveryTotals(deliveryId: number) {
  const items = await db.select().from(deliveryItems).where(eq(deliveryItems.deliveryId, deliveryId));

  const totalPrepared = items.reduce((sum, i) => sum + (i.prepared || 0), 0);
  const totalCogs = items.reduce((sum, i) => sum + (i.cogs || 0), 0);
  const totalRevenue = items.reduce((sum, i) => sum + (i.revenue || 0), 0);
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
