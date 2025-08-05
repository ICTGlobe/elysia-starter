import { describe, it, expect, beforeEach, afterEach } from "bun:test";
import TeamInvitationService from "@/services/team-invitation-service";
import { database } from "@/database";
import { teamInvitation } from "@/drizzle/schema/teamInvitation";
import { teams } from "@/drizzle/schema/teams";
import { users } from "@/drizzle/schema/users";
import { createId } from "@paralleldrive/cuid2";

describe("TeamInvitationService", () => {
  let teamInvitationService: TeamInvitationService;
  let testUserId: string;
  let testTeamId: string;
  let testInvitationId: string;

  beforeEach(async () => {
    teamInvitationService = new TeamInvitationService();
    
    // Create a test user
    testUserId = createId();
    await database.insert(users).values({
      id: testUserId,
      name: "Test User",
      email: "test@example.com",
      password: "hashedpassword",
    });

    // Create a test team
    testTeamId = createId();
    await database.insert(teams).values({
      id: testTeamId,
      name: "Test Team",
      ownerId: testUserId,
      isPrivate: true,
    });

    // Create a test invitation
    testInvitationId = createId();
    await database.insert(teamInvitation).values({
      id: testInvitationId,
      teamId: testTeamId,
      email: "invite@example.com",
      role: "member",
    });
  });

  afterEach(async () => {
    // Clean up test data
    await database.delete(teamInvitation).execute();
    await database.delete(teams).execute();
    await database.delete(users).execute();
  });

  describe("getTeamInvitations", () => {
    it("should return invitations for the specified team", async () => {
      const result = await teamInvitationService.getTeamInvitations(testTeamId);
      
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(testInvitationId);
      expect(result[0].teamId).toBe(testTeamId);
      expect(result[0].email).toBe("invite@example.com");
      expect(result[0].role).toBe("member");
    });

    it("should return empty array for team with no invitations", async () => {
      const newTeamId = createId();
      await database.insert(teams).values({
        id: newTeamId,
        name: "New Team",
        ownerId: testUserId,
        isPrivate: false,
      });

      const result = await teamInvitationService.getTeamInvitations(newTeamId);
      expect(result).toHaveLength(0);
    });

    it("should respect limit parameter", async () => {
      // Create additional invitations
      for (let i = 0; i < 5; i++) {
        const invitationId = createId();
        await database.insert(teamInvitation).values({
          id: invitationId,
          teamId: testTeamId,
          email: `invite${i}@example.com`,
          role: "member",
        });
      }

      const result = await teamInvitationService.getTeamInvitations(testTeamId, 3);
      expect(result).toHaveLength(3);
    });

    it("should respect offset parameter", async () => {
      // Create additional invitations
      for (let i = 0; i < 3; i++) {
        const invitationId = createId();
        await database.insert(teamInvitation).values({
          id: invitationId,
          teamId: testTeamId,
          email: `invite${i}@example.com`,
          role: "member",
        });
      }

      const allInvitations = await teamInvitationService.getTeamInvitations(testTeamId);
      const offsetResult = await teamInvitationService.getTeamInvitations(testTeamId, 10, 2);
      
      expect(offsetResult).toHaveLength(2); // Should have 2 invitations after offset
      expect(offsetResult[0].id).not.toBe(allInvitations[0].id);
    });

    it("should handle null/undefined teamId gracefully", async () => {
      const result1 = await teamInvitationService.getTeamInvitations(null as any);
      const result2 = await teamInvitationService.getTeamInvitations(undefined as any);
      const result3 = await teamInvitationService.getTeamInvitations("");

      expect(result1).toHaveLength(0);
      expect(result2).toHaveLength(0);
      expect(result3).toHaveLength(0);
    });

    it("should handle negative limit and offset gracefully", async () => {
      const result = await teamInvitationService.getTeamInvitations(testTeamId, -1, -1);
      expect(result).toBeInstanceOf(Array);
    });

    it("should handle non-existent teamId gracefully", async () => {
      const nonExistentTeamId = createId();
      const result = await teamInvitationService.getTeamInvitations(nonExistentTeamId);
      expect(result).toHaveLength(0);
    });
  });

  describe("getTeamInvitationById", () => {
    it("should return invitation when found", async () => {
      const result = await teamInvitationService.getTeamInvitationById(testInvitationId);
      
      expect(result.id).toBe(testInvitationId);
      expect(result.teamId).toBe(testTeamId);
      expect(result.email).toBe("invite@example.com");
      expect(result.role).toBe("member");
    });

    it("should throw error when invitation not found", async () => {
      const nonExistentId = createId();
      
      await expect(teamInvitationService.getTeamInvitationById(nonExistentId)).rejects.toThrow("Invitation not found");
    });

    it("should throw descriptive error for null/undefined invitationId", async () => {
      await expect(teamInvitationService.getTeamInvitationById(null as any)).rejects.toThrow("Invitation ID is required");
      await expect(teamInvitationService.getTeamInvitationById(undefined as any)).rejects.toThrow("Invitation ID is required");
      await expect(teamInvitationService.getTeamInvitationById("")).rejects.toThrow("Invitation ID cannot be empty");
    });
  });

  describe("createTeamInvitation", () => {
    it("should create a new team invitation successfully", async () => {
      const newInvitationData = {
        teamId: testTeamId,
        email: "new@example.com",
        role: "admin",
      };

      const result = await teamInvitationService.createTeamInvitation(newInvitationData);
      
      expect(result.teamId).toBe(testTeamId);
      expect(result.email).toBe("new@example.com");
      expect(result.role).toBe("admin");
      expect(result.id).toBeDefined();
      expect(result.createdAt).toBeDefined();
      expect(result.updatedAt).toBeDefined();
    });

    it("should throw descriptive error for invalid data", async () => {
      await expect(teamInvitationService.createTeamInvitation(null as any)).rejects.toThrow("Invitation data is required");
      await expect(teamInvitationService.createTeamInvitation(undefined as any)).rejects.toThrow("Invitation data is required");
      
      await expect(teamInvitationService.createTeamInvitation({} as any)).rejects.toThrow("Team ID is required");
      
      await expect(teamInvitationService.createTeamInvitation({
        teamId: "",
        email: "test@example.com",
        role: "member",
      })).rejects.toThrow("Team ID cannot be empty");

      await expect(teamInvitationService.createTeamInvitation({
        teamId: testTeamId,
        email: "",
        role: "member",
      })).rejects.toThrow("Email cannot be empty");

      await expect(teamInvitationService.createTeamInvitation({
        teamId: testTeamId,
        email: "test@example.com",
        role: "",
      })).rejects.toThrow("Role cannot be empty");

      await expect(teamInvitationService.createTeamInvitation({
        teamId: null as any,
        email: "test@example.com",
        role: "member",
      })).rejects.toThrow("Team ID is required");

      await expect(teamInvitationService.createTeamInvitation({
        teamId: testTeamId,
        email: null as any,
        role: "member",
      })).rejects.toThrow("Email is required");

      await expect(teamInvitationService.createTeamInvitation({
        teamId: testTeamId,
        email: "test@example.com",
        role: null as any,
      })).rejects.toThrow("Role is required");
    });

    it("should validate email format", async () => {
      await expect(teamInvitationService.createTeamInvitation({
        teamId: testTeamId,
        email: "invalid-email",
        role: "member",
      })).rejects.toThrow("Invalid email format");

      await expect(teamInvitationService.createTeamInvitation({
        teamId: testTeamId,
        email: "test@",
        role: "member",
      })).rejects.toThrow("Invalid email format");

      await expect(teamInvitationService.createTeamInvitation({
        teamId: testTeamId,
        email: "@example.com",
        role: "member",
      })).rejects.toThrow("Invalid email format");
    });

    it("should validate role values", async () => {
      await expect(teamInvitationService.createTeamInvitation({
        teamId: testTeamId,
        email: "test@example.com",
        role: "invalid-role",
      })).rejects.toThrow("Invalid role. Must be 'member' or 'admin'");
    });

    it("should handle database constraint violations", async () => {
      const invalidTeamData = {
        teamId: "nonexistent-team-id",
        email: "test@example.com",
        role: "member",
      };

      await expect(teamInvitationService.createTeamInvitation(invalidTeamData)).rejects.toThrow();
    });

    it("should allow duplicate emails for different teams", async () => {
      const anotherTeamId = createId();
      await database.insert(teams).values({
        id: anotherTeamId,
        name: "Another Team",
        ownerId: testUserId,
        isPrivate: false,
      });

      const invitation1 = await teamInvitationService.createTeamInvitation({
        teamId: testTeamId,
        email: "duplicate@example.com",
        role: "member",
      });

      const invitation2 = await teamInvitationService.createTeamInvitation({
        teamId: anotherTeamId,
        email: "duplicate@example.com",
        role: "admin",
      });

      expect(invitation1.email).toBe("duplicate@example.com");
      expect(invitation2.email).toBe("duplicate@example.com");
      expect(invitation1.teamId).not.toBe(invitation2.teamId);
    });
  });

  describe("deleteTeamInvitationById", () => {
    it("should delete invitation successfully", async () => {
      await teamInvitationService.deleteTeamInvitationById(testInvitationId);
      
      // Verify invitation is deleted
      await expect(teamInvitationService.getTeamInvitationById(testInvitationId)).rejects.toThrow("Invitation not found");
    });

    it("should throw descriptive error for invalid invitationId", async () => {
      await expect(teamInvitationService.deleteTeamInvitationById(null as any)).rejects.toThrow("Invitation ID is required");
      await expect(teamInvitationService.deleteTeamInvitationById(undefined as any)).rejects.toThrow("Invitation ID is required");
      await expect(teamInvitationService.deleteTeamInvitationById("")).rejects.toThrow("Invitation ID cannot be empty");
    });

    it("should handle deleting non-existent invitation gracefully", async () => {
      const nonExistentId = createId();
      
      // Should not throw error for non-existent invitation
      await expect(teamInvitationService.deleteTeamInvitationById(nonExistentId)).resolves.toBeUndefined();
    });

    it("should not affect other invitations", async () => {
      // Create another invitation
      const anotherInvitationId = createId();
      await database.insert(teamInvitation).values({
        id: anotherInvitationId,
        teamId: testTeamId,
        email: "another@example.com",
        role: "admin",
      });

      await teamInvitationService.deleteTeamInvitationById(testInvitationId);

      // Other invitation should still exist
      const remainingInvitation = await teamInvitationService.getTeamInvitationById(anotherInvitationId);
      expect(remainingInvitation.id).toBe(anotherInvitationId);
    });
  });

  describe("Edge Cases and Data Integrity", () => {
    it("should maintain data consistency across operations", async () => {
      const newInvitation = await teamInvitationService.createTeamInvitation({
        teamId: testTeamId,
        email: "consistency@example.com",
        role: "member",
      });

      const retrieved = await teamInvitationService.getTeamInvitationById(newInvitation.id);
      expect(retrieved.teamId).toBe(newInvitation.teamId);
      expect(retrieved.email).toBe(newInvitation.email);
      expect(retrieved.role).toBe(newInvitation.role);

      await teamInvitationService.deleteTeamInvitationById(newInvitation.id);
      await expect(teamInvitationService.getTeamInvitationById(newInvitation.id)).rejects.toThrow("Invitation not found");
    });

    it("should handle special characters in emails properly", async () => {
      const specialEmailInvitation = await teamInvitationService.createTeamInvitation({
        teamId: testTeamId,
        email: "test+special.email@example-domain.co.uk",
        role: "member",
      });

      expect(specialEmailInvitation.email).toBe("test+special.email@example-domain.co.uk");
    });

    it("should preserve case sensitivity in emails", async () => {
      const mixedCaseEmail = "Test.User@Example.COM";
      const invitation = await teamInvitationService.createTeamInvitation({
        teamId: testTeamId,
        email: mixedCaseEmail,
        role: "member",
      });

      expect(invitation.email).toBe(mixedCaseEmail);
    });
  });
});
