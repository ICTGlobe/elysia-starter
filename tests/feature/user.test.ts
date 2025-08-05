import { describe, expect, it, beforeAll, afterAll } from "bun:test";
import { database } from "@/database";
import { users } from "@/drizzle/schema/users";
import { teams } from "@/drizzle/schema/teams";
import { teamUser } from "@/drizzle/schema/teamUser";
import { passwordResets } from "@/drizzle/schema/passwordResets";
import { app } from "@/app";
import { eq } from "drizzle-orm";

// Set up test environment
process.env.JWT_SECRET = "test-secret-key";
process.env.JWT_MAX_AGE = "1 day";

describe("User Controller", () => {
  const uniqueId = Date.now();
  const testUser = {
    name: "User Test User",
    email: `user-test-${uniqueId}@example.com`,
    password: "userTestPassword123"
  };

  let createdUserId: string;
  let authToken: string;

  // Set up test user before tests
  beforeAll(async () => {
    await cleanupTestData();
    
    // Create a test user
    const signupResponse = await app.handle(
      new Request("http://localhost/api/v1/auth/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(testUser),
      })
    );

    expect(signupResponse.status).toBe(200);
    const userData = await signupResponse.json();
    createdUserId = userData.id;
    authToken = userData.token;
  });

  afterAll(async () => {
    await cleanupTestData();
  });

  async function cleanupTestData() {
    try {
      // Clean up in correct order due to foreign key constraints
      await database.delete(passwordResets).execute();
      await database.delete(teamUser).execute();
      await database.delete(teams).execute();
      await database.delete(users).where(eq(users.email, testUser.email)).execute();
    } catch (error) {
      // Ignore cleanup errors in case data doesn't exist
    }
  }

  describe("GET /users/me", () => {
    it("successfully returns current user data with valid token", async () => {
      const response = await app.handle(
        new Request("http://localhost/api/v1/users/me", {
          method: "GET",
          headers: {
            "Authorization": `Bearer ${authToken}`,
          },
        })
      );

      expect(response.status).toBe(200);
      
      const userData = await response.json();
      expect(userData).toHaveProperty("id", createdUserId);
      expect(userData).toHaveProperty("name", testUser.name);
      expect(userData).toHaveProperty("email", testUser.email);
      // The JWT token doesn't contain the token itself, just the user data
      expect(userData).toHaveProperty("iat"); // JWT issued at timestamp
      expect(userData).toHaveProperty("exp"); // JWT expiration timestamp
    });

    it("returns 401 error when no authorization header is provided", async () => {
      const response = await app.handle(
        new Request("http://localhost/api/v1/users/me", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        })
      );

      expect(response.status).toBe(401);
      
      const errorData = await response.json();
      expect(errorData).toHaveProperty("errors");
      expect(errorData.errors[0]).toHaveProperty("message", "Unauthorized");
    });

    it("returns 401 error when authorization header is malformed", async () => {
      const response = await app.handle(
        new Request("http://localhost/api/v1/users/me", {
          method: "GET",
          headers: {
            "Authorization": "InvalidTokenFormat",
          },
        })
      );

      expect(response.status).toBe(401);
      
      const errorData = await response.json();
      expect(errorData).toHaveProperty("errors");
      expect(errorData.errors[0]).toHaveProperty("message", "Unauthorized");
    });

    it("returns 401 error when bearer token is invalid", async () => {
      const response = await app.handle(
        new Request("http://localhost/api/v1/users/me", {
          method: "GET",
          headers: {
            "Authorization": "Bearer invalid-jwt-token-123",
          },
        })
      );

      expect(response.status).toBe(401);
      
      const errorData = await response.json();
      expect(errorData).toHaveProperty("errors");
      expect(errorData.errors[0]).toHaveProperty("message", "Unauthorized");
    });

    it("returns 401 error when bearer token is empty", async () => {
      const response = await app.handle(
        new Request("http://localhost/api/v1/users/me", {
          method: "GET",
          headers: {
            "Authorization": "Bearer ",
          },
        })
      );

      expect(response.status).toBe(401);
      
      const errorData = await response.json();
      expect(errorData).toHaveProperty("errors");
      expect(errorData.errors[0]).toHaveProperty("message", "Unauthorized");
    });

    it("returns 401 error when using expired or tampered token", async () => {
      // Create a fake/expired token (this would be a malformed JWT)
      const fakeToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImZha2UiLCJuYW1lIjoiRmFrZSIsImVtYWlsIjoiZmFrZUBleGFtcGxlLmNvbSIsImlhdCI6MTYwMDAwMDAwMCwiZXhwIjoxNjAwMDAwMDAwfQ.invalid-signature";
      
      const response = await app.handle(
        new Request("http://localhost/api/v1/users/me", {
          method: "GET",
          headers: {
            "Authorization": `Bearer ${fakeToken}`,
          },
        })
      );

      expect(response.status).toBe(401);
      
      const errorData = await response.json();
      expect(errorData).toHaveProperty("errors");
      expect(errorData.errors[0]).toHaveProperty("message", "Unauthorized");
    });
  });
});
