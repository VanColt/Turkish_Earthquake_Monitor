import type { Config } from 'drizzle-kit';
import { config } from 'dotenv';

config({ path: '.env.development.local' });
config({ path: '.env.local' });

const url =
  process.env.kandilli_TURSO_DATABASE_URL ?? process.env.TURSO_DATABASE_URL;
const authToken =
  process.env.kandilli_TURSO_AUTH_TOKEN ?? process.env.TURSO_AUTH_TOKEN;

if (!url) {
  throw new Error('Turso database URL is not set');
}

export default {
  schema: './src/db/schema.ts',
  out: './drizzle',
  dialect: 'turso',
  dbCredentials: { url, authToken },
} satisfies Config;
