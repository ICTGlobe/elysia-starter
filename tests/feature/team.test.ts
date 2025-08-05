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

describe("Team Controller", () => {
  const uniqueId = Date.now();
  const testUser = {
    name: "Team Test User",
    email: `team-test-${uniqueId}@example.com`,
    password: "teamTestPassword123"
  };

  const anotherUser = {
    name: "Another Team User",
    email: `another-team-${uniqueId}@example.com`,
    password: "anotherPassword123"
  };

  let createdUserId: string;
  let anotherUserId: string;
  let authToken: string;
  let anotherAuthToken: string;
  let createdTeamId: string;

  // Set up test users before tests
  beforeAll(async () => {
    await cleanupTestData();
    
    // Create first test user
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

    // Create second test user for permission testing
    const anotherSignupResponse = await app.handle(
      new Request("http://localhost/api/v1/auth/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(anotherUser),
      })
    );

    expect(anotherSignupResponse.status).toBe(200);
    const anotherUserData = await anotherSignupResponse.json();
    anotherUserId = anotherUserData.id;
    anotherAuthToken = anotherUserData.token;
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
      await database.delete(users).where(eq(users.email, anotherUser.email)).execute();
    } catch (error) {
      // Ignore cleanup errors in case data doesn't exist
    }
  }

  describe("GET /teams", () => {
    it("successfully returns list of teams (may be empty or contain teams)", async () => {
      const response = await app.handle(
        new Request("http://localhost/api/v1/teams", {
          method: "GET",
          headers: {
            "Authorization": `Bearer ${authToken}`,
          },
        })
      );

      expect(response.status).toBe(200);
      
      const teams = await response.json();
      expect(Array.isArray(teams)).toBe(true);
      // Don't expect specific length since user might have existing teams
    });

    it("returns 401 error when no authorization provided", async () => {
      const response = await app.handle(
        new Request("http://localhost/api/v1/teams", {
          method: "GET",
        })
      );

      expect(response.status).toBe(401);
      
      const errorData = await response.json();
      expect(errorData).toHaveProperty("errors");
      expect(errorData.errors[0]).toHaveProperty("message", "Unauthorized");
    });
  });

  describe("POST /teams", () => {
    it("successfully creates a new team", async () => {
      const teamData = {
        name: "Test Team",
        isPrivate: true
      };

      const response = await app.handle(
        new Request("http://localhost/api/v1/teams", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${authToken}`,
          },
          body: JSON.stringify(teamData),
        })
      );

      expect(response.status).toBe(200);
      
      const team = await response.json();
      expect(team).toHaveProperty("id");
      expect(team).toHaveProperty("name", teamData.name);
      expect(team).toHaveProperty("ownerId", createdUserId);
      expect(team).toHaveProperty("isPrivate", teamData.isPrivate);
      expect(team).toHaveProperty("createdAt");
      expect(team).toHaveProperty("updatedAt");

      // Store team ID for later tests
      createdTeamId = team.id;

      // Verify team was created in database
      const dbTeam = await database
        .select()
        .from(teams)
        .where(eq(teams.id, team.id))
        .limit(1)
        .get();
      
      expect(dbTeam).toBeDefined();
      expect(dbTeam!.name).toBe(teamData.name);
      expect(dbTeam!.ownerId).toBe(createdUserId);
    });

    it("creates team with default isPrivate value", async () => {
      const teamData = {
        name: "Public Test Team"
      };

      const response = await app.handle(
        new Request("http://localhost/api/v1/teams", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${authToken}`,
          },
          body: JSON.stringify(teamData),
        })
      );

      expect(response.status).toBe(200);
      
      const team = await response.json();
      expect(team).toHaveProperty("name", teamData.name);
      expect(team).toHaveProperty("ownerId", createdUserId);
      // Default value should be applied
    });

    it("validates required fields", async () => {
      const response = await app.handle(
        new Request("http://localhost/api/v1/teams", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${authToken}`,
          },
          body: JSON.stringify({}),
        })
      );

      expect(response.status).toBe(422);
    });

    it("validates minimum name length", async () => {
      const teamData = {
        name: "AB" // Too short (minimum is 3)
      };

      const response = await app.handle(
        new Request("http://localhost/api/v1/teams", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${authToken}`,
          },
          body: JSON.stringify(teamData),
        })
      );

      expect(response.status).toBe(422);
    });

    it("returns 401 error when no authorization provided", async () => {
      const teamData = {
        name: "Unauthorized Team"
      };

      const response = await app.handle(
        new Request("http://localhost/api/v1/teams", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(teamData),
        })
      );

      expect(response.status).toBe(401);
    });
  });

  describe("GET /teams", () => {
    it("successfully returns user's teams after creating some", async () => {
      const response = await app.handle(
        new Request("http://localhost/api/v1/teams", {
          method: "GET",
          headers: {
            "Authorization": `Bearer ${authToken}`,
          },
        })
      );

      expect(response.status).toBe(200);
      
      const teams = await response.json();
      expect(Array.isArray(teams)).toBe(true);
      expect(teams.length).toBeGreaterThan(0);
      
      // Verify all teams belong to the current user
      teams.forEach((team: any) => {
        expect(team.ownerId).toBe(createdUserId);
      });
    });
  });

  describe("GET /teams/:id", () => {
    it("successfully returns team by ID when user is owner", async () => {
      const response = await app.handle(
        new Request(`http://localhost/api/v1/teams/${createdTeamId}`, {
          method: "GET",
          headers: {
            "Authorization": `Bearer ${authToken}`,
          },
        })
      );

      expect(response.status).toBe(200);
      
      const team = await response.json();
      expect(team).toHaveProperty("id", createdTeamId);
      expect(team).toHaveProperty("name", "Test Team");
      expect(team).toHaveProperty("ownerId", createdUserId);
    });

    it("returns 400 error when team not found", async () => {
      const nonExistentId = "non-existent-team-id";
      
      const response = await app.handle(
        new Request(`http://localhost/api/v1/teams/${nonExistentId}`, {
          method: "GET",
          headers: {
            "Authorization": `Bearer ${authToken}`,
          },
        })
      );

      expect(response.status).toBe(400);
      
      const errorData = await response.json();
      expect(errorData).toHaveProperty("errors");
      expect(errorData.errors[0]).toHaveProperty("message", "Team not found");
    });

    it("returns 400 error when user is not team owner", async () => {
      const response = await app.handle(
        new Request(`http://localhost/api/v1/teams/${createdTeamId}`, {
          method: "GET",
          headers: {
            "Authorization": `Bearer ${anotherAuthToken}`, // Different user
          },
        })
      );

      expect(response.status).toBe(400);
      
      const errorData = await response.json();
      expect(errorData).toHaveProperty("errors");
      expect(errorData.errors[0]).toHaveProperty("message", "Team not found or you do not have permission to access it.");
    });

    it("returns 401 error when no authorization provided", async () => {
      const response = await app.handle(
        new Request(`http://localhost/api/v1/teams/${createdTeamId}`, {
          method: "GET",
        })
      );

      expect(response.status).toBe(401);
    });
  });

  describe("PUT /teams/:id", () => {
    it("successfully updates team when user is owner", async () => {
      const updateData = {
        name: "Updated Test Team",
        isPrivate: false
      };

      const response = await app.handle(
        new Request(`http://localhost/api/v1/teams/${createdTeamId}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${authToken}`,
          },
          body: JSON.stringify(updateData),
        })
      );

      expect(response.status).toBe(200);
      
      const updatedTeam = await response.json();
      expect(updatedTeam).toHaveProperty("id", createdTeamId);
      expect(updatedTeam).toHaveProperty("name", updateData.name);
      expect(updatedTeam).toHaveProperty("isPrivate", updateData.isPrivate);
      expect(updatedTeam).toHaveProperty("ownerId", createdUserId);

      // Verify team was updated in database
      const dbTeam = await database
        .select()
        .from(teams)
        .where(eq(teams.id, createdTeamId))
        .limit(1)
        .get();
      
      expect(dbTeam!.name).toBe(updateData.name);
      expect(dbTeam!.isPrivate).toBe(updateData.isPrivate);
    });

    it("returns 400 error when team not found", async () => {
      const nonExistentId = "non-existent-team-id";
      const updateData = { name: "New Name" };
      
      const response = await app.handle(
        new Request(`http://localhost/api/v1/teams/${nonExistentId}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${authToken}`,
          },
          body: JSON.stringify(updateData),
        })
      );

      expect(response.status).toBe(400);
      
      const errorData = await response.json();
      expect(errorData).toHaveProperty("errors");
      expect(errorData.errors[0]).toHaveProperty("message", "Team not found");
    });

    it("returns 400 error when user is not team owner", async () => {
      const updateData = { name: "Unauthorized Update" };
      
      const response = await app.handle(
        new Request(`http://localhost/api/v1/teams/${createdTeamId}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${anotherAuthToken}`, // Different user
          },
          body: JSON.stringify(updateData),
        })
      );

      expect(response.status).toBe(400);
      
      const errorData = await response.json();
      expect(errorData).toHaveProperty("errors");
      expect(errorData.errors[0]).toHaveProperty("message", "You do not have permission to update this team");
    });

    it("validates field requirements on update", async () => {
      const updateData = {
        name: "AB" // Too short
      };

      const response = await app.handle(
        new Request(`http://localhost/api/v1/teams/${createdTeamId}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${authToken}`,
          },
          body: JSON.stringify(updateData),
        })
      );

      expect(response.status).toBe(422);
    });

    it("returns 401 error when no authorization provided", async () => {
      const updateData = { name: "Unauthorized Update" };
      
      const response = await app.handle(
        new Request(`http://localhost/api/v1/teams/${createdTeamId}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(updateData),
        })
      );

      expect(response.status).toBe(401);
    });
  });

  describe("DELETE /teams/:id", () => {
    it("returns 400 error when team not found", async () => {
      const nonExistentId = "non-existent-team-id";
      
      const response = await app.handle(
        new Request(`http://localhost/api/v1/teams/${nonExistentId}`, {
          method: "DELETE",
          headers: {
            "Authorization": `Bearer ${authToken}`,
          },
        })
      );

      expect(response.status).toBe(400);
      
      const errorData = await response.json();
      expect(errorData).toHaveProperty("errors");
      expect(errorData.errors[0]).toHaveProperty("message", "Team not found");
    });

    it("returns 400 error when user is not team owner", async () => {
      const response = await app.handle(
        new Request(`http://localhost/api/v1/teams/${createdTeamId}`, {
          method: "DELETE",
          headers: {
            "Authorization": `Bearer ${anotherAuthToken}`, // Different user
          },
        })
      );

      expect(response.status).toBe(400);
      
      const errorData = await response.json();
      expect(errorData).toHaveProperty("errors");
      expect(errorData.errors[0]).toHaveProperty("message", "You do not have permission to delete this team");
    });

    it("returns 401 error when no authorization provided", async () => {
      const response = await app.handle(
        new Request(`http://localhost/api/v1/teams/${createdTeamId}`, {
          method: "DELETE",
        })
      );

      expect(response.status).toBe(401);
    });

    it("successfully deletes team when user is owner", async () => {
      const response = await app.handle(
        new Request(`http://localhost/api/v1/teams/${createdTeamId}`, {
          method: "DELETE",
          headers: {
            "Authorization": `Bearer ${authToken}`,
          },
        })
      );

      expect(response.status).toBe(200);
      
      const result = await response.json();
      expect(result).toHaveProperty("message", "Team deleted successfully");

      // Verify team was deleted from database
      const dbTeam = await database
        .select()
        .from(teams)
        .where(eq(teams.id, createdTeamId))
        .limit(1)
        .get();
      
      expect(dbTeam).toBeUndefined();
    });
  });
});
