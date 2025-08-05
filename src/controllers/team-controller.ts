import { BadRequestError } from "@/errors/bad-request-error";
import { Elysia } from "elysia";
import { Team } from "@/drizzle/schema/teams";
import { services } from "@/service";
import { createTeamRequest } from "@/requests/teams/create-team-request";
import { currentUser } from "@/middleware/current-user";
import { deleteTeamRequest } from "@/requests/teams/delete-team-request";
import { getTeamRequest } from "@/requests/teams/get-team-request";
import { updateTeamRequest } from "@/requests/teams/update-team-request";

export const teamsController = new Elysia({
  prefix: "teams",
  detail: {
    tags: ["Teams"],
  },
})
  .use(currentUser)
  .use(services)

  /**
   * Get all teams
   *
   * @returns {Promise<Team[]>}
   */
  .get("/", async ({ currentUser, teamService }): Promise<Team[]> => {
    return await teamService.getAllUserTeams(currentUser.id);
  })

  /**
   * Get a team by ID
   *
   * @param {number} id
   *
   * @returns {Promise<Team>}
   */
  .get(
    "/:id",
    async ({ currentUser, params: { id }, teamService }): Promise<Team> => {
      let team;
      
      try {
        team = await teamService.getTeamById(id);
      } catch (error) {
        throw new BadRequestError("Team not found");
      }

      if (team.ownerId != currentUser.id) {
        throw new BadRequestError(
          "Team not found or you do not have permission to access it."
        );
      }

      return team;
    },
    getTeamRequest
  )

  /**
   * Create a new team
   *
   * @param {NewTeam} body
   *
   * @returns {Promise<Team>}
   */
  .post(
    "/",
    async ({ body, currentUser, teamService }): Promise<Team> => {
      let team = await teamService.createTeam({
        ...body,
        ownerId: currentUser.id,
      });

      return team;
    },
    createTeamRequest
  )

  /**
   * Update a team
   *
   * @param {number} id
   * @param {Partial<NewTeam>} body
   *
   * @returns {Promise<Team>}
   */
  .put(
    "/:id",
    async ({ currentUser, body, params: { id }, teamService }): Promise<Team> => {
      let team;
      
      try {
        team = await teamService.getTeamById(id);
      } catch (error) {
        throw new BadRequestError("Team not found");
      }

      if (team.ownerId != currentUser.id) {
        throw new BadRequestError(
          "You do not have permission to update this team"
        );
      }

      return await teamService.updateTeam(id, body);
    },
    updateTeamRequest
  )

  /**
   * Delete a team
   *
   * @param {number} id
   *
   * @returns {Promise<{ message: string }>}
   */
  .delete(
    "/:id",
    async ({ currentUser, params: { id }, teamService }) => {
      let team;
      
      try {
        team = await teamService.getTeamById(id);
      } catch (error) {
        throw new BadRequestError("Team not found");
      }

      if (team.ownerId != currentUser.id) {
        throw new BadRequestError(
          "You do not have permission to delete this team"
        );
      }

      await teamService.deleteTeam(id);
      return { message: "Team deleted successfully" };
    },
    deleteTeamRequest
  );
