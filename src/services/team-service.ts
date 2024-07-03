import { NewTeam, Team, teams } from "@/drizzle/schema/teams";

import { database } from "@/database";
import { eq } from "drizzle-orm";

export default class TeamService {
  /**
   * Retrieve a list of all teams owned by a given user
   *
   * @param userId - the owners id
   * @param limit - the number of teams to retrieve
   * @param offset - the offset to start from
   *
   * @returns {Promise<Team[]>} - a listing of all the teams that belongs to a given user
   */
  async getAllUserTeams(
    userId: string,
    limit: number = 10,
    offset: number = 0
  ): Promise<Team[]> {
    return await database
      .select()
      .from(teams)
      .where(eq(teams.ownerId, userId))
      .limit(limit)
      .offset(offset)
      .execute();
  }

  /**
   * Retrieve a Team by their team id
   *
   * @param teamId - the teams id
   * @returns {Promise<Team>}
   */
  async getTeamById(teamId: string): Promise<Team> {
    let team = await database
      .select()
      .from(teams)
      .where(eq(teams.id, teamId))
      .limit(1)
      .get();

    if (!team) {
      throw new Error("Team not found");
    }

    return team;
  }

  /**
   * Create a new team
   */
  async createTeam(data: NewTeam): Promise<Team> {
    return await database.insert(teams).values(data).returning().get();
  }

  /**
   * Update a team
   */
  async updateTeam(teamId: string, data: Partial<NewTeam>): Promise<Team> {
    return await database
      .update(teams)
      .set(data)
      .where(eq(teams.id, teamId))
      .returning()
      .get();
  }

  /**
   * Delete a team
   */
  async deleteTeam(teamId: string): Promise<void> {
    await database.delete(teams).where(eq(teams.id, teamId)).execute();
  }
}
