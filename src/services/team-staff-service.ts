import { database } from "@/database";
import { eq, and } from "drizzle-orm";
import { teamUser, TeamUser, NewTeamUser } from "@/drizzle/schema/teamUser";
import { users } from "@/drizzle/schema/users";
import { teams } from "@/drizzle/schema/teams";
import { TeamMemberResponse } from "@/responses/teams/team-member-response";

export default class TeamStaffService {
  /**
   * Get all team members for a specific team
   */
  async getTeamMembers(teamId: string): Promise<TeamMemberResponse[]> {
    if (!teamId || teamId.trim() === "") {
      throw new Error("Team ID is required");
    }

    const members = await database
      .select({
        id: teamUser.id,
        teamId: teamUser.teamId,
        userId: teamUser.userId,
        role: teamUser.role,
        createdAt: teamUser.createdAt,
        updatedAt: teamUser.updatedAt,
        user: {
          id: users.id,
          name: users.name,
          email: users.email,
        },
      })
      .from(teamUser)
      .innerJoin(users, eq(teamUser.userId, users.id))
      .where(eq(teamUser.teamId, teamId))
      .execute();

    return members;
  }

  /**
   * Get a specific team member
   */
  async getTeamMember(teamId: string, memberId: string): Promise<TeamMemberResponse> {
    if (!teamId || teamId.trim() === "") {
      throw new Error("Team ID is required");
    }
    if (!memberId || memberId.trim() === "") {
      throw new Error("Member ID is required");
    }

    const member = await database
      .select({
        id: teamUser.id,
        teamId: teamUser.teamId,
        userId: teamUser.userId,
        role: teamUser.role,
        createdAt: teamUser.createdAt,
        updatedAt: teamUser.updatedAt,
        user: {
          id: users.id,
          name: users.name,
          email: users.email,
        },
      })
      .from(teamUser)
      .innerJoin(users, eq(teamUser.userId, users.id))
      .where(and(eq(teamUser.teamId, teamId), eq(teamUser.id, memberId)))
      .limit(1)
      .get();

    if (!member) {
      throw new Error("Team member not found");
    }

    return member;
  }

  /**
   * Add a new member to a team
   */
  async addTeamMember(data: { teamId: string; userId: string; role: string }): Promise<TeamMemberResponse> {
    if (!data.teamId || data.teamId.trim() === "") {
      throw new Error("Team ID is required");
    }
    if (!data.userId || data.userId.trim() === "") {
      throw new Error("User ID is required");
    }
    if (!data.role || data.role.trim() === "") {
      throw new Error("Role is required");
    }

    // Check if team exists
    const team = await database
      .select()
      .from(teams)
      .where(eq(teams.id, data.teamId))
      .limit(1)
      .get();

    if (!team) {
      throw new Error("Team not found");
    }

    // Check if user exists
    const user = await database
      .select()
      .from(users)
      .where(eq(users.id, data.userId))
      .limit(1)
      .get();

    if (!user) {
      throw new Error("User not found");
    }

    // Check if user is already a member of this team
    const existingMember = await database
      .select()
      .from(teamUser)
      .where(and(eq(teamUser.teamId, data.teamId), eq(teamUser.userId, data.userId)))
      .limit(1)
      .get();

    if (existingMember) {
      throw new Error("User is already a member of this team");
    }

    // Add the user to the team
    const newMember = await database
      .insert(teamUser)
      .values({
        teamId: data.teamId,
        userId: data.userId,
        role: data.role,
      })
      .returning()
      .get();

    // Return the member with user details
    return await this.getTeamMember(data.teamId, newMember.id);
  }

  /**
   * Update a team member's role
   */
  async updateTeamMemberRole(teamId: string, memberId: string, role: string): Promise<TeamMemberResponse> {
    if (!teamId || teamId.trim() === "") {
      throw new Error("Team ID is required");
    }
    if (!memberId || memberId.trim() === "") {
      throw new Error("Member ID is required");
    }
    if (!role || role.trim() === "") {
      throw new Error("Role is required");
    }

    // Check if member exists
    await this.getTeamMember(teamId, memberId);

    // Update the role
    await database
      .update(teamUser)
      .set({
        role,
        updatedAt: new Date().toISOString(),
      })
      .where(and(eq(teamUser.teamId, teamId), eq(teamUser.id, memberId)))
      .execute();

    // Return the updated member
    return await this.getTeamMember(teamId, memberId);
  }

  /**
   * Remove a member from a team
   */
  async removeTeamMember(teamId: string, memberId: string): Promise<void> {
    if (!teamId || teamId.trim() === "") {
      throw new Error("Team ID is required");
    }
    if (!memberId || memberId.trim() === "") {
      throw new Error("Member ID is required");
    }

    // Check if member exists
    await this.getTeamMember(teamId, memberId);

    // Remove the member
    await database
      .delete(teamUser)
      .where(and(eq(teamUser.teamId, teamId), eq(teamUser.id, memberId)))
      .execute();
  }

  /**
   * Check if a user is a member of a team
   */
  async isTeamMember(teamId: string, userId: string): Promise<boolean> {
    if (!teamId || teamId.trim() === "") {
      return false;
    }
    if (!userId || userId.trim() === "") {
      return false;
    }

    const member = await database
      .select()
      .from(teamUser)
      .where(and(eq(teamUser.teamId, teamId), eq(teamUser.userId, userId)))
      .limit(1)
      .get();

    return !!member;
  }

  /**
   * Get team member by user ID
   */
  async getTeamMemberByUserId(teamId: string, userId: string): Promise<TeamMemberResponse | null> {
    if (!teamId || teamId.trim() === "") {
      return null;
    }
    if (!userId || userId.trim() === "") {
      return null;
    }

    const member = await database
      .select({
        id: teamUser.id,
        teamId: teamUser.teamId,
        userId: teamUser.userId,
        role: teamUser.role,
        createdAt: teamUser.createdAt,
        updatedAt: teamUser.updatedAt,
        user: {
          id: users.id,
          name: users.name,
          email: users.email,
        },
      })
      .from(teamUser)
      .innerJoin(users, eq(teamUser.userId, users.id))
      .where(and(eq(teamUser.teamId, teamId), eq(teamUser.userId, userId)))
      .limit(1)
      .get();

    return member || null;
  }
}
