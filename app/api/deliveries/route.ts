import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { deliveries, deliveryItems } from '@/db/schema';
import { eq, desc, isNull, isNotNull } from 'drizzle-orm';

function calculateExpirationDate(datePrepared: string): string {
  const date = new Date(datePrepared + 'T00:00:00');
  date.setDate(date.getDate() + 7);
  return date.toISOString().split('T')[0];
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (id) {
    const delivery = await db.select().from(deliveries).where(eq(deliveries.id, parseInt(id))).get();
    if (!delivery) {
      return NextResponse.json({ error: 'Delivery not found' }, { status: 404 });
    }
    const items = await db.select().from(deliveryItems).where(eq(deliveryItems.deliveryId, parseInt(id)));
    return NextResponse.json({ ...delivery, items });
  }

  // Get archived or active deliveries
  const archived = searchParams.get('archived');
  if (archived === 'true') {
    const archivedDeliveries = await db.select().from(deliveries).where(isNotNull(deliveries.deletedAt)).orderBy(desc(deliveries.datePrepared));
    return NextResponse.json(archivedDeliveries);
  }

  const allDeliveries = await db.select().from(deliveries).where(isNull(deliveries.deletedAt)).orderBy(desc(deliveries.datePrepared));
  return NextResponse.json(allDeliveries);
}

export async function POST(request: NextRequest) {
  const body = await request.json();

  const expirationDate = body.datePrepared ? calculateExpirationDate(body.datePrepared) : null;

  const result = await db.insert(deliveries).values({
    storeName: body.storeName,
    datePrepared: body.datePrepared,
    dropoffDate: body.dropoffDate || null,
    expirationDate,
    totalPrepared: body.totalPrepared || 0,
    totalCogs: body.totalCogs || 0,
    totalRevenue: body.totalRevenue || 0,
    grossProfit: body.grossProfit || 0,
    profitMargin: body.profitMargin || 0,
    notes: body.notes || null,
  }).returning();

  return NextResponse.json(result[0]);
}

export async function PUT(request: NextRequest) {
  const body = await request.json();
  const { id, ...updates } = body;

  // Recalculate expiration date if datePrepared changed
  if (updates.datePrepared) {
    updates.expirationDate = calculateExpirationDate(updates.datePrepared);
  }

  await db.update(deliveries).set(updates).where(eq(deliveries.id, id));
  const updated = await db.select().from(deliveries).where(eq(deliveries.id, id)).get();
  return NextResponse.json(updated);
}

export async function DELETE(request: NextRequest) {
  const body = await request.json();
  const { id, hard } = body;

  if (hard) {
    // Hard delete — permanently remove from database
    await db.delete(deliveryItems).where(eq(deliveryItems.deliveryId, id));
    await db.delete(deliveries).where(eq(deliveries.id, id));
  } else {
    // Soft delete — set deletedAt timestamp
    await db.update(deliveries).set({
      deletedAt: new Date().toISOString(),
    }).where(eq(deliveries.id, id));
  }

  return NextResponse.json({ success: true });
}
