import 'dotenv/config';
import { config } from 'dotenv';
config({ path: '.env.development.local' });

import { createClient } from '@libsql/client';

const url =
  process.env.kandilli_TURSO_DATABASE_URL ?? process.env.TURSO_DATABASE_URL!;
const authToken =
  process.env.kandilli_TURSO_AUTH_TOKEN ?? process.env.TURSO_AUTH_TOKEN;

const client = createClient({ url, authToken });

async function main() {
  const result = await client.execute(
    "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name"
  );
  console.log('Tables:', result.rows.map((r) => r.name));
}

main();
