import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { flavors } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function GET() {
  const allFlavors = await db.select().from(flavors);
  return NextResponse.json(allFlavors);
}

export async function POST(request: NextRequest) {
  const body = await request.json();

  const result = await db.insert(flavors).values({
    name: body.name,
    unitPrice: body.unitPrice,
    unitCost: body.unitCost || null,
    isActive: body.isActive !== false,
  }).returning();

  return NextResponse.json(result[0]);
}

export async function PUT(request: NextRequest) {
  const body = await request.json();
  const { id, ...updates } = body;

  await db.update(flavors).set(updates).where(eq(flavors.id, id));
  const updated = await db.select().from(flavors).where(eq(flavors.id, id)).get();
  return NextResponse.json(updated);
}

export async function DELETE(request: NextRequest) {
  const body = await request.json();
  const { id } = body;

  await db.delete(flavors).where(eq(flavors.id, id));
  return NextResponse.json({ success: true });
}
