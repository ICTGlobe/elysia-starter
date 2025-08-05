# In-Memory SQLite Database for Testing

This guide explains how to use in-memory SQLite databases for testing in your Elysia application.

## Benefits

- **Faster Tests**: In-memory databases are much faster than file-based databases
- **Test Isolation**: Each test suite gets a fresh database, preventing test interference
- **No Cleanup Required**: Database is automatically destroyed when tests complete
- **No File Artifacts**: No test database files left on disk

## Setup

The in-memory database setup is already configured in this project:

### Files Added:

1. `src/database/test-database.ts` - In-memory database utilities
2. `tests/utils/test-database-setup.ts` - Test setup utility
3. Updated `src/database/index.ts` - Database proxy for test/production switching
4. Updated `package.json` - Test scripts with environment variables

## Usage

### Method 1: Using `useTestDatabase()` Hook (Recommended)

```typescript
import { describe, expect, it, beforeAll } from "bun:test";
import { database } from "@/database";
import { users } from "@/drizzle/schema/users";
import AuthService from "@/services/auth-service";
import { useTestDatabase } from "../utils/test-database-setup";

describe("AuthService", () => {
  let authService: AuthService;
  
  // Use the test database setup utility
  useTestDatabase();
  
  const testUser = {
    name: "Test User",
    email: "test@example.com",
    password: "password123"
  };

  beforeAll(() => {
    authService = new AuthService();
  });

  // Database cleanup is automatically handled by useTestDatabase()

  it("successfully creates a new user", async () => {
    const result = await authService.signup(testUser);
    expect(result.email).toBe(testUser.email);
  });

  it("throws error when email already exists", async () => {
    // Create a user first
    await authService.signup(testUser);
    
    // Try to create another user with the same email
    await expect(authService.signup(testUser)).rejects.toThrow("Email address already in use");
  });
});
```

### Method 2: Manual Setup

```typescript
import { describe, expect, it, beforeAll, afterAll, beforeEach } from "bun:test";
import { database } from "@/database";
import { setupTestDatabase, teardownTestDatabase, cleanupTestDatabase } from "../utils/test-database-setup";

describe("MyService", () => {
  beforeAll(async () => {
    await setupTestDatabase();
  });

  afterAll(async () => {
    await teardownTestDatabase();
  });

  beforeEach(async () => {
    await cleanupTestDatabase();
  });

  // Your tests here...
});
```

## Running Tests

Use the provided npm scripts which set the proper environment variables:

```bash
# Run all tests with in-memory database
npm run test

# Run only unit tests
npm run test:unit

# Run only feature tests  
npm run test:feature
```

Or set environment variables manually:

```bash
# Windows PowerShell
$env:NODE_ENV="test"; $env:BUN_ENV="test"; bun test

# Linux/macOS
NODE_ENV=test BUN_ENV=test bun test
```

## What `useTestDatabase()` Does

1. **Before All Tests**: Creates an in-memory SQLite database and runs migrations
2. **Before Each Test**: Cleans all tables (deletes all data)
3. **After All Tests**: Closes the database connection

## Database Cleaning Strategy

The database cleanup follows proper foreign key constraint order:

```typescript
// Delete in order to respect foreign key constraints
await db.delete(teamUser);
await db.delete(teamInvitation);
await db.delete(passwordResets);
await db.delete(teams);
await db.delete(users);
```

## Migrating Existing Tests

### Before (File-based Database)
```typescript
describe("UserService", () => {
  let userId: string;

  beforeAll(async () => {
    // Create test data
    const [user] = await database.insert(users).values(testUser).returning();
    userId = user.id;
  });

  afterAll(async () => {
    // Manual cleanup
    await database.delete(users).where(eq(users.id, userId));
  });

  it("gets user by id", async () => {
    const user = await userService.getUserById(userId);
    expect(user.id).toBe(userId);
  });
});
```

### After (In-memory Database)
```typescript
describe("UserService", () => {
  // Use the test database setup utility
  useTestDatabase();

  // Helper function to create test data in each test
  async function createTestUser() {
    const [user] = await database.insert(users).values(testUser).returning();
    return user;
  }

  it("gets user by id", async () => {
    const createdUser = await createTestUser();
    const user = await userService.getUserById(createdUser.id);
    expect(user.id).toBe(createdUser.id);
  });
});
```

## Key Changes When Migrating

1. **Add `useTestDatabase()`** at the top of your describe block
2. **Remove manual cleanup code** (beforeEach/afterAll database deletes)
3. **Create test data in each test** instead of beforeAll hooks
4. **Remove unique ID generation** - no longer needed since database is cleaned between tests

## Example: Fully Migrated Test

See `tests/unit/auth-service.test.ts` for a complete example of a test file using the in-memory database pattern.

## Troubleshooting

### Test Database Not Initialized
Make sure you're running tests with the proper environment variables:
```bash
NODE_ENV=test BUN_ENV=test bun test
```

### Foreign Key Constraint Errors
The cleanup function handles foreign key constraints automatically. If you see constraint errors, check that all tables are included in the cleanup function in `src/database/test-database.ts`.

### Slow Tests
In-memory databases should be much faster. If tests are still slow, check that you're not accidentally using the file database by ensuring environment variables are set correctly.
