import { Pool } from 'pg';

function createPool(): Pool {
  if (!process.env.DATABASE_URL) {
    console.warn('[Atlas] DATABASE_URL is not set — database queries will fail gracefully.');
    // Return a pool that will throw on query, caught by route-level try/catch
    return new Pool({ connectionString: 'postgresql://invalid' });
  }
  return new Pool({ connectionString: process.env.DATABASE_URL });
}

const pool = createPool();

export { pool };
