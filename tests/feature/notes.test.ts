import { describe, expect, it, beforeAll, afterAll } from "bun:test";
import { database } from "@/database";
import { users } from "@/drizzle/schema/users";
import { teams } from "@/drizzle/schema/teams";
import { teamUser } from "@/drizzle/schema/teamUser";
import { notes } from "@/drizzle/schema/notes";
import { passwordResets } from "@/drizzle/schema/passwordResets";
import { app } from "@/app";
import { eq } from "drizzle-orm";

// Set up test environment
process.env.JWT_SECRET = "test-secret-key";
process.env.JWT_MAX_AGE = "1 day";

describe("Notes Controller", () => {
  const uniqueId = Date.now();
  const testUser = {
    name: "Notes Test User",
    email: `notes-test-${uniqueId}@example.com`,
    password: "notesTestPassword123"
  };

  const teamMember = {
    name: "Team Member User",
    email: `team-member-${uniqueId}@example.com`,
    password: "teamMemberPassword123"
  };

  const nonTeamUser = {
    name: "Non Team User",
    email: `non-team-${uniqueId}@example.com`,
    password: "nonTeamPassword123"
  };

  let createdUserId: string;
  let teamMemberId: string;
  let nonTeamUserId: string;
  let authToken: string;
  let teamMemberToken: string;
  let nonTeamToken: string;
  let createdTeamId: string;
  let createdNoteId: string;

  // Clean up test data
  const cleanupTestData = async () => {
    try {
      await database.delete(notes);
      await database.delete(teamUser);
      await database.delete(teams);
      await database.delete(passwordResets);
      await database.delete(users).where(eq(users.email, testUser.email));
      await database.delete(users).where(eq(users.email, teamMember.email));
      await database.delete(users).where(eq(users.email, nonTeamUser.email));
    } catch (error) {
      // Ignore cleanup errors
    }
  };

  // Set up test users and team before tests
  beforeAll(async () => {
    await cleanupTestData();
    
    // Create test user (team owner)
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

    // Create team member user
    const memberSignupResponse = await app.handle(
      new Request("http://localhost/api/v1/auth/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(teamMember),
      })
    );

    expect(memberSignupResponse.status).toBe(200);
    const memberData = await memberSignupResponse.json();
    teamMemberId = memberData.id;
    teamMemberToken = memberData.token;

    // Create non-team user
    const nonTeamSignupResponse = await app.handle(
      new Request("http://localhost/api/v1/auth/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(nonTeamUser),
      })
    );

    expect(nonTeamSignupResponse.status).toBe(200);
    const nonTeamData = await nonTeamSignupResponse.json();
    nonTeamUserId = nonTeamData.id;
    nonTeamToken = nonTeamData.token;

    // Create a team directly in database
    const createdTeam = await database.insert(teams).values({
      name: "Test Team for Notes",
      ownerId: createdUserId,
      isPrivate: false
    }).returning().get();
    
    createdTeamId = createdTeam.id;

    // Add team owner to the team
    await database.insert(teamUser).values({
      userId: createdUserId,
      teamId: createdTeamId,
      role: "owner",
    });

    // Add team member directly to the team
    await database.insert(teamUser).values({
      userId: teamMemberId,
      teamId: createdTeamId,
      role: "member",
    });
  });

  // Clean up after tests
  afterAll(async () => {
    await cleanupTestData();
  });

  describe("POST /notes", () => {
    it("should create a note successfully when user is team member", async () => {
      const noteData = {
        title: "Test Note",
        content: "This is a test note content",
        teamId: createdTeamId
      };

      const response = await app.handle(
        new Request(`http://localhost/api/v1/teams/${createdTeamId}/notes`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${authToken}`,
          },
          body: JSON.stringify({
            title: noteData.title,
            content: noteData.content,
          }),
        })
      );

      expect(response.status).toBe(201);
      const responseData = await response.json();
      expect(responseData.success).toBe(true);
      expect(responseData.data).toHaveProperty("id");
      expect(responseData.data.title).toBe(noteData.title);
      expect(responseData.data.content).toBe(noteData.content);
      expect(responseData.data.teamId).toBe(noteData.teamId);
      expect(responseData.data.authorId).toBe(createdUserId);

      createdNoteId = responseData.data.id;
    });

    it("should allow team member to create a note", async () => {
      const noteData = {
        title: "Member Note",
        content: "Note created by team member",
        teamId: createdTeamId
      };

      const response = await app.handle(
        new Request(`http://localhost/api/v1/teams/${createdTeamId}/notes`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${teamMemberToken}`,
          },
          body: JSON.stringify({
            title: noteData.title,
            content: noteData.content,
          }),
        })
      );

      expect(response.status).toBe(201);
      const responseData = await response.json();
      expect(responseData.success).toBe(true);
      expect(responseData.data.authorId).toBe(teamMemberId);
    });

    it("should deny note creation when user is not team member", async () => {
      const noteData = {
        title: "Unauthorized Note",
        content: "This should not be created",
        teamId: createdTeamId
      };

      const response = await app.handle(
        new Request(`http://localhost/api/v1/teams/${createdTeamId}/notes`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${nonTeamToken}`,
          },
          body: JSON.stringify(noteData),
        })
      );

      expect(response.status).toBe(403);
      const responseData = await response.json();
      expect(responseData.success).toBe(false);
    });

    it("should return validation error for invalid data", async () => {
      const noteData = {
        title: "", // Empty title should fail validation
        content: "Content without title",
        teamId: createdTeamId
      };

      const response = await app.handle(
        new Request(`http://localhost/api/v1/teams/${createdTeamId}/notes`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${authToken}`,
          },
          body: JSON.stringify(noteData),
        })
      );

      expect(response.status).toBe(422);
    });
  });

  describe("GET /notes", () => {
    it("should get all notes for teams user belongs to", async () => {
      const response = await app.handle(
        new Request(`http://localhost/api/v1/teams/${createdTeamId}/notes`, {
          method: "GET",
          headers: {
            "Authorization": `Bearer ${authToken}`,
          },
        })
      );

      expect(response.status).toBe(200);
      const responseData = await response.json();
      expect(responseData.success).toBe(true);
      expect(Array.isArray(responseData.data)).toBe(true);
      expect(responseData.data.length).toBeGreaterThan(0);
    });

    it("should get notes for specific team", async () => {
      const response = await app.handle(
        new Request(`http://localhost/api/v1/teams/${createdTeamId}/notes`, {
          method: "GET",
          headers: {
            "Authorization": `Bearer ${authToken}`,
          },
        })
      );

      expect(response.status).toBe(200);
      const responseData = await response.json();
      expect(responseData.success).toBe(true);
      expect(Array.isArray(responseData.data)).toBe(true);
      responseData.data.forEach((note: any) => {
        expect(note.teamId).toBe(createdTeamId);
      });
    });
  });

  describe("PUT /notes/:id", () => {
    it("should update a note when user is team member", async () => {
      const updateData = {
        title: "Updated Test Note",
        content: "Updated content"
      };

      const response = await app.handle(
        new Request(`http://localhost/api/v1/teams/${createdTeamId}/notes/${createdNoteId}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${authToken}`,
          },
          body: JSON.stringify(updateData),
        })
      );

      expect(response.status).toBe(200);
      const responseData = await response.json();
      expect(responseData.success).toBe(true);
      expect(responseData.data.title).toBe(updateData.title);
      expect(responseData.data.content).toBe(updateData.content);
    });

    it("should allow team member to update note", async () => {
      const updateData = {
        title: "Updated by Member",
        content: "Content updated by team member"
      };

      const response = await app.handle(
        new Request(`http://localhost/api/v1/teams/${createdTeamId}/notes/${createdNoteId}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${teamMemberToken}`,
          },
          body: JSON.stringify(updateData),
        })
      );

      expect(response.status).toBe(200);
      const responseData = await response.json();
      expect(responseData.success).toBe(true);
    });

    it("should deny update when user is not team member", async () => {
      const updateData = {
        title: "Unauthorized Update",
        content: "This should not work"
      };

      const response = await app.handle(
        new Request(`http://localhost/api/v1/teams/${createdTeamId}/notes/${createdNoteId}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${nonTeamToken}`,
          },
          body: JSON.stringify(updateData),
        })
      );

      expect(response.status).toBe(403);
      const responseData = await response.json();
      expect(responseData.success).toBe(false);
    });

    it("should return 404 for non-existent note", async () => {
      const updateData = {
        title: "Update Non-existent",
        content: "This note doesn't exist"
      };

      const response = await app.handle(
        new Request(`http://localhost/api/v1/teams/${createdTeamId}/notes/non-existent-id`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${authToken}`,
          },
          body: JSON.stringify(updateData),
        })
      );

      expect(response.status).toBe(404);
      const responseData = await response.json();
      expect(responseData.success).toBe(false);
    });
  });

  describe("DELETE /notes/:id", () => {
    it("should delete a note when user is team member", async () => {
      // First create a note to delete
      const noteData = {
        title: "Note to Delete",
        content: "This note will be deleted",
        teamId: createdTeamId
      };

      const createResponse = await app.handle(
        new Request(`http://localhost/api/v1/teams/${createdTeamId}/notes`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${authToken}`,
          },
          body: JSON.stringify(noteData),
        })
      );

      const createData = await createResponse.json();
      const noteToDeleteId = createData.data.id;

      // Now delete it
      const response = await app.handle(
        new Request(`http://localhost/api/v1/teams/${createdTeamId}/notes/${noteToDeleteId}`, {
          method: "DELETE",
          headers: {
            "Authorization": `Bearer ${authToken}`,
          },
        })
      );

      expect(response.status).toBe(200);
      const responseData = await response.json();
      expect(responseData.success).toBe(true);

      // Verify it's deleted by trying to fetch it
      const fetchResponse = await app.handle(
        new Request(`http://localhost/api/v1/teams/${createdTeamId}/notes/${noteToDeleteId}`, {
          method: "GET",
          headers: {
            "Authorization": `Bearer ${authToken}`,
          },
        })
      );

      expect(fetchResponse.status).toBe(404);
    });

    it("should allow team member to delete note", async () => {
      // Create a note first
      const noteData = {
        title: "Member Delete Note",
        content: "This note will be deleted by member",
        teamId: createdTeamId
      };

      const createResponse = await app.handle(
        new Request(`http://localhost/api/v1/teams/${createdTeamId}/notes`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${teamMemberToken}`,
          },
          body: JSON.stringify(noteData),
        })
      );

      const createData = await createResponse.json();
      const noteToDeleteId = createData.data.id;

      // Delete with team owner
      const response = await app.handle(
        new Request(`http://localhost/api/v1/teams/${createdTeamId}/notes/${noteToDeleteId}`, {
          method: "DELETE",
          headers: {
            "Authorization": `Bearer ${authToken}`,
          },
        })
      );

      expect(response.status).toBe(200);
    });

    it("should deny delete when user is not team member", async () => {
      const response = await app.handle(
        new Request(`http://localhost/api/v1/teams/${createdTeamId}/notes/${createdNoteId}`, {
          method: "DELETE",
          headers: {
            "Authorization": `Bearer ${nonTeamToken}`,
          },
        })
      );

      expect(response.status).toBe(403);
      const responseData = await response.json();
      expect(responseData.success).toBe(false);
    });

    it("should return 404 for non-existent note", async () => {
      const response = await app.handle(
        new Request(`http://localhost/api/v1/teams/${createdTeamId}/notes/non-existent-id`, {
          method: "DELETE",
          headers: {
            "Authorization": `Bearer ${authToken}`,
          },
        })
      );

      expect(response.status).toBe(404);
      const responseData = await response.json();
      expect(responseData.success).toBe(false);
    });
  });

  describe("GET /notes/:id", () => {
    it("should get a specific note when user is team member", async () => {
      const response = await app.handle(
        new Request(`http://localhost/api/v1/teams/${createdTeamId}/notes/${createdNoteId}`, {
          method: "GET",
          headers: {
            "Authorization": `Bearer ${authToken}`,
          },
        })
      );

      expect(response.status).toBe(200);
      const responseData = await response.json();
      expect(responseData.success).toBe(true);
      expect(responseData.data.id).toBe(createdNoteId);
    });

    it("should deny access when user is not team member", async () => {
      const response = await app.handle(
        new Request(`http://localhost/api/v1/teams/${createdTeamId}/notes/${createdNoteId}`, {
          method: "GET",
          headers: {
            "Authorization": `Bearer ${nonTeamToken}`,
          },
        })
      );

      expect(response.status).toBe(403);
      const responseData = await response.json();
      expect(responseData.success).toBe(false);
    });
  });
});
