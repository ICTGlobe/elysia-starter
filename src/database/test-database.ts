import * as systemSchema from "@/drizzle/schema";
import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import { migrate } from "drizzle-orm/libsql/migrator";
import path from "path";

// Global test database instance
let testDbInstance: any = null;
let testClientInstance: any = null;

/**
 * Create a test database instance with in-memory SQLite
 * This ensures test isolation and faster execution
 */
export function createTestDatabase() {
  const client = createClient({
    url: ":memory:", // In-memory SQLite database
  });

  const db = drizzle(client, {
    schema: systemSchema,
  });

  return { db, client };
}

/**
 * Initialize the test database with migrations
 * This should be called before running tests
 */
export async function initializeTestDatabase(db: any) {
  // Run migrations to set up the schema
  await migrate(db, {
    migrationsFolder: path.join(process.cwd(), "src/drizzle/migrations"),
  });
}

/**
 * Clean up all tables in the test database
 * This should be called between tests to ensure isolation
 */
export async function cleanTestDatabase(db: any) {
  try {
    // Disable foreign key constraints temporarily
    await db.run("PRAGMA foreign_keys = OFF");
    
    // Get all table names from the schema and delete in correct order
    const { users, teams, teamUser, passwordResets, teamInvitation } = systemSchema;
    
    // Delete in order to respect foreign key constraints
    await db.delete(teamUser);
    await db.delete(teamInvitation);
    await db.delete(passwordResets);
    await db.delete(teams);
    await db.delete(users);
    
    // Re-enable foreign key constraints
    await db.run("PRAGMA foreign_keys = ON");
  } catch (error) {
    console.error("Error cleaning test database:", error);
    throw error;
  }
}

/**
 * Close the test database connection
 * This should be called after all tests are complete
 */
export async function closeTestDatabase(client: any) {
  if (client) {
    await client.close();
  }
}

/**
 * Setup test database globally (for use in services)
 */
export async function setupGlobalTestDatabase() {
  if (!testDbInstance) {
    const { db, client } = createTestDatabase();
    testDbInstance = db;
    testClientInstance = client;
    await initializeTestDatabase(testDbInstance);
  }
  return testDbInstance;
}

/**
 * Get the global test database instance
 */
export function getGlobalTestDatabase() {
  if (!testDbInstance) {
    throw new Error("Test database not initialized. Call setupGlobalTestDatabase() first.");
  }
  return testDbInstance;
}

/**
 * Clean the global test database
 */
export async function cleanGlobalTestDatabase() {
  if (testDbInstance) {
    await cleanTestDatabase(testDbInstance);
  }
}

/**
 * Teardown the global test database
 */
export async function teardownGlobalTestDatabase() {
  if (testClientInstance) {
    await closeTestDatabase(testClientInstance);
    testClientInstance = null;
    testDbInstance = null;
  }
}
