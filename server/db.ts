import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";

// Configure WebSocket to accept self-signed certificates
if (process.env.NODE_ENV === 'production') {
  // Create custom WebSocket constructor that accepts self-signed certificates
  neonConfig.webSocketConstructor = class extends ws {
    constructor(url: string | URL, protocols?: string | string[]) {
      super(url, protocols, {
        rejectUnauthorized: false // Accept self-signed certificates
      });
    }
  };
} else {
  neonConfig.webSocketConstructor = ws;
}

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

export const pool = new Pool({ connectionString: process.env.DATABASE_URL });
export const db = drizzle({ client: pool, schema });
