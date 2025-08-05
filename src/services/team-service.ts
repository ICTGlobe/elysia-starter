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
    // Handle null/undefined/empty userId
    if (!userId || userId.trim() === "") {
      return [];
    }

    // Handle negative limit and offset
    const validLimit = Math.max(0, limit);
    const validOffset = Math.max(0, offset);

    return await database
      .select()
      .from(teams)
      .where(eq(teams.ownerId, userId))
      .limit(validLimit)
      .offset(validOffset)
      .execute();
  }

  /**
   * Retrieve a Team by their team id
   *
   * @param teamId - the teams id
   * @returns {Promise<Team>}
   */
  async getTeamById(teamId: string): Promise<Team> {
    // Validate teamId
    if (teamId === null || teamId === undefined) {
      throw new Error("Team ID is required");
    }
    if (teamId === "") {
      throw new Error("Team ID cannot be empty");
    }

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
    // Validate data
    if (data === null || data === undefined) {
      throw new Error("Team data is required");
    }

    // Validate required fields
    if (!data.name && data.name !== "") {
      throw new Error("Team name is required");
    }
    if (data.name === "") {
      throw new Error("Team name cannot be empty");
    }

    if (data.ownerId === null || data.ownerId === undefined) {
      throw new Error("Owner ID is required");
    }
    if (data.ownerId === "") {
      throw new Error("Owner ID cannot be empty");
    }

    return await database.insert(teams).values(data).returning().get();
  }

  /**
   * Update a team
   */
  async updateTeam(teamId: string, data: Partial<NewTeam>): Promise<Team> {
    // Validate teamId
    if (teamId === null || teamId === undefined) {
      throw new Error("Team ID is required");
    }
    if (teamId === "") {
      throw new Error("Team ID cannot be empty");
    }

    // Validate update data
    if (data === null || data === undefined) {
      throw new Error("Update data is required");
    }

    // Handle empty update data
    if (Object.keys(data).length === 0) {
      return await this.getTeamById(teamId);
    }

    // Validate individual fields if provided
    if (data.name !== undefined) {
      if (data.name === "") {
        throw new Error("Team name cannot be empty");
      }
    }

    if (data.ownerId !== undefined) {
      if (data.ownerId === null) {
        throw new Error("Owner ID cannot be null");
      }
      if (data.ownerId === "") {
        throw new Error("Owner ID cannot be empty");
      }
    }

    // Add automatic timestamp update
    const updateData = {
      ...data,
      updatedAt: new Date().toISOString(),
    };

    // Check if team exists first
    await this.getTeamById(teamId);

    return await database
      .update(teams)
      .set(updateData)
      .where(eq(teams.id, teamId))
      .returning()
      .get();
  }

  /**
   * Delete a team
   */
  async deleteTeam(teamId: string): Promise<void> {
    // Validate teamId
    if (teamId === null || teamId === undefined) {
      throw new Error("Team ID is required");
    }
    if (teamId === "") {
      throw new Error("Team ID cannot be empty");
    }

    await database.delete(teams).where(eq(teams.id, teamId)).execute();
  }
}
