import { test, expect } from 'bun:test';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

test('bootstraps a persistent PGlite database when its parent directory is missing', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'nexus-db-startup-'));
  try {
    const child = Bun.spawn([process.execPath, '-e', `
      import { getDb } from './src/db/index.ts';
      import { collegeRegistrations } from './src/db/schema.ts';
      const db = await getDb();
      await db.select().from(collegeRegistrations).limit(1);
      process.exit(0);
    `], {
      cwd: process.cwd(),
      env: { PATH: process.env.PATH, NODE_ENV: 'development', NEXUS_DB_DRIVER: 'pglite', NEXUS_PGLITE_DATA_DIR: join(directory, 'missing-parent', 'pglite'), DATABASE_URL: '' },
      stdout: 'pipe', stderr: 'pipe',
    });
    const [exitCode, stderr] = await Promise.all([child.exited, new Response(child.stderr).text()]);
    expect({ exitCode, stderr }).toEqual({ exitCode: 0, stderr: '' });
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
}, 30_000);
