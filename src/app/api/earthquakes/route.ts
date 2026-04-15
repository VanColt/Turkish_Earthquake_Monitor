import { NextRequest, NextResponse } from 'next/server';
import { db, schema } from '@/db/client';
import { and, desc, eq, gte, lte, sql, SQL } from 'drizzle-orm';
import { serializeEarthquake } from '@/lib/serializeEarthquake';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const MAX_LIMIT = 500;

export async function GET(req: NextRequest) {
  const params = req.nextUrl.searchParams;

  const limit = Math.min(
    Math.max(parseInt(params.get('limit') ?? '100', 10) || 100, 1),
    MAX_LIMIT
  );
  const offset = Math.max(parseInt(params.get('offset') ?? '0', 10) || 0, 0);

  const minMag = params.get('min_mag');
  const maxMag = params.get('max_mag');
  const startDate = params.get('start_date');
  const endDate = params.get('end_date');
  const cityCode = params.get('city_code');

  const conds: SQL[] = [];
  if (minMag) conds.push(gte(schema.earthquakes.mag, parseFloat(minMag)));
  if (maxMag) conds.push(lte(schema.earthquakes.mag, parseFloat(maxMag)));
  if (startDate) conds.push(gte(schema.earthquakes.dateTime, startDate));
  if (endDate) conds.push(lte(schema.earthquakes.dateTime, endDate));
  if (cityCode) {
    conds.push(eq(schema.earthquakes.closestCityCode, parseInt(cityCode, 10)));
  }

  const where = conds.length ? and(...conds) : undefined;

  const rows = await db
    .select()
    .from(schema.earthquakes)
    .where(where)
    .orderBy(desc(schema.earthquakes.dateTime))
    .limit(limit)
    .offset(offset);

  const totalRow = await db
    .select({ count: sql<number>`count(*)` })
    .from(schema.earthquakes)
    .where(where);

  return NextResponse.json({
    status: true,
    metadata: {
      count: Number(totalRow[0]?.count ?? 0),
      limit,
      offset,
    },
    result: rows.map(serializeEarthquake),
  });
}
