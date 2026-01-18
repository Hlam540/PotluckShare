import { Pool } from "pg";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

let schemaPromise;

export const ensureSchema = () => {
  if (!schemaPromise) {
    schemaPromise = pool.query(`
      CREATE TABLE IF NOT EXISTS events (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        categories JSONB NOT NULL DEFAULT '[]'::jsonb,
        created_at TIMESTAMPTZ NOT NULL,
        updated_at TIMESTAMPTZ NOT NULL
      )
    `);
  }
  return schemaPromise;
};

export default pool;
