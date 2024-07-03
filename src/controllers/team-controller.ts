import { BadRequestError } from "@/errors/bad-request-error";
import { Elysia } from "elysia";
import { Team } from "@/drizzle/schema/teams";
import TeamService from "@/services/team-service";
import { createTeamRequest } from "@/requests/teams/create-team-request";
import { currentUser } from "@/middleware/current-user";
import { deleteTeamRequest } from "@/requests/teams/delete-team-request";
import { getTeamRequest } from "@/requests/teams/get-team-request";
import { updateTeamRequest } from "@/requests/teams/update-team-request";

const teamService = new TeamService();

export const teamsController = new Elysia({
  prefix: "teams",
  detail: {
    tags: ["Teams"],
  },
})
  .use(currentUser)

  /**
   * Get all teams
   *
   * @returns {Promise<Team[]>}
   */
  .get("/", async ({ currentUser }): Promise<Team[]> => {
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
    async ({ currentUser, params: { id } }): Promise<Team> => {
      let team = await teamService.getTeamById(id);

      if (!team) {
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
    async ({ body, currentUser }): Promise<Team> => {
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
    async ({ currentUser, body, params: { id } }): Promise<Team> => {
      let team = await teamService.getTeamById(id);
      if (!team) {
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
    async ({ currentUser, params: { id } }) => {
      let team = await teamService.getTeamById(id);
      if (!team) {
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
