import { describe, expect, it, beforeAll, afterAll } from "bun:test";
import { database } from "@/database";
import { users } from "@/drizzle/schema/users";
import { teams } from "@/drizzle/schema/teams";
import { teamUser } from "@/drizzle/schema/teamUser";
import { notes } from "@/drizzle/schema/notes";
import { eq } from "drizzle-orm";
import { createId } from "@paralleldrive/cuid2";
import NotesService from "@/services/notes-service";
import argon2 from "argon2";

describe("NotesService", () => {
  const notesService = new NotesService();
  let testUserId: string;
  let anotherUserId: string;
  let testTeamId: string;
  let testNoteId: string;

  // Clean up test data
  const cleanupTestData = async () => {
    try {
      await database.delete(notes);
      await database.delete(teamUser);
      await database.delete(teams);
      await database.delete(users);
    } catch (error) {
      // Ignore cleanup errors
    }
  };

  beforeAll(async () => {
    await cleanupTestData();

    // Create test users
    const hashedPassword = await argon2.hash("testPassword123");
    
    const [testUser] = await database.insert(users).values({
      id: createId(),
      name: "Test User",
      email: `test-${Date.now()}@example.com`,
      password: hashedPassword,
    }).returning();
    testUserId = testUser.id;

    const [anotherUser] = await database.insert(users).values({
      id: createId(),
      name: "Another User",
      email: `another-${Date.now()}@example.com`,
      password: hashedPassword,
    }).returning();
    anotherUserId = anotherUser.id;

    // Create test team
    const [testTeam] = await database.insert(teams).values({
      id: createId(),
      name: "Test Team",
      ownerId: testUserId,
      isPrivate: false,
    }).returning();
    testTeamId = testTeam.id;

    // Add test user to team
    await database.insert(teamUser).values({
      userId: testUserId,
      teamId: testTeamId,
      role: "member",
    });
  });

  afterAll(async () => {
    await cleanupTestData();
  });

  describe("createNote", () => {
    it("should create a note successfully", async () => {
      const noteData = {
        title: "Test Note",
        content: "Test content",
        teamId: testTeamId,
        authorId: testUserId,
      };

      const result = await notesService.createNote(noteData);

      expect(result).toBeDefined();
      expect(result.title).toBe(noteData.title);
      expect(result.content).toBe(noteData.content);
      expect(result.teamId).toBe(noteData.teamId);
      expect(result.authorId).toBe(noteData.authorId);
      expect(result.id).toBeDefined();

      testNoteId = result.id;
    });

    it("should throw error when team doesn't exist", async () => {
      const noteData = {
        title: "Test Note",
        content: "Test content",
        teamId: "non-existent-team-id",
        authorId: testUserId,
      };

      await expect(notesService.createNote(noteData)).rejects.toThrow();
    });
  });

  describe("getNotesByUserId", () => {
    it("should get notes for teams user belongs to", async () => {
      const notes = await notesService.getNotesByUserId(testUserId);

      expect(Array.isArray(notes)).toBe(true);
      expect(notes.length).toBeGreaterThan(0);
      expect(notes[0]).toHaveProperty('id');
      expect(notes[0]).toHaveProperty('title');
      expect(notes[0]).toHaveProperty('content');
    });

    it("should return empty array for user not in any teams", async () => {
      const notes = await notesService.getNotesByUserId(anotherUserId);

      expect(Array.isArray(notes)).toBe(true);
      expect(notes.length).toBe(0);
    });
  });

  describe("getNotesByTeamId", () => {
    it("should get notes for specific team", async () => {
      const notes = await notesService.getNotesByTeamId(testTeamId, testUserId);

      expect(Array.isArray(notes)).toBe(true);
      expect(notes.length).toBeGreaterThan(0);
      notes.forEach((note: any) => {
        expect(note.teamId).toBe(testTeamId);
      });
    });

    it("should throw error when user is not team member", async () => {
      await expect(
        notesService.getNotesByTeamId(testTeamId, anotherUserId)
      ).rejects.toThrow();
    });
  });

  describe("getNoteById", () => {
    it("should get note by id when user is team member", async () => {
      const note = await notesService.getNoteById(testNoteId, testUserId);

      expect(note).toBeDefined();
      expect(note.id).toBe(testNoteId);
    });

    it("should throw error when user is not team member", async () => {
      await expect(
        notesService.getNoteById(testNoteId, anotherUserId)
      ).rejects.toThrow();
    });

    it("should throw error when note doesn't exist", async () => {
      await expect(
        notesService.getNoteById("non-existent-id", testUserId)
      ).rejects.toThrow();
    });
  });

  describe("updateNote", () => {
    it("should update note when user is team member", async () => {
      const updateData = {
        title: "Updated Title",
        content: "Updated content",
      };

      const updatedNote = await notesService.updateNote(
        testNoteId,
        updateData,
        testUserId
      );

      expect(updatedNote.title).toBe(updateData.title);
      expect(updatedNote.content).toBe(updateData.content);
    });

    it("should throw error when user is not team member", async () => {
      const updateData = {
        title: "Unauthorized Update",
        content: "This should fail",
      };

      await expect(
        notesService.updateNote(testNoteId, updateData, anotherUserId)
      ).rejects.toThrow();
    });

    it("should throw error when note doesn't exist", async () => {
      const updateData = {
        title: "Update Non-existent",
        content: "This should fail",
      };

      await expect(
        notesService.updateNote("non-existent-id", updateData, testUserId)
      ).rejects.toThrow();
    });
  });

  describe("deleteNote", () => {
    it("should delete note when user is team member", async () => {
      // Create a note to delete
      const noteData = {
        title: "Note to Delete",
        content: "This will be deleted",
        teamId: testTeamId,
        authorId: testUserId,
      };

      const createdNote = await notesService.createNote(noteData);
      
      const result = await notesService.deleteNote(createdNote.id, testUserId);
      expect(result).toBe(true);

      // Verify it's deleted
      await expect(
        notesService.getNoteById(createdNote.id, testUserId)
      ).rejects.toThrow();
    });

    it("should throw error when user is not team member", async () => {
      await expect(
        notesService.deleteNote(testNoteId, anotherUserId)
      ).rejects.toThrow();
    });

    it("should throw error when note doesn't exist", async () => {
      await expect(
        notesService.deleteNote("non-existent-id", testUserId)
      ).rejects.toThrow();
    });
  });

  describe("isUserTeamMember", () => {
    it("should return true when user is team member", async () => {
      const isMember = await notesService.isUserTeamMember(testUserId, testTeamId);
      expect(isMember).toBe(true);
    });

    it("should return false when user is not team member", async () => {
      const isMember = await notesService.isUserTeamMember(anotherUserId, testTeamId);
      expect(isMember).toBe(false);
    });
  });
});
