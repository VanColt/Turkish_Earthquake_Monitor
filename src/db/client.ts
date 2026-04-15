import { drizzle, LibSQLDatabase } from 'drizzle-orm/libsql';
import { createClient } from '@libsql/client';
import * as schema from './schema';

export { schema };

type DB = LibSQLDatabase<typeof schema>;

let cached: DB | null = null;

function getDb(): DB {
  if (cached) return cached;

  const url =
    process.env.kandilli_TURSO_DATABASE_URL ?? process.env.TURSO_DATABASE_URL;
  const authToken =
    process.env.kandilli_TURSO_AUTH_TOKEN ?? process.env.TURSO_AUTH_TOKEN;

  if (!url) {
    throw new Error('Turso database URL is not set (kandilli_TURSO_DATABASE_URL)');
  }

  const client = createClient({ url, authToken });
  cached = drizzle(client, { schema });
  return cached;
}

export const db = new Proxy({} as DB, {
  get(_target, prop) {
    const instance = getDb();
    const value = (instance as unknown as Record<string | symbol, unknown>)[prop as string];
    return typeof value === 'function' ? value.bind(instance) : value;
  },
});
