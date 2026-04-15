import { NextResponse } from 'next/server';
import { db, schema } from '@/db/client';
import { desc } from 'drizzle-orm';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const [row] = await db
    .select({
      earthquakeId: schema.earthquakes.earthquakeId,
      dateTime: schema.earthquakes.dateTime,
      ingestedAt: schema.earthquakes.ingestedAt,
    })
    .from(schema.earthquakes)
    .orderBy(desc(schema.earthquakes.ingestedAt))
    .limit(1);

  return NextResponse.json({
    status: true,
    latest: row
      ? {
          earthquake_id: row.earthquakeId,
          date_time: row.dateTime,
          ingested_at: row.ingestedAt,
        }
      : null,
  });
}
