import type { APIRoute } from 'astro';
import { db } from '../../db';
import { flavors } from '../../db/schema';
import type { NewFlavor } from '../../db/schema';
import { eq } from 'drizzle-orm';

// Request body types for API operations
interface CreateFlavorRequest {
  name: string;
  unitPrice: number;
  unitCost?: number | null;
}

interface UpdateFlavorRequest {
  id: number;
  name?: string;
  unitPrice?: number;
  unitCost?: number | null;
  isActive?: boolean;
}

interface DeleteFlavorRequest {
  id: number;
}

export const GET: APIRoute = async () => {
  try {
    const allFlavors = await db.select().from(flavors);
    return new Response(JSON.stringify(allFlavors), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Failed to fetch flavors:', error);
    return new Response(JSON.stringify({ error: 'Failed to fetch flavors' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

export const POST: APIRoute = async ({ request }) => {
  try {
    const body: CreateFlavorRequest = await request.json();

    const newFlavor: NewFlavor = {
      name: body.name,
      unitPrice: body.unitPrice,
      unitCost: body.unitCost ?? null,
    };

    const result = await db.insert(flavors).values(newFlavor).returning();

    return new Response(JSON.stringify(result[0]), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Failed to create flavor:', error);
    return new Response(JSON.stringify({ error: 'Failed to create flavor' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

export const PUT: APIRoute = async ({ request }) => {
  try {
    const body: UpdateFlavorRequest = await request.json();
    const { id, ...updates } = body;

    await db.update(flavors).set(updates).where(eq(flavors.id, id));

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Failed to update flavor:', error);
    return new Response(JSON.stringify({ error: 'Failed to update flavor' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

export const DELETE: APIRoute = async ({ request }) => {
  try {
    const body: DeleteFlavorRequest = await request.json();
    await db.delete(flavors).where(eq(flavors.id, body.id));

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Failed to delete flavor:', error);
    return new Response(JSON.stringify({ error: 'Failed to delete flavor' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
