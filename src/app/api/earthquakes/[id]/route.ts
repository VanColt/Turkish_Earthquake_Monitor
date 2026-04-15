import { NextRequest, NextResponse } from 'next/server';
import { db, schema } from '@/db/client';
import { eq } from 'drizzle-orm';
import { serializeEarthquake } from '@/lib/serializeEarthquake';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const rows = await db
    .select()
    .from(schema.earthquakes)
    .where(eq(schema.earthquakes.earthquakeId, id))
    .limit(1);

  if (rows.length === 0) {
    return NextResponse.json({ status: false, error: 'Not found' }, { status: 404 });
  }

  return NextResponse.json({ status: true, result: serializeEarthquake(rows[0]) });
}
