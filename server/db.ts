import * as schema from "@shared/schema";
import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?"
  );
}

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // Connection pool configuration for better reliability
  max: 20, // Maximum connections in pool
  idleTimeoutMillis: 30000, // Close idle connections after 30 seconds
  connectionTimeoutMillis: 10000, // Timeout for acquiring connection
});

// Handle pool-level errors to prevent app crashes
pool.on('error', (err, client) => {
  console.error('Unexpected database pool error:', err);
  // Don't throw - just log the error and let the pool handle reconnection
});

// Handle connection errors gracefully
pool.on('connect', (client) => {
  client.on('error', (err) => {
    console.error('Database client error:', err);
    // Connection will be removed from pool automatically
  });
});

export const db = drizzle(pool, { schema });
