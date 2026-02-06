import { d as db, f as flavors } from '../../chunks/index_D6rbc0Ls.mjs';
import { eq } from 'drizzle-orm';
export { renderers } from '../../renderers.mjs';

const GET = async () => {
  try {
    const allFlavors = await db.select().from(flavors);
    return new Response(JSON.stringify(allFlavors), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error("Failed to fetch flavors:", error);
    return new Response(JSON.stringify({ error: "Failed to fetch flavors" }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
};
const POST = async ({ request }) => {
  try {
    const body = await request.json();
    const newFlavor = {
      name: body.name,
      unitPrice: body.unitPrice,
      unitCost: body.unitCost ?? null
    };
    const result = await db.insert(flavors).values(newFlavor).returning();
    return new Response(JSON.stringify(result[0]), {
      status: 201,
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error("Failed to create flavor:", error);
    return new Response(JSON.stringify({ error: "Failed to create flavor" }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
};
const PUT = async ({ request }) => {
  try {
    const body = await request.json();
    const { id, ...updates } = body;
    await db.update(flavors).set(updates).where(eq(flavors.id, id));
    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error("Failed to update flavor:", error);
    return new Response(JSON.stringify({ error: "Failed to update flavor" }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
};
const DELETE = async ({ request }) => {
  try {
    const body = await request.json();
    await db.delete(flavors).where(eq(flavors.id, body.id));
    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error("Failed to delete flavor:", error);
    return new Response(JSON.stringify({ error: "Failed to delete flavor" }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
};

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  DELETE,
  GET,
  POST,
  PUT
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
