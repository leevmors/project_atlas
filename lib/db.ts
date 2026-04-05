import { Pool } from 'pg';

let pool: Pool;

if (process.env.DATABASE_URL) {
  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
  });
  pool.on('error', (err) => {
    console.error('[Atlas] Unexpected pool error:', err.message);
  });
} else {
  console.warn('[Atlas] DATABASE_URL is not set — all database queries will return errors.');
  pool = new Proxy({} as Pool, {
    get(_, prop) {
      if (prop === 'query') {
        return () => Promise.reject(new Error('DATABASE_URL is not configured'));
      }
      if (prop === 'on' || prop === 'end') {
        return () => {};
      }
      return undefined;
    },
  });
}

export { pool };
