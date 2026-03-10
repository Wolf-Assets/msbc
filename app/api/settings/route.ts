import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { settings } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  const key = request.nextUrl.searchParams.get('key');
  if (!key) return NextResponse.json({ value: null });
  const rows = await db.select().from(settings).where(eq(settings.key, key));
  return NextResponse.json({ value: rows[0]?.value ?? null });
}

export async function POST(request: NextRequest) {
  const { key, value } = await request.json();
  await db.insert(settings).values({ key, value }).onConflictDoUpdate({
    target: settings.key,
    set: { value },
  });
  return NextResponse.json({ ok: true });
}
