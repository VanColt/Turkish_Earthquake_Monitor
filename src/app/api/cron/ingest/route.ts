import { NextRequest, NextResponse } from 'next/server';
import { db, schema } from '@/db/client';
import { fetchKandilliLive } from '@/lib/kandilli';
import { sql } from 'drizzle-orm';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

function isAuthorized(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return true;
  const auth = req.headers.get('authorization');
  if (auth === `Bearer ${secret}`) return true;
  if (req.nextUrl.searchParams.get('secret') === secret) return true;
  return false;
}

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const started = Date.now();

  try {
    const items = await fetchKandilliLive(500);
    const now = Math.floor(Date.now() / 1000);

    const rows = items.map((e) => ({
      earthquakeId: e.earthquake_id,
      provider: e.provider,
      title: e.title,
      mag: e.mag,
      depth: e.depth,
      lng: e.geojson.coordinates[0],
      lat: e.geojson.coordinates[1],
      dateTime: e.date_time,
      createdAt: e.created_at,
      locationTz: e.location_tz ?? null,
      rev: e.rev ?? null,
      closestCityCode: e.location_properties?.closestCity?.cityCode ?? null,
      closestCityName: e.location_properties?.closestCity?.name ?? null,
      closestCityDistance: e.location_properties?.closestCity?.distance ?? null,
      epiCenterCode: e.location_properties?.epiCenter?.cityCode ?? null,
      epiCenterName: e.location_properties?.epiCenter?.name ?? null,
      raw: e,
      ingestedAt: now,
    }));

    let inserted = 0;
    for (const row of rows) {
      const result = await db
        .insert(schema.earthquakes)
        .values(row)
        .onConflictDoUpdate({
          target: schema.earthquakes.earthquakeId,
          set: {
            title: row.title,
            mag: row.mag,
            depth: row.depth,
            lat: row.lat,
            lng: row.lng,
            dateTime: row.dateTime,
            rev: row.rev,
            raw: row.raw,
            ingestedAt: row.ingestedAt,
          },
          setWhere: sql`${schema.earthquakes.rev} IS NOT ${row.rev}`,
        })
        .returning({ id: schema.earthquakes.earthquakeId });
      if (result.length > 0) inserted++;
    }

    return NextResponse.json({
      ok: true,
      fetched: items.length,
      upserted: inserted,
      durationMs: Date.now() - started,
    });
  } catch (err) {
    console.error('Ingestion failed:', err);
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
