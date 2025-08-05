import { describe, it, expect, beforeEach, afterEach } from "bun:test";
import TeamService from "@/services/team-service";
import { database } from "@/database";
import { teams } from "@/drizzle/schema/teams";
import { users } from "@/drizzle/schema/users";
import { createId } from "@paralleldrive/cuid2";

describe("TeamService", () => {
  let teamService: TeamService;
  let testUserId: string;
  let testTeamId: string;

  beforeEach(async () => {
    teamService = new TeamService();
    
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
  });

  afterEach(async () => {
    // Clean up test data
    await database.delete(teams).execute();
    await database.delete(users).execute();
  });

  describe("getAllUserTeams", () => {
    it("should return teams owned by the user", async () => {
      const result = await teamService.getAllUserTeams(testUserId);
      
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(testTeamId);
      expect(result[0].name).toBe("Test Team");
      expect(result[0].ownerId).toBe(testUserId);
    });

    it("should return empty array for user with no teams", async () => {
      const newUserId = createId();
      await database.insert(users).values({
        id: newUserId,
        name: "New User",
        email: "new@example.com",
        password: "hashedpassword",
      });

      const result = await teamService.getAllUserTeams(newUserId);
      expect(result).toHaveLength(0);
    });

    it("should respect limit parameter", async () => {
      // Create additional teams
      const additionalTeamIds = [];
      for (let i = 0; i < 5; i++) {
        const teamId = createId();
        additionalTeamIds.push(teamId);
        await database.insert(teams).values({
          id: teamId,
          name: `Additional Team ${i}`,
          ownerId: testUserId,
          isPrivate: false,
        });
      }

      const result = await teamService.getAllUserTeams(testUserId, 3);
      expect(result).toHaveLength(3);
    });

    it("should respect offset parameter", async () => {
      // Create additional teams
      for (let i = 0; i < 3; i++) {
        const teamId = createId();
        await database.insert(teams).values({
          id: teamId,
          name: `Additional Team ${i}`,
          ownerId: testUserId,
          isPrivate: false,
        });
      }

      const allTeams = await teamService.getAllUserTeams(testUserId);
      const offsetResult = await teamService.getAllUserTeams(testUserId, 10, 2);
      
      expect(offsetResult).toHaveLength(2); // Should have 2 teams after offset
      expect(offsetResult[0].id).not.toBe(allTeams[0].id);
    });

    it("should handle null/undefined userId gracefully", async () => {
      const result1 = await teamService.getAllUserTeams(null as any);
      const result2 = await teamService.getAllUserTeams(undefined as any);
      const result3 = await teamService.getAllUserTeams("");

      expect(result1).toHaveLength(0);
      expect(result2).toHaveLength(0);
      expect(result3).toHaveLength(0);
    });

    it("should handle negative limit and offset gracefully", async () => {
      const result = await teamService.getAllUserTeams(testUserId, -1, -1);
      expect(result).toBeInstanceOf(Array);
    });
  });

  describe("getTeamById", () => {
    it("should return team when found", async () => {
      const result = await teamService.getTeamById(testTeamId);
      
      expect(result.id).toBe(testTeamId);
      expect(result.name).toBe("Test Team");
      expect(result.ownerId).toBe(testUserId);
    });

    it("should throw error when team not found", async () => {
      const nonExistentId = createId();
      
      await expect(teamService.getTeamById(nonExistentId)).rejects.toThrow("Team not found");
    });

    it("should throw descriptive error for null/undefined teamId", async () => {
      await expect(teamService.getTeamById(null as any)).rejects.toThrow("Team ID is required");
      await expect(teamService.getTeamById(undefined as any)).rejects.toThrow("Team ID is required");
      await expect(teamService.getTeamById("")).rejects.toThrow("Team ID cannot be empty");
    });
  });

  describe("createTeam", () => {
    it("should create a new team successfully", async () => {
      const newTeamData = {
        name: "New Team",
        ownerId: testUserId,
        isPrivate: false,
      };

      const result = await teamService.createTeam(newTeamData);
      
      expect(result.name).toBe("New Team");
      expect(result.ownerId).toBe(testUserId);
      expect(result.isPrivate).toBe(false);
      expect(result.id).toBeDefined();
      expect(result.createdAt).toBeDefined();
      expect(result.updatedAt).toBeDefined();
    });

    it("should create team with default isPrivate value", async () => {
      const newTeamData = {
        name: "New Team",
        ownerId: testUserId,
      };

      const result = await teamService.createTeam(newTeamData);
      
      expect(result.isPrivate).toBe(true); // Default value
    });

    it("should throw descriptive error for invalid data", async () => {
      await expect(teamService.createTeam(null as any)).rejects.toThrow("Team data is required");
      await expect(teamService.createTeam(undefined as any)).rejects.toThrow("Team data is required");
      
      await expect(teamService.createTeam({} as any)).rejects.toThrow("Team name is required");
      
      await expect(teamService.createTeam({
        name: "",
        ownerId: testUserId,
      })).rejects.toThrow("Team name cannot be empty");

      await expect(teamService.createTeam({
        name: "Valid Name",
        ownerId: "",
      })).rejects.toThrow("Owner ID cannot be empty");

      await expect(teamService.createTeam({
        name: "Valid Name",
        ownerId: null as any,
      })).rejects.toThrow("Owner ID is required");
    });

    it("should handle database constraint violations", async () => {
      const invalidOwnerData = {
        name: "New Team",
        ownerId: "nonexistent-user-id",
      };

      await expect(teamService.createTeam(invalidOwnerData)).rejects.toThrow();
    });
  });

  describe("updateTeam", () => {
    it("should update team successfully", async () => {
      const updateData = {
        name: "Updated Team Name",
        isPrivate: false,
      };

      const result = await teamService.updateTeam(testTeamId, updateData);
      
      expect(result.name).toBe("Updated Team Name");
      expect(result.isPrivate).toBe(false);
      expect(result.id).toBe(testTeamId);
      expect(result.updatedAt).toBeDefined();
    });

    it("should update only provided fields", async () => {
      const updateData = { name: "New Name Only" };

      const result = await teamService.updateTeam(testTeamId, updateData);
      
      expect(result.name).toBe("New Name Only");
      expect(result.ownerId).toBe(testUserId); // Should remain unchanged
      expect(result.isPrivate).toBe(true); // Should remain unchanged
    });

    it("should throw descriptive error for invalid teamId", async () => {
      const updateData = { name: "New Name" };

      await expect(teamService.updateTeam(null as any, updateData)).rejects.toThrow("Team ID is required");
      await expect(teamService.updateTeam(undefined as any, updateData)).rejects.toThrow("Team ID is required");
      await expect(teamService.updateTeam("", updateData)).rejects.toThrow("Team ID cannot be empty");
    });

    it("should throw descriptive error for invalid update data", async () => {
      await expect(teamService.updateTeam(testTeamId, null as any)).rejects.toThrow("Update data is required");
      await expect(teamService.updateTeam(testTeamId, undefined as any)).rejects.toThrow("Update data is required");
    });

    it("should handle empty update data gracefully", async () => {
      const result = await teamService.updateTeam(testTeamId, {});
      expect(result.id).toBe(testTeamId);
    });

    it("should validate update data fields", async () => {
      await expect(teamService.updateTeam(testTeamId, { name: "" })).rejects.toThrow("Team name cannot be empty");
      await expect(teamService.updateTeam(testTeamId, { ownerId: "" })).rejects.toThrow("Owner ID cannot be empty");
      await expect(teamService.updateTeam(testTeamId, { ownerId: null as any })).rejects.toThrow("Owner ID cannot be null");
    });

    it("should throw error when team doesn't exist", async () => {
      const nonExistentId = createId();
      const updateData = { name: "New Name" };

      await expect(teamService.updateTeam(nonExistentId, updateData)).rejects.toThrow("Team not found");
    });

    it("should automatically update updatedAt timestamp", async () => {
      const originalTeam = await teamService.getTeamById(testTeamId);
      
      // Wait a bit to ensure different timestamp
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const result = await teamService.updateTeam(testTeamId, { name: "Updated Name" });
      
      expect(result.updatedAt).not.toBe(originalTeam.updatedAt);
    });
  });

  describe("deleteTeam", () => {
    it("should delete team successfully", async () => {
      await teamService.deleteTeam(testTeamId);
      
      // Verify team is deleted
      await expect(teamService.getTeamById(testTeamId)).rejects.toThrow("Team not found");
    });

    it("should throw descriptive error for invalid teamId", async () => {
      await expect(teamService.deleteTeam(null as any)).rejects.toThrow("Team ID is required");
      await expect(teamService.deleteTeam(undefined as any)).rejects.toThrow("Team ID is required");
      await expect(teamService.deleteTeam("")).rejects.toThrow("Team ID cannot be empty");
    });

    it("should handle deleting non-existent team gracefully", async () => {
      const nonExistentId = createId();
      
      // Should not throw error for non-existent team
      await expect(teamService.deleteTeam(nonExistentId)).resolves.toBeUndefined();
    });

    it("should not affect other teams", async () => {
      // Create another team
      const anotherTeamId = createId();
      await database.insert(teams).values({
        id: anotherTeamId,
        name: "Another Team",
        ownerId: testUserId,
        isPrivate: false,
      });

      await teamService.deleteTeam(testTeamId);

      // Other team should still exist
      const remainingTeam = await teamService.getTeamById(anotherTeamId);
      expect(remainingTeam.id).toBe(anotherTeamId);
    });
  });
});
