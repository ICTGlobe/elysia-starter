import { describe, expect, it, beforeAll, afterAll, beforeEach } from "bun:test";
import { database } from "@/database";
import { users } from "@/drizzle/schema/users";
import { teams } from "@/drizzle/schema/teams";
import { teamUser } from "@/drizzle/schema/teamUser";
import AuthService from "@/services/auth-service";
import * as argon2 from "argon2";
import * as jwt from "jsonwebtoken";
import { eq } from "drizzle-orm";

// Set up test environment
process.env.JWT_SECRET = "test-secret-key";
process.env.JWT_MAX_AGE = "1 day";

describe("AuthService", () => {
  let authService: AuthService;
  
  const testUser = {
    name: "Test User",
    email: "authservice@example.com",
    password: "hashedPassword123"
  };

  beforeAll(() => {
    authService = new AuthService();
  });

  beforeEach(async () => {
    await cleanupTestData();
  });

  afterAll(async () => {
    await cleanupTestData();
  });

  async function cleanupTestData() {
    try {
      // Clean up in correct order due to foreign key constraints
      await database.delete(teamUser).execute();
      await database.delete(teams).execute();
      await database.delete(users).where(eq(users.email, testUser.email)).execute();
    } catch (error) {
      // Ignore cleanup errors in case data doesn't exist
    }
  }

  describe("signup", () => {
    it("successfully creates a new user", async () => {
      const newUser = await authService.signup(testUser);

      expect(newUser).toHaveProperty("id");
      expect(newUser.name).toBe(testUser.name);
      expect(newUser.email).toBe(testUser.email);
      expect(newUser.password).toBe(testUser.password);
      
      // Verify user was created in database
      const dbUser = await database
        .select()
        .from(users)
        .where(eq(users.email, testUser.email))
        .limit(1)
        .get();
      
      expect(dbUser).toBeTruthy();
      expect(dbUser!.id).toBe(newUser.id);
    });

    it("throws error when email already exists", async () => {
      // Create user first
      await authService.signup(testUser);

      // Try to create user with same email
      await expect(authService.signup(testUser)).rejects.toThrow("Email address already in use");
    });

    it("throws descriptive error for invalid user data", async () => {
      await expect(authService.signup(null as any)).rejects.toThrow("User data is required");
      await expect(authService.signup(undefined as any)).rejects.toThrow("User data is required");
    });

    it("validates required email field", async () => {
      await expect(authService.signup({ ...testUser, email: null as any })).rejects.toThrow("Email is required");
      await expect(authService.signup({ ...testUser, email: undefined as any })).rejects.toThrow("Email is required");
      await expect(authService.signup({ ...testUser, email: "" })).rejects.toThrow("Email is required");
      await expect(authService.signup({ ...testUser, email: "   " })).rejects.toThrow("Email is required");
    });

    it("validates required name field", async () => {
      await expect(authService.signup({ ...testUser, name: null as any })).rejects.toThrow("Name is required");
      await expect(authService.signup({ ...testUser, name: undefined as any })).rejects.toThrow("Name is required");
      await expect(authService.signup({ ...testUser, name: "" })).rejects.toThrow("Name is required");
      await expect(authService.signup({ ...testUser, name: "   " })).rejects.toThrow("Name is required");
    });

    it("validates required password field", async () => {
      await expect(authService.signup({ ...testUser, password: null as any })).rejects.toThrow("Password is required");
      await expect(authService.signup({ ...testUser, password: undefined as any })).rejects.toThrow("Password is required");
      await expect(authService.signup({ ...testUser, password: "" })).rejects.toThrow("Password is required");
      await expect(authService.signup({ ...testUser, password: "   " })).rejects.toThrow("Password is required");
    });

    it("validates email format", async () => {
      await expect(authService.signup({ ...testUser, email: "invalid-email" })).rejects.toThrow("Invalid email format");
      await expect(authService.signup({ ...testUser, email: "test@" })).rejects.toThrow("Invalid email format");
      await expect(authService.signup({ ...testUser, email: "@example.com" })).rejects.toThrow("Invalid email format");
      await expect(authService.signup({ ...testUser, email: "test@example" })).rejects.toThrow("Invalid email format");
    });

    it("accepts valid email formats", async () => {
      // Clean up any existing users first
      await database.delete(users);

      const validEmails = [
        "test-unique1@example.com",
        "user.name-unique2@domain.co.uk",
        "test+tag-unique3@example.org",
        "123-unique4@456.com"
      ];

      for (let i = 0; i < validEmails.length; i++) {
        const email = validEmails[i];
        const userData = { ...testUser, email, name: `User ${i}` };
        const result = await authService.signup(userData);
        expect(result.email).toBe(email);
      }
    });
  });

  describe("deleteUser", () => {
    it("successfully deletes a user", async () => {
      // Create user first
      const newUser = await authService.signup(testUser);

      // Delete the user
      await authService.deleteUser(newUser.id);

      // Verify user was deleted
      const dbUser = await database
        .select()
        .from(users)
        .where(eq(users.id, newUser.id))
        .limit(1)
        .get();

      expect(dbUser).toBeUndefined();
    });

    it("doesn't throw error when trying to delete non-existent user", async () => {
      // Should not throw error
      await expect(authService.deleteUser("non-existent-id")).resolves.toBeUndefined();
    });

    it("throws descriptive error for invalid user ID", async () => {
      await expect(authService.deleteUser(null as any)).rejects.toThrow("User ID is required");
      await expect(authService.deleteUser(undefined as any)).rejects.toThrow("User ID is required");
      await expect(authService.deleteUser("")).rejects.toThrow("User ID cannot be empty");
    });
  });

  describe("generateUserJwt", () => {
    it("generates a valid JWT token", () => {
      const mockUser = {
        id: "test-id",
        name: "Test User",
        email: "test@example.com",
        password: "hashedPassword",
        createdAt: "2025-01-01T00:00:00Z",
        updatedAt: "2025-01-01T00:00:00Z"
      };

      const token = authService.generateUserJwt(mockUser);

      // Verify token format (3 parts separated by dots)
      expect(token).toMatch(/^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+$/);

      // Verify token can be decoded
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
      expect(decoded.id).toBe(mockUser.id);
      expect(decoded.name).toBe(mockUser.name);
      expect(decoded.email).toBe(mockUser.email);
      expect(decoded).toHaveProperty("exp"); // expiration time
      expect(decoded).toHaveProperty("iat"); // issued at time
    });

    it("generates different tokens for different users", () => {
      const user1 = {
        id: "user1-id",
        name: "User One",
        email: "user1@example.com",
        password: "hashedPassword",
        createdAt: "2025-01-01T00:00:00Z",
        updatedAt: "2025-01-01T00:00:00Z"
      };

      const user2 = {
        id: "user2-id", 
        name: "User Two",
        email: "user2@example.com",
        password: "hashedPassword",
        createdAt: "2025-01-01T00:00:00Z",
        updatedAt: "2025-01-01T00:00:00Z"
      };

      const token1 = authService.generateUserJwt(user1);
      const token2 = authService.generateUserJwt(user2);

      expect(token1).not.toBe(token2);
    });

    it("throws descriptive error for invalid user data", () => {
      expect(() => authService.generateUserJwt(null as any)).toThrow("User data is required");
      expect(() => authService.generateUserJwt(undefined as any)).toThrow("User data is required");
    });

    it("validates required user fields", () => {
      const baseUser = {
        id: "test-id",
        name: "Test User",
        email: "test@example.com",
        password: "hashedPassword",
        createdAt: "2025-01-01T00:00:00Z",
        updatedAt: "2025-01-01T00:00:00Z"
      };

      expect(() => authService.generateUserJwt({ ...baseUser, id: null as any })).toThrow("User ID is required");
      expect(() => authService.generateUserJwt({ ...baseUser, id: undefined as any })).toThrow("User ID is required");
      expect(() => authService.generateUserJwt({ ...baseUser, email: null as any })).toThrow("User email is required");
      expect(() => authService.generateUserJwt({ ...baseUser, email: undefined as any })).toThrow("User email is required");
      expect(() => authService.generateUserJwt({ ...baseUser, name: null as any })).toThrow("User name is required");
      expect(() => authService.generateUserJwt({ ...baseUser, name: undefined as any })).toThrow("User name is required");
    });

    it("validates JWT environment variables", () => {
      const mockUser = {
        id: "test-id",
        name: "Test User",
        email: "test@example.com",
        password: "hashedPassword",
        createdAt: "2025-01-01T00:00:00Z",
        updatedAt: "2025-01-01T00:00:00Z"
      };

      const originalSecret = process.env.JWT_SECRET;
      const originalMaxAge = process.env.JWT_MAX_AGE;

      try {
        // Test missing JWT_SECRET
        (process.env as any).JWT_SECRET = "";
        expect(() => authService.generateUserJwt(mockUser)).toThrow("JWT_SECRET environment variable is required");

        // Test missing JWT_MAX_AGE
        process.env.JWT_SECRET = originalSecret;
        (process.env as any).JWT_MAX_AGE = "";
        expect(() => authService.generateUserJwt(mockUser)).toThrow("JWT_MAX_AGE environment variable is required");
      } finally {
        // Always restore environment variables
        process.env.JWT_SECRET = originalSecret;
        process.env.JWT_MAX_AGE = originalMaxAge;
      }
    });
  });

  describe("refreshJwtToken", () => {
    let createdUser: any;

    beforeEach(async () => {
      // Create a user for refresh tests
      createdUser = await authService.signup(testUser);
    });

    it("successfully refreshes token for existing user", async () => {
      const refreshedToken = await authService.refreshJwtToken(createdUser.id);

      // Verify token format
      expect(refreshedToken).toMatch(/^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+$/);

      // Verify token contains correct user data
      const decoded = jwt.verify(refreshedToken, process.env.JWT_SECRET!) as any;
      expect(decoded.id).toBe(createdUser.id);
      expect(decoded.name).toBe(createdUser.name);
      expect(decoded.email).toBe(createdUser.email);
    });

    it("generates new token with fresh expiration time", async () => {
      const token1 = await authService.refreshJwtToken(createdUser.id);
      
      // Wait a moment to ensure different issued-at times
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const token2 = await authService.refreshJwtToken(createdUser.id);

      expect(token1).not.toBe(token2);

      // Decode both tokens to check issued-at times
      const decoded1 = jwt.verify(token1, process.env.JWT_SECRET!) as any;
      const decoded2 = jwt.verify(token2, process.env.JWT_SECRET!) as any;

      expect(decoded2.iat).toBeGreaterThan(decoded1.iat);
    });

    it("throws error when user does not exist", async () => {
      await expect(authService.refreshJwtToken("non-existent-user-id"))
        .rejects.toThrow("Failed to retrieve the user");
    });

    it("throws error when user ID is null, undefined, or empty", async () => {
      await expect(authService.refreshJwtToken(null as any))
        .rejects.toThrow("User ID is required");
      
      await expect(authService.refreshJwtToken(undefined as any))
        .rejects.toThrow("User ID is required");

      await expect(authService.refreshJwtToken(""))
        .rejects.toThrow("User ID cannot be empty");

      await expect(authService.refreshJwtToken("   "))
        .rejects.toThrow("User ID cannot be empty");
    });

    it("works after user data is updated", async () => {
      // Update user name in database
      await database
        .update(users)
        .set({ name: "Updated Name" })
        .where(eq(users.id, createdUser.id))
        .execute();

      // Refresh token should work and contain updated data
      const refreshedToken = await authService.refreshJwtToken(createdUser.id);
      
      const decoded = jwt.verify(refreshedToken, process.env.JWT_SECRET!) as any;
      expect(decoded.name).toBe("Updated Name");
      expect(decoded.id).toBe(createdUser.id);
      expect(decoded.email).toBe(createdUser.email);
    });
  });

  describe("JWT environment variables", () => {
    it("uses JWT_SECRET environment variable", () => {
      const mockUser = {
        id: "test-id",
        name: "Test User", 
        email: "test@example.com",
        password: "hashedPassword",
        createdAt: "2025-01-01T00:00:00Z",
        updatedAt: "2025-01-01T00:00:00Z"
      };

      const originalSecret = process.env.JWT_SECRET;
      process.env.JWT_SECRET = "different-secret";

      const token = authService.generateUserJwt(mockUser);

      // Token should be verifiable with the new secret
      expect(() => jwt.verify(token, "different-secret")).not.toThrow();
      
      // But not with the old secret
      expect(() => jwt.verify(token, originalSecret!)).toThrow();

      // Restore original secret
      process.env.JWT_SECRET = originalSecret;
    });

    it("uses JWT_MAX_AGE environment variable", () => {
      const mockUser = {
        id: "test-id",
        name: "Test User",
        email: "test@example.com", 
        password: "hashedPassword",
        createdAt: "2025-01-01T00:00:00Z",
        updatedAt: "2025-01-01T00:00:00Z"
      };

      const originalMaxAge = process.env.JWT_MAX_AGE;
      process.env.JWT_MAX_AGE = "1h";

      const token = authService.generateUserJwt(mockUser);
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;

      // Check that expiration is approximately 1 hour from now
      const expectedExp = Math.floor(Date.now() / 1000) + (60 * 60); // 1 hour
      expect(decoded.exp).toBeCloseTo(expectedExp, -1); // Within 10 seconds

      // Restore original max age
      process.env.JWT_MAX_AGE = originalMaxAge;
    });
  });
});
