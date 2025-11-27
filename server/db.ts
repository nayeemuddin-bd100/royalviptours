import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";

// Configure WebSocket to accept self-signed certificates in production
neonConfig.webSocketConstructor = ws;
neonConfig.wsProxy = (host) => `${host}?sslmode=require`;
neonConfig.useSecureWebSocket = true;
neonConfig.pipelineTLS = false;
neonConfig.pipelineConnect = false;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// Configure connection pool with SSL settings for self-signed certificates
const connectionConfig = {
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? {
    rejectUnauthorized: false // Accept self-signed certificates
  } : undefined
};

export const pool = new Pool(connectionConfig);
export const db = drizzle({ client: pool, schema });
