import { describe, expect, it, beforeAll, afterAll, beforeEach, afterEach } from "bun:test";
import { app } from "@/app";
import { database } from "@/database";
import { users } from "@/drizzle/schema/users";
import { teams } from "@/drizzle/schema/teams";
import { teamUser } from "@/drizzle/schema/teamUser";
import { eq } from "drizzle-orm";

describe("Team Staff Management", () => {
  let ownerToken: string;
  let memberToken: string;
  let ownerId: string;
  let memberId: string;
  let teamId: string;

  beforeEach(async () => {
    // Clean up database
    await database.delete(teamUser).execute();
    await database.delete(teams).execute();
    await database.delete(users).execute();

    // Create test users
    const ownerResponse = await app.handle(
      new Request("http://localhost/api/v1/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "Team Owner",
          email: "owner@test.com",
          password: "password123",
        }),
      })
    );

    const memberResponse = await app.handle(
      new Request("http://localhost/api/v1/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "Team Member",
          email: "member@test.com",
          password: "password123",
        }),
      })
    );

    const ownerData = await ownerResponse.json();
    const memberData = await memberResponse.json();

    ownerToken = ownerData.token;
    memberToken = memberData.token;
    ownerId = ownerData.id;
    memberId = memberData.id;

    // Create a test team
    const teamResponse = await app.handle(
      new Request("http://localhost/api/v1/teams", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${ownerToken}`,
        },
        body: JSON.stringify({
          name: "Test Team",
          isPrivate: true,
        }),
      })
    );

    if (!teamResponse.ok) {
      const errorData = await teamResponse.json();
      console.error("Team creation failed:", errorData);
      throw new Error("Team creation failed");
    }

    const teamData = await teamResponse.json();
    teamId = teamData.id;
  });

  afterEach(async () => {
    // Clean up database
    await database.delete(teamUser).execute();
    await database.delete(teams).execute();
    await database.delete(users).execute();
  });

  describe("GET /api/v1/teams/:id/members", () => {
    it("should get team members when user is team owner", async () => {
      const response = await app.handle(
        new Request(`http://localhost/api/v1/teams/${teamId}/members`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${ownerToken}`,
          },
        })
      );

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(Array.isArray(data)).toBe(true);
    });

    it("should return 400 when user is not team owner", async () => {
      const response = await app.handle(
        new Request(`http://localhost/api/v1/teams/${teamId}/members`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${memberToken}`,
          },
        })
      );

      expect(response.status).toBe(400);
    });

    it("should return 400 when team does not exist", async () => {
      const response = await app.handle(
        new Request("http://localhost/api/v1/teams/nonexistent/members", {
          method: "GET",
          headers: {
            Authorization: `Bearer ${ownerToken}`,
          },
        })
      );

      expect(response.status).toBe(400);
    });
  });

  describe("POST /api/v1/teams/:id/members", () => {
    it("should add a member to the team when user is team owner", async () => {
      const response = await app.handle(
        new Request(`http://localhost/api/v1/teams/${teamId}/members`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${ownerToken}`,
          },
          body: JSON.stringify({
            userId: memberId,
            role: "member",
          }),
        })
      );

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.userId).toBe(memberId);
      expect(data.role).toBe("member");
      expect(data.user.id).toBe(memberId);
    });

    it("should return 400 when user is not team owner", async () => {
      const response = await app.handle(
        new Request(`http://localhost/api/v1/teams/${teamId}/members`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${memberToken}`,
          },
          body: JSON.stringify({
            userId: memberId,
            role: "member",
          }),
        })
      );

      expect(response.status).toBe(400);
    });

    it("should return 400 when trying to add yourself as a member", async () => {
      const response = await app.handle(
        new Request(`http://localhost/api/v1/teams/${teamId}/members`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${ownerToken}`,
          },
          body: JSON.stringify({
            userId: ownerId,
            role: "member",
          }),
        })
      );

      expect(response.status).toBe(400);
    });

    it("should return 400 when user is already a member", async () => {
      // First, add the member
      const firstResponse = await app.handle(
        new Request(`http://localhost/api/v1/teams/${teamId}/members`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${ownerToken}`,
          },
          body: JSON.stringify({
            userId: memberId,
            role: "member",
          }),
        })
      );

      expect(firstResponse.status).toBe(200);

      // Then try to add the same member again
      const secondResponse = await app.handle(
        new Request(`http://localhost/api/v1/teams/${teamId}/members`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${ownerToken}`,
          },
          body: JSON.stringify({
            userId: memberId,
            role: "member",
          }),
        })
      );

      expect(secondResponse.status).toBe(400);
    });
  });

  describe("PUT /api/v1/teams/:id/members/:memberId", () => {
    let memberRecordId: string;

    beforeEach(async () => {
      // Add a member first
      const addMemberResponse = await app.handle(
        new Request(`http://localhost/api/v1/teams/${teamId}/members`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${ownerToken}`,
          },
          body: JSON.stringify({
            userId: memberId,
            role: "member",
          }),
        })
      );

      if (!addMemberResponse.ok) {
        throw new Error("Failed to add member for test");
      }

      const memberData = await addMemberResponse.json();
      memberRecordId = memberData.id;
    });

    it("should update member role when user is team owner", async () => {
      const response = await app.handle(
        new Request(`http://localhost/api/v1/teams/${teamId}/members/${memberRecordId}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${ownerToken}`,
          },
          body: JSON.stringify({
            role: "admin",
          }),
        })
      );

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.role).toBe("admin");
    });

    it("should return 400 when user is not team owner", async () => {
      const response = await app.handle(
        new Request(`http://localhost/api/v1/teams/${teamId}/members/${memberRecordId}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${memberToken}`,
          },
          body: JSON.stringify({
            role: "member",
          }),
        })
      );

      expect(response.status).toBe(400);
    });
  });

  describe("DELETE /api/v1/teams/:id/members/:memberId", () => {
    let memberRecordId: string;

    beforeEach(async () => {
      // Add a member first
      const addMemberResponse = await app.handle(
        new Request(`http://localhost/api/v1/teams/${teamId}/members`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${ownerToken}`,
          },
          body: JSON.stringify({
            userId: memberId,
            role: "member",
          }),
        })
      );

      if (!addMemberResponse.ok) {
        throw new Error("Failed to add member for test");
      }

      const memberData = await addMemberResponse.json();
      memberRecordId = memberData.id;
    });

    it("should remove member when user is team owner", async () => {
      const response = await app.handle(
        new Request(`http://localhost/api/v1/teams/${teamId}/members/${memberRecordId}`, {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${ownerToken}`,
          },
        })
      );

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.message).toBe("Team member removed successfully");
    });

    it("should return 400 when user is not team owner", async () => {
      const response = await app.handle(
        new Request(`http://localhost/api/v1/teams/${teamId}/members/${memberRecordId}`, {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${memberToken}`,
          },
        })
      );

      expect(response.status).toBe(400);
    });

    it("should return 400 when member does not exist", async () => {
      const response = await app.handle(
        new Request(`http://localhost/api/v1/teams/${teamId}/members/nonexistent`, {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${ownerToken}`,
          },
        })
      );

      expect(response.status).toBe(400);
    });
  });
});
