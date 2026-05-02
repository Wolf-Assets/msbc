import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { flavors } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { logAudit, diffFields } from '@/db/audit';

interface CreateFlavorBody {
  name: string;
  unitPrice: number;
  unitCost?: number | null;
  isActive?: boolean;
}

interface UpdateFlavorBody {
  id: number;
  name?: string;
  unitPrice?: number;
  unitCost?: number | null;
  isActive?: boolean;
}

interface DeleteFlavorBody {
  id: number;
}

export async function GET() {
  const allFlavors = await db.select().from(flavors);
  return NextResponse.json(allFlavors);
}

export async function POST(request: NextRequest) {
  const body: CreateFlavorBody = await request.json();

  const result = await db.insert(flavors).values({
    name: body.name,
    unitPrice: body.unitPrice,
    unitCost: body.unitCost || null,
    isActive: body.isActive !== false,
  }).returning();

  const newRow = result[0];
  await logAudit({
    action: 'create',
    entityType: 'flavor',
    entityId: newRow.id,
    entityLabel: newRow.name,
    after: { ...newRow },
  });

  return NextResponse.json(newRow);
}

export async function PUT(request: NextRequest) {
  const body: UpdateFlavorBody = await request.json();
  const { id, ...updates } = body;

  const before = await db.select().from(flavors).where(eq(flavors.id, id)).get();
  await db.update(flavors).set(updates).where(eq(flavors.id, id));
  const updated = await db.select().from(flavors).where(eq(flavors.id, id)).get();

  if (before && updated) {
    await logAudit({
      action: 'update',
      entityType: 'flavor',
      entityId: id,
      entityLabel: updated.name,
      changedFields: diffFields(before as unknown as Record<string, unknown>, updated as unknown as Record<string, unknown>),
      before: { ...before },
      after: { ...updated },
    });
  }

  return NextResponse.json(updated);
}

export async function DELETE(request: NextRequest) {
  const body: DeleteFlavorBody = await request.json();
  const { id } = body;

  const before = await db.select().from(flavors).where(eq(flavors.id, id)).get();
  await db.delete(flavors).where(eq(flavors.id, id));

  if (before) {
    await logAudit({
      action: 'delete',
      entityType: 'flavor',
      entityId: id,
      entityLabel: before.name,
      before: { ...before },
    });
  }

  return NextResponse.json({ success: true });
}
