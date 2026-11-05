import { PGlite } from '@electric-sql/pglite';
import { drizzle as drizzlePglite } from 'drizzle-orm/pglite';
import { migrate } from 'drizzle-orm/pglite/migrator';
import { drizzle as drizzlePostgres } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import * as schema from './schema';

let connection: Promise<ReturnType<typeof drizzlePglite<typeof schema>>> | undefined;
export function getDb() {
 if (!connection) connection = (async () => {
  const embedded = process.env.NEXUS_DB_DRIVER === 'pglite' || (!process.env.DATABASE_URL && process.env.NODE_ENV !== 'production');
  if (embedded) {
   const dataDir = process.env.NODE_ENV === 'test' ? undefined : (process.env.NEXUS_PGLITE_DATA_DIR || '.data/pglite');
   if (dataDir) await mkdir(path.dirname(path.resolve(/*turbopackIgnore: true*/ dataDir)), { recursive: true });
   const client = new PGlite(dataDir);
   const db = drizzlePglite(client, { schema });
   await migrate(db, { migrationsFolder: './drizzle' });
   return db;
  }
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is required in production');
  const client = postgres(process.env.DATABASE_URL, { max: Number(process.env.DATABASE_POOL_MAX) || 3 });
  return drizzlePostgres(client, { schema }) as unknown as ReturnType<typeof drizzlePglite<typeof schema>>;
 })().catch(error => { connection = undefined; throw error; });
 return connection;
}
