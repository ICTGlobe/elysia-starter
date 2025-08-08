import { describe, expect, it, beforeAll, afterAll, beforeEach } from "bun:test";
import { database } from "@/database";
import { users } from "@/drizzle/schema/users";
import { teams } from "@/drizzle/schema/teams";
import { teamUser } from "@/drizzle/schema/teamUser";
import TeamStaffService from "@/services/team-staff-service";

describe("TeamStaffService", () => {
  let teamStaffService: TeamStaffService;
  let testUser1: any;
  let testUser2: any;
  let testTeam: any;

  beforeAll(async () => {
    teamStaffService = new TeamStaffService();
  });

  beforeEach(async () => {
    // Clean up database
    await database.delete(teamUser).execute();
    await database.delete(teams).execute();
    await database.delete(users).execute();

    // Create test users
    testUser1 = await database
      .insert(users)
      .values({
        name: "Test User 1",
        email: "user1@test.com",
        password: "hashedpassword",
      })
      .returning()
      .get();

    testUser2 = await database
      .insert(users)
      .values({
        name: "Test User 2",
        email: "user2@test.com",
        password: "hashedpassword",
      })
      .returning()
      .get();

    // Create test team
    testTeam = await database
      .insert(teams)
      .values({
        name: "Test Team",
        ownerId: testUser1.id,
        isPrivate: true,
      })
      .returning()
      .get();
  });

  afterAll(async () => {
    // Clean up database
    await database.delete(teamUser).execute();
    await database.delete(teams).execute();
    await database.delete(users).execute();
  });

  describe("getTeamMembers", () => {
    it("should return empty array when team has no members", async () => {
      const members = await teamStaffService.getTeamMembers(testTeam.id);
      expect(members).toEqual([]);
    });

    it("should return team members when team has members", async () => {
      // Add a member first
      await database
        .insert(teamUser)
        .values({
          teamId: testTeam.id,
          userId: testUser2.id,
          role: "member",
        })
        .execute();

      const members = await teamStaffService.getTeamMembers(testTeam.id);
      expect(members).toHaveLength(1);
      expect(members[0].userId).toBe(testUser2.id);
      expect(members[0].role).toBe("member");
      expect(members[0].user.id).toBe(testUser2.id);
      expect(members[0].user.name).toBe(testUser2.name);
      expect(members[0].user.email).toBe(testUser2.email);
    });

    it("should throw error when team ID is empty", async () => {
      await expect(teamStaffService.getTeamMembers("")).rejects.toThrow("Team ID is required");
    });
  });

  describe("getTeamMember", () => {
    it("should return team member when member exists", async () => {
      // Add a member first
      const memberRecord = await database
        .insert(teamUser)
        .values({
          teamId: testTeam.id,
          userId: testUser2.id,
          role: "member",
        })
        .returning()
        .get();

      const member = await teamStaffService.getTeamMember(testTeam.id, memberRecord.id);
      expect(member.userId).toBe(testUser2.id);
      expect(member.role).toBe("member");
      expect(member.user.id).toBe(testUser2.id);
    });

    it("should throw error when member does not exist", async () => {
      await expect(teamStaffService.getTeamMember(testTeam.id, "nonexistent")).rejects.toThrow("Team member not found");
    });

    it("should throw error when team ID is empty", async () => {
      await expect(teamStaffService.getTeamMember("", "memberid")).rejects.toThrow("Team ID is required");
    });
  });

  describe("addTeamMember", () => {
    it("should add a new member to the team", async () => {
      const member = await teamStaffService.addTeamMember({
        teamId: testTeam.id,
        userId: testUser2.id,
        role: "admin",
      });

      expect(member.userId).toBe(testUser2.id);
      expect(member.role).toBe("admin");
      expect(member.teamId).toBe(testTeam.id);
      expect(member.user.id).toBe(testUser2.id);
    });

    it("should throw error when user is already a member", async () => {
      // Add member first
      await teamStaffService.addTeamMember({
        teamId: testTeam.id,
        userId: testUser2.id,
        role: "member",
      });

      // Try to add the same user again
      await expect(
        teamStaffService.addTeamMember({
          teamId: testTeam.id,
          userId: testUser2.id,
          role: "admin",
        })
      ).rejects.toThrow("User is already a member of this team");
    });

    it("should throw error when team does not exist", async () => {
      await expect(
        teamStaffService.addTeamMember({
          teamId: "nonexistent",
          userId: testUser2.id,
          role: "member",
        })
      ).rejects.toThrow("Team not found");
    });

    it("should throw error when user does not exist", async () => {
      await expect(
        teamStaffService.addTeamMember({
          teamId: testTeam.id,
          userId: "nonexistent",
          role: "member",
        })
      ).rejects.toThrow("User not found");
    });
  });

  describe("updateTeamMemberRole", () => {
    it("should update member role", async () => {
      // Add a member first
      const memberRecord = await database
        .insert(teamUser)
        .values({
          teamId: testTeam.id,
          userId: testUser2.id,
          role: "member",
        })
        .returning()
        .get();

      const updatedMember = await teamStaffService.updateTeamMemberRole(testTeam.id, memberRecord.id, "admin");
      expect(updatedMember.role).toBe("admin");
    });

    it("should throw error when member does not exist", async () => {
      await expect(
        teamStaffService.updateTeamMemberRole(testTeam.id, "nonexistent", "admin")
      ).rejects.toThrow("Team member not found");
    });
  });

  describe("removeTeamMember", () => {
    it("should remove member from team", async () => {
      // Add a member first
      const memberRecord = await database
        .insert(teamUser)
        .values({
          teamId: testTeam.id,
          userId: testUser2.id,
          role: "member",
        })
        .returning()
        .get();

      await teamStaffService.removeTeamMember(testTeam.id, memberRecord.id);

      // Verify member is removed
      const members = await teamStaffService.getTeamMembers(testTeam.id);
      expect(members).toHaveLength(0);
    });

    it("should throw error when member does not exist", async () => {
      await expect(
        teamStaffService.removeTeamMember(testTeam.id, "nonexistent")
      ).rejects.toThrow("Team member not found");
    });
  });

  describe("isTeamMember", () => {
    it("should return true when user is a team member", async () => {
      // Add a member first
      await database
        .insert(teamUser)
        .values({
          teamId: testTeam.id,
          userId: testUser2.id,
          role: "member",
        })
        .execute();

      const isMember = await teamStaffService.isTeamMember(testTeam.id, testUser2.id);
      expect(isMember).toBe(true);
    });

    it("should return false when user is not a team member", async () => {
      const isMember = await teamStaffService.isTeamMember(testTeam.id, testUser2.id);
      expect(isMember).toBe(false);
    });

    it("should return false when team ID is empty", async () => {
      const isMember = await teamStaffService.isTeamMember("", testUser2.id);
      expect(isMember).toBe(false);
    });
  });

  describe("getTeamMemberByUserId", () => {
    it("should return member when user is a team member", async () => {
      // Add a member first
      await database
        .insert(teamUser)
        .values({
          teamId: testTeam.id,
          userId: testUser2.id,
          role: "member",
        })
        .execute();

      const member = await teamStaffService.getTeamMemberByUserId(testTeam.id, testUser2.id);
      expect(member).not.toBeNull();
      expect(member!.userId).toBe(testUser2.id);
      expect(member!.role).toBe("member");
    });

    it("should return null when user is not a team member", async () => {
      const member = await teamStaffService.getTeamMemberByUserId(testTeam.id, testUser2.id);
      expect(member).toBeNull();
    });
  });
});
