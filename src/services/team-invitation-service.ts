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
    return await database
      .select()
      .from(teamInvitation)
      .where(eq(teamInvitation.teamId, teamId))
      .limit(limit)
      .offset(offset)
      .execute();
  }

  /**
   * Get a team invitation by id
   */
  async getTeamInvitationById(id: string): Promise<TeamInvitation> {
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
    await database
      .delete(teamInvitation)
      .where(eq(teamInvitation.id, id))
      .execute();
  }

  /**
   * Invite a new team member
   */
  async createTeamInvitation(data: NewTeamInvitation): Promise<TeamInvitation> {
    return await database.insert(teamInvitation).values(data).returning().get();
  }
}
