import {
  NewTeamInvitation,
  TeamInvitation,
  teamInvitation,
} from "@/drizzle/schema/teamInvitation";

import { database } from "@/database";
import { eq } from "drizzle-orm";

export default class TeamInvitationService {
  /**
   * Get a list of team team invitations
   */
  async getTeamInvitations(
    teamId: string,
    limit: number = 10,
    offset: number = 0
  ): Promise<TeamInvitation[]> {
    // Handle null/undefined/empty teamId
    if (!teamId || teamId.trim() === "") {
      return [];
    }

    // Handle negative limit and offset
    const validLimit = Math.max(0, limit);
    const validOffset = Math.max(0, offset);

    return await database
      .select()
      .from(teamInvitation)
      .where(eq(teamInvitation.teamId, teamId))
      .limit(validLimit)
      .offset(validOffset)
      .execute();
  }

  /**
   * Get a team invitation by id
   */
  async getTeamInvitationById(id: string): Promise<TeamInvitation> {
    // Validate invitation ID
    if (id === null || id === undefined) {
      throw new Error("Invitation ID is required");
    }
    if (id === "") {
      throw new Error("Invitation ID cannot be empty");
    }

    let invitation = await database
      .select()
      .from(teamInvitation)
      .where(eq(teamInvitation.id, id))
      .limit(1)
      .get();

    if (!invitation) {
      throw new Error("Invitation not found");
    }

    return invitation;
  }

  /**
   * Delete a given team invitation
   */
  async deleteTeamInvitationById(id: string) {
    // Validate invitation ID
    if (id === null || id === undefined) {
      throw new Error("Invitation ID is required");
    }
    if (id === "") {
      throw new Error("Invitation ID cannot be empty");
    }

    await database
      .delete(teamInvitation)
      .where(eq(teamInvitation.id, id))
      .execute();
  }

  /**
   * Invite a new team member
   */
  async createTeamInvitation(data: NewTeamInvitation): Promise<TeamInvitation> {
    // Validate data
    if (data === null || data === undefined) {
      throw new Error("Invitation data is required");
    }

    // Validate required fields
    if (data.teamId === null || data.teamId === undefined) {
      throw new Error("Team ID is required");
    }
    if (data.teamId === "") {
      throw new Error("Team ID cannot be empty");
    }

    if (data.email === null || data.email === undefined) {
      throw new Error("Email is required");
    }
    if (data.email === "") {
      throw new Error("Email cannot be empty");
    }

    if (data.role === null || data.role === undefined) {
      throw new Error("Role is required");
    }
    if (data.role === "") {
      throw new Error("Role cannot be empty");
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.email)) {
      throw new Error("Invalid email format");
    }

    // Validate role values
    const validRoles = ["member", "admin"];
    if (!validRoles.includes(data.role)) {
      throw new Error("Invalid role. Must be 'member' or 'admin'");
    }

    return await database.insert(teamInvitation).values(data).returning().get();
  }
}
