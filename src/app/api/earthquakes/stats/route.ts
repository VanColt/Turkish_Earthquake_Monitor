import { NextRequest, NextResponse } from 'next/server';
import { db, schema } from '@/db/client';
import { and, gte, lte, sql, SQL } from 'drizzle-orm';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const params = req.nextUrl.searchParams;
  const startDate = params.get('start_date');
  const endDate = params.get('end_date');

  const conds: SQL[] = [];
  if (startDate) conds.push(gte(schema.earthquakes.dateTime, startDate));
  if (endDate) conds.push(lte(schema.earthquakes.dateTime, endDate));
  const where = conds.length ? and(...conds) : undefined;

  const [agg] = await db
    .select({
      total: sql<number>`count(*)`,
      avg_magnitude: sql<number>`avg(mag)`,
      avg_depth: sql<number>`avg(depth)`,
      max_magnitude: sql<number>`max(mag)`,
      min_magnitude: sql<number>`min(mag)`,
      max_depth: sql<number>`max(depth)`,
      min_depth: sql<number>`min(depth)`,
    })
    .from(schema.earthquakes)
    .where(where);

  const cityRows = await db
    .select({
      city: schema.earthquakes.closestCityName,
      count: sql<number>`count(*)`,
    })
    .from(schema.earthquakes)
    .where(where)
    .groupBy(schema.earthquakes.closestCityName);

  const cities: Record<string, number> = {};
  for (const r of cityRows) {
    if (r.city) cities[r.city] = Number(r.count);
  }

  return NextResponse.json({
    status: true,
    result: {
      total: Number(agg?.total ?? 0),
      avg_magnitude: Number(agg?.avg_magnitude ?? 0),
      avg_depth: Number(agg?.avg_depth ?? 0),
      max_magnitude: Number(agg?.max_magnitude ?? 0),
      min_magnitude: Number(agg?.min_magnitude ?? 0),
      max_depth: Number(agg?.max_depth ?? 0),
      min_depth: Number(agg?.min_depth ?? 0),
      cities,
    },
  });
}
