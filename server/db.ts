import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";

// Configure Neon to use the WebSocket constructor
neonConfig.webSocketConstructor = ws;

// Add additional configurations for better connection handling
neonConfig.useSecureWebSocket = true;
neonConfig.pipelineTLS = true;
neonConfig.pipelineConnect = true;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// Configure the connection pool with improved settings
export const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL,
  max: 10, // Maximum number of connections in the pool
  idleTimeoutMillis: 30000, // Close idle connections after 30 seconds
  connectionTimeoutMillis: 10000, // Try to connect for up to 10 seconds
  maxUses: 7500 // Close a connection after it's been used 7500 times (prevents memory issues)
});

// Add event listeners for connection issues
pool.on('error', (err) => {
  console.error('Unexpected database pool error:', err);
});

// Create the drizzle ORM instance
export const db = drizzle({ client: pool, schema });

// Export a function to test the database connection
export async function testDatabaseConnection() {
  let testConnection;
  try {
    // Get a client from the pool
    testConnection = await pool.connect();
    console.log('Database connection successful');
    return true;
  } catch (error) {
    console.error('Database connection test failed:', error);
    return false;
  } finally {
    // Release the client back to the pool
    if (testConnection) testConnection.release();
  }
}