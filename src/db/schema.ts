import { sqliteTable, text, real, integer, index } from 'drizzle-orm/sqlite-core';

export const earthquakes = sqliteTable(
  'earthquakes',
  {
    earthquakeId: text('earthquake_id').primaryKey(),
    provider: text('provider').notNull(),
    title: text('title').notNull(),
    mag: real('mag').notNull(),
    depth: real('depth').notNull(),
    lat: real('lat').notNull(),
    lng: real('lng').notNull(),
    dateTime: text('date_time').notNull(),
    createdAt: integer('created_at').notNull(),
    locationTz: text('location_tz'),
    rev: text('rev'),
    closestCityCode: integer('closest_city_code'),
    closestCityName: text('closest_city_name'),
    closestCityDistance: real('closest_city_distance'),
    epiCenterCode: integer('epi_center_code'),
    epiCenterName: text('epi_center_name'),
    raw: text('raw', { mode: 'json' }).notNull(),
    ingestedAt: integer('ingested_at').notNull(),
  },
  (t) => [
    index('idx_earthquakes_date_time').on(t.dateTime),
    index('idx_earthquakes_mag').on(t.mag),
    index('idx_earthquakes_closest_city_code').on(t.closestCityCode),
  ]
);

export const feltReports = sqliteTable(
  'felt_reports',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    earthquakeId: text('earthquake_id')
      .notNull()
      .references(() => earthquakes.earthquakeId, { onDelete: 'cascade' }),
    intensity: integer('intensity').notNull(),
    lat: real('lat'),
    lng: real('lng'),
    ipHash: text('ip_hash').notNull(),
    userAgent: text('user_agent'),
    createdAt: integer('created_at').notNull(),
  },
  (t) => [
    index('idx_felt_reports_earthquake').on(t.earthquakeId),
    index('idx_felt_reports_ip_created').on(t.ipHash, t.createdAt),
  ]
);

export const pushSubscriptions = sqliteTable(
  'push_subscriptions',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    endpoint: text('endpoint').notNull().unique(),
    p256dh: text('p256dh').notNull(),
    auth: text('auth').notNull(),
    minMagnitude: real('min_magnitude').notNull().default(4),
    centerLat: real('center_lat'),
    centerLng: real('center_lng'),
    radiusKm: real('radius_km'),
    locale: text('locale').notNull().default('en'),
    createdAt: integer('created_at').notNull(),
    lastNotifiedAt: integer('last_notified_at'),
  },
  (t) => [index('idx_push_subs_endpoint').on(t.endpoint)]
);

export type Earthquake = typeof earthquakes.$inferSelect;
export type NewEarthquake = typeof earthquakes.$inferInsert;
export type FeltReport = typeof feltReports.$inferSelect;
export type PushSubscription = typeof pushSubscriptions.$inferSelect;
