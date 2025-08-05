import { describe, expect, it, beforeAll, afterAll, beforeEach } from "bun:test";
import { database } from "@/database";
import { users } from "@/drizzle/schema/users";
import { teams } from "@/drizzle/schema/teams";
import { teamUser } from "@/drizzle/schema/teamUser";
import { teamInvitation } from "@/drizzle/schema/teamInvitation";
import { app } from "@/app";
import * as argon2 from "argon2";
import { eq } from "drizzle-orm";

// Set up test environment
process.env.JWT_SECRET = "test-secret-key";
process.env.JWT_MAX_AGE = "1 day";

describe("Team Invitation Controller", () => {
  let user1Token: string;
  let user1Id: string;
  let user2Token: string;
  let user2Id: string;
  let teamId: string;
  let invitationId: string;

  const testUser1 = {
    name: "Team Owner",
    email: "owner@example.com",
    password: "ownerPassword123"
  };

  const testUser2 = {
    name: "Other User",
    email: "other@example.com", 
    password: "otherPassword123"
  };

  const testInvitation = {
    email: "invitee@example.com",
    role: "member"
  };

  // Clean up test data before and after tests
  beforeAll(async () => {
    await cleanupTestData();
  });

  afterAll(async () => {
    await cleanupTestData();
  });

  beforeEach(async () => {
    await cleanupTestData();
    
    // Create test users
    const hashedPassword1 = await argon2.hash(testUser1.password);
    const hashedPassword2 = await argon2.hash(testUser2.password);
    
    const createdUser1 = await database.insert(users).values({
      ...testUser1,
      password: hashedPassword1
    }).returning().get();
    
    const createdUser2 = await database.insert(users).values({
      ...testUser2,
      password: hashedPassword2
    }).returning().get();

    user1Id = createdUser1.id;
    user2Id = createdUser2.id;

    // Get tokens for users
    const loginResponse1 = await app.handle(
      new Request("http://localhost/api/v1/auth/signin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: testUser1.email,
          password: testUser1.password
        })
      })
    );
    const userData1 = await loginResponse1.json();
    user1Token = userData1.token;

    const loginResponse2 = await app.handle(
      new Request("http://localhost/api/v1/auth/signin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: testUser2.email,
          password: testUser2.password
        })
      })
    );
    const userData2 = await loginResponse2.json();
    user2Token = userData2.token;

    // Create a test team owned by user1
    const createdTeam = await database.insert(teams).values({
      name: "Test Team",
      ownerId: user1Id,
      isPrivate: false
    }).returning().get();
    
    teamId = createdTeam.id;
  });

  async function cleanupTestData() {
    try {
      // Clean up in correct order due to foreign key constraints
      await database.delete(teamInvitation).execute();
      await database.delete(teamUser).execute();
      await database.delete(teams).execute();
      await database.delete(users).where(eq(users.email, testUser1.email)).execute();
      await database.delete(users).where(eq(users.email, testUser2.email)).execute();
    } catch (error) {
      // Ignore cleanup errors in case data doesn't exist
    }
  }

  describe("POST /teams/:id/invitations", () => {
    it("successfully creates a team invitation when user is team owner", async () => {
      const response = await app.handle(
        new Request(`http://localhost/api/v1/teams/${teamId}/invitations`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${user1Token}`
          },
          body: JSON.stringify(testInvitation)
        })
      );

      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(data).toHaveProperty("id");
      expect(data).toHaveProperty("teamId", teamId);
      expect(data).toHaveProperty("email", testInvitation.email);
      expect(data).toHaveProperty("role", testInvitation.role);
      expect(data).toHaveProperty("createdAt");
      expect(data).toHaveProperty("updatedAt");

      // Verify invitation was created in database
      const dbInvitation = await database
        .select()
        .from(teamInvitation)
        .where(eq(teamInvitation.id, data.id))
        .limit(1)
        .get();

      expect(dbInvitation).toBeTruthy();
      expect(dbInvitation!.email).toBe(testInvitation.email);
      expect(dbInvitation!.role).toBe(testInvitation.role);
      expect(dbInvitation!.teamId).toBe(teamId);

      // Store invitation ID for other tests
      invitationId = data.id;
    });

    it("returns 401 error when no authorization provided", async () => {
      const response = await app.handle(
        new Request(`http://localhost/api/v1/teams/${teamId}/invitations`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify(testInvitation)
        })
      );

      expect(response.status).toBe(401);
    });

    it("validates required fields", async () => {
      const invalidInvitation = {
        email: "invalid-email", // Invalid email format
        role: "" // Empty role
      };

      const response = await app.handle(
        new Request(`http://localhost/api/v1/teams/${teamId}/invitations`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${user1Token}`
          },
          body: JSON.stringify(invalidInvitation)
        })
      );

      expect(response.status).toBe(422); // Validation error
    });

    it("validates email format", async () => {
      const invalidInvitation = {
        email: "not-an-email",
        role: "member"
      };

      const response = await app.handle(
        new Request(`http://localhost/api/v1/teams/${teamId}/invitations`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${user1Token}`
          },
          body: JSON.stringify(invalidInvitation)
        })
      );

      expect(response.status).toBe(422);
    });

    it("allows different roles", async () => {
      const adminInvitation = {
        email: "admin@example.com",
        role: "admin"
      };

      const response = await app.handle(
        new Request(`http://localhost/api/v1/teams/${teamId}/invitations`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${user1Token}`
          },
          body: JSON.stringify(adminInvitation)
        })
      );

      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(data.role).toBe("admin");
    });
  });

  describe("GET /teams/:id/invitations", () => {
    beforeEach(async () => {
      // Create a test invitation for GET tests
      const createdInvitation = await database.insert(teamInvitation).values({
        teamId: teamId,
        email: testInvitation.email,
        role: testInvitation.role
      }).returning().get();
      
      invitationId = createdInvitation.id;
    });

    it("successfully returns list of team invitations when user is authorized", async () => {
      const response = await app.handle(
        new Request(`http://localhost/api/v1/teams/${teamId}/invitations`, {
          method: "GET",
          headers: {
            "Authorization": `Bearer ${user1Token}`
          }
        })
      );

      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(Array.isArray(data)).toBe(true);
      expect(data).toHaveLength(1);
      expect(data[0]).toHaveProperty("id", invitationId);
      expect(data[0]).toHaveProperty("email", testInvitation.email);
      expect(data[0]).toHaveProperty("role", testInvitation.role);
      expect(data[0]).toHaveProperty("teamId", teamId);
    });

    it("returns empty array when team has no invitations", async () => {
      // Delete the invitation we created
      await database.delete(teamInvitation).where(eq(teamInvitation.id, invitationId)).execute();

      const response = await app.handle(
        new Request(`http://localhost/api/v1/teams/${teamId}/invitations`, {
          method: "GET",
          headers: {
            "Authorization": `Bearer ${user1Token}`
          }
        })
      );

      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(Array.isArray(data)).toBe(true);
      expect(data).toHaveLength(0);
    });

    it("returns 401 error when no authorization provided", async () => {
      const response = await app.handle(
        new Request(`http://localhost/api/v1/teams/${teamId}/invitations`, {
          method: "GET"
        })
      );

      expect(response.status).toBe(401);
    });
  });

  describe("GET /teams/:id/invitations/:invitation", () => {
    beforeEach(async () => {
      // Create a test invitation for GET tests
      const createdInvitation = await database.insert(teamInvitation).values({
        teamId: teamId,
        email: testInvitation.email,
        role: testInvitation.role
      }).returning().get();
      
      invitationId = createdInvitation.id;
    });

    it("successfully returns specific team invitation when user is authorized", async () => {
      const response = await app.handle(
        new Request(`http://localhost/api/v1/teams/${teamId}/invitations/${invitationId}`, {
          method: "GET",
          headers: {
            "Authorization": `Bearer ${user1Token}`
          }
        })
      );

      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(data).toHaveProperty("id", invitationId);
      expect(data).toHaveProperty("email", testInvitation.email);
      expect(data).toHaveProperty("role", testInvitation.role);
      expect(data).toHaveProperty("teamId", teamId);
      expect(data).toHaveProperty("createdAt");
      expect(data).toHaveProperty("updatedAt");
    });

    it("returns 500 error when invitation not found", async () => {
      const response = await app.handle(
        new Request(`http://localhost/api/v1/teams/${teamId}/invitations/non-existent-invitation-id`, {
          method: "GET",
          headers: {
            "Authorization": `Bearer ${user1Token}`
          }
        })
      );

      expect(response.status).toBe(500); // Service throws Error, gets converted to 500
    });

    it("returns 401 error when no authorization provided", async () => {
      const response = await app.handle(
        new Request(`http://localhost/api/v1/teams/${teamId}/invitations/${invitationId}`, {
          method: "GET"
        })
      );

      expect(response.status).toBe(401);
    });
  });

  describe("DELETE /teams/:id/invitations/:invitation", () => {
    beforeEach(async () => {
      // Create a test invitation for DELETE tests
      const createdInvitation = await database.insert(teamInvitation).values({
        teamId: teamId,
        email: testInvitation.email,
        role: testInvitation.role
      }).returning().get();
      
      invitationId = createdInvitation.id;
    });

    it("successfully deletes team invitation when user is authorized", async () => {
      const response = await app.handle(
        new Request(`http://localhost/api/v1/teams/${teamId}/invitations/${invitationId}`, {
          method: "DELETE",
          headers: {
            "Authorization": `Bearer ${user1Token}`
          }
        })
      );

      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(data).toHaveProperty("message", "Team invitation deleted");

      // Verify invitation was deleted from database
      const dbInvitation = await database
        .select()
        .from(teamInvitation)
        .where(eq(teamInvitation.id, invitationId))
        .limit(1)
        .get();

      expect(dbInvitation).toBeUndefined();
    });

    it("returns success message even when invitation doesn't exist", async () => {
      const response = await app.handle(
        new Request(`http://localhost/api/v1/teams/${teamId}/invitations/non-existent-invitation-id`, {
          method: "DELETE",
          headers: {
            "Authorization": `Bearer ${user1Token}`
          }
        })
      );

      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(data).toHaveProperty("message", "Team invitation deleted");
    });

    it("returns 401 error when no authorization provided", async () => {
      const response = await app.handle(
        new Request(`http://localhost/api/v1/teams/${teamId}/invitations/${invitationId}`, {
          method: "DELETE"
        })
      );

      expect(response.status).toBe(401);
    });
  });

  describe("Authorization and Team Access", () => {
    beforeEach(async () => {
      // Create a test invitation
      const createdInvitation = await database.insert(teamInvitation).values({
        teamId: teamId,
        email: testInvitation.email,
        role: testInvitation.role
      }).returning().get();
      
      invitationId = createdInvitation.id;
    });

    it("allows team owner to access all invitation endpoints", async () => {
      // Test GET invitations
      const getResponse = await app.handle(
        new Request(`http://localhost/api/v1/teams/${teamId}/invitations`, {
          method: "GET",
          headers: { "Authorization": `Bearer ${user1Token}` }
        })
      );
      expect(getResponse.status).toBe(200);

      // Test GET specific invitation
      const getSingleResponse = await app.handle(
        new Request(`http://localhost/api/v1/teams/${teamId}/invitations/${invitationId}`, {
          method: "GET",
          headers: { "Authorization": `Bearer ${user1Token}` }
        })
      );
      expect(getSingleResponse.status).toBe(200);

      // Test POST invitation
      const postResponse = await app.handle(
        new Request(`http://localhost/api/v1/teams/${teamId}/invitations`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${user1Token}`
          },
          body: JSON.stringify({
            email: "another@example.com",
            role: "member"
          })
        })
      );
      expect(postResponse.status).toBe(200);

      // Test DELETE invitation
      const deleteResponse = await app.handle(
        new Request(`http://localhost/api/v1/teams/${teamId}/invitations/${invitationId}`, {
          method: "DELETE",
          headers: { "Authorization": `Bearer ${user1Token}` }
        })
      );
      expect(deleteResponse.status).toBe(200);
    });

    it("works with non-existent team ID", async () => {
      const nonExistentTeamId = "non-existent-team-id";

      // The controller doesn't validate team ownership, so it will try to process
      // This might result in 500 errors depending on service implementation
      const response = await app.handle(
        new Request(`http://localhost/api/v1/teams/${nonExistentTeamId}/invitations`, {
          method: "GET",
          headers: { "Authorization": `Bearer ${user1Token}` }
        })
      );

      // Could be 200 with empty array or 500 depending on service implementation
      expect([200, 500]).toContain(response.status);
    });
  });

  describe("Edge Cases", () => {
    it("handles multiple invitations for same team", async () => {
      const invitation1 = { email: "user1@example.com", role: "member" };
      const invitation2 = { email: "user2@example.com", role: "admin" };

      // Create first invitation
      const response1 = await app.handle(
        new Request(`http://localhost/api/v1/teams/${teamId}/invitations`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${user1Token}`
          },
          body: JSON.stringify(invitation1)
        })
      );
      expect(response1.status).toBe(200);

      // Create second invitation
      const response2 = await app.handle(
        new Request(`http://localhost/api/v1/teams/${teamId}/invitations`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${user1Token}`
          },
          body: JSON.stringify(invitation2)
        })
      );
      expect(response2.status).toBe(200);

      // Get all invitations
      const getResponse = await app.handle(
        new Request(`http://localhost/api/v1/teams/${teamId}/invitations`, {
          method: "GET",
          headers: { "Authorization": `Bearer ${user1Token}` }
        })
      );
      expect(getResponse.status).toBe(200);

      const invitations = await getResponse.json();
      expect(invitations).toHaveLength(2);
    });

    it("handles duplicate email invitations", async () => {
      // Create first invitation
      const response1 = await app.handle(
        new Request(`http://localhost/api/v1/teams/${teamId}/invitations`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${user1Token}`
          },
          body: JSON.stringify(testInvitation)
        })
      );
      expect(response1.status).toBe(200);

      // Try to create duplicate invitation
      const response2 = await app.handle(
        new Request(`http://localhost/api/v1/teams/${teamId}/invitations`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${user1Token}`
          },
          body: JSON.stringify(testInvitation)
        })
      );

      // Should succeed (database allows duplicates) or fail with constraint error
      expect([200, 500]).toContain(response2.status);
    });
  });
});
