import { BadRequestError } from "@/errors/bad-request-error";
import { Elysia } from "elysia";
import { TeamMemberResponse } from "@/responses/teams/team-member-response";
import { services } from "@/service";
import { currentUser } from "@/middleware/current-user";
import { getTeamStaffRequest } from "@/requests/teams/get-team-staff-request";
import { addTeamMemberRequest } from "@/requests/teams/add-team-member-request";
import { updateTeamMemberRequest } from "@/requests/teams/update-team-member-request";
import { removeTeamMemberRequest } from "@/requests/teams/remove-team-member-request";

export const teamStaffController = new Elysia({
  prefix: "teams/:id",
  detail: {
    tags: ["Team Staff Management"],
  },
})
  .use(currentUser)
  .use(services)

  /**
   * Get all team members
   *
   * @param {string} id - Team ID
   * @returns {Promise<TeamMemberResponse[]>}
   */
  .get(
    "/members",
    async ({ currentUser, params: { id }, teamService, teamStaffService }): Promise<TeamMemberResponse[]> => {
      let team;
      
      try {
        team = await teamService.getTeamById(id);
      } catch (error) {
        throw new BadRequestError("Team not found");
      }

      // Only team owner can view team members
      if (team.ownerId !== currentUser.id) {
        throw new BadRequestError(
          "You do not have permission to view this team's members"
        );
      }

      return await teamStaffService.getTeamMembers(id);
    },
    getTeamStaffRequest
  )

  /**
   * Add a new member to the team
   *
   * @param {string} id - Team ID
   * @param {Object} body - Member data
   * @returns {Promise<TeamMemberResponse>}
   */
  .post(
    "/members",
    async ({ currentUser, params: { id }, body, teamService, teamStaffService }): Promise<TeamMemberResponse> => {
      let team;
      
      try {
        team = await teamService.getTeamById(id);
      } catch (error) {
        throw new BadRequestError("Team not found");
      }

      // Only team owner can add members
      if (team.ownerId !== currentUser.id) {
        throw new BadRequestError(
          "You do not have permission to add members to this team"
        );
      }

      // Prevent adding yourself as a member (owner is already associated with the team)
      if (body.userId === currentUser.id) {
        throw new BadRequestError("You cannot add yourself as a team member");
      }

      try {
        return await teamStaffService.addTeamMember({
          teamId: id,
          userId: body.userId,
          role: body.role,
        });
      } catch (error) {
        if (error instanceof Error) {
          throw new BadRequestError(error.message);
        }
        throw new BadRequestError("Failed to add team member");
      }
    },
    addTeamMemberRequest
  )

  /**
   * Update a team member's role
   *
   * @param {string} id - Team ID
   * @param {string} memberId - Member ID
   * @param {Object} body - Role data
   * @returns {Promise<TeamMemberResponse>}
   */
  .put(
    "/members/:memberId",
    async ({ currentUser, params: { id, memberId }, body, teamService, teamStaffService }): Promise<TeamMemberResponse> => {
      let team;
      
      try {
        team = await teamService.getTeamById(id);
      } catch (error) {
        throw new BadRequestError("Team not found");
      }

      // Only team owner can update member roles
      if (team.ownerId !== currentUser.id) {
        throw new BadRequestError(
          "You do not have permission to update member roles in this team"
        );
      }

      try {
        return await teamStaffService.updateTeamMemberRole(id, memberId, body.role);
      } catch (error) {
        if (error instanceof Error) {
          throw new BadRequestError(error.message);
        }
        throw new BadRequestError("Failed to update team member role");
      }
    },
    updateTeamMemberRequest
  )

  /**
   * Remove a member from the team
   *
   * @param {string} id - Team ID
   * @param {string} memberId - Member ID
   * @returns {Promise<{ message: string }>}
   */
  .delete(
    "/members/:memberId",
    async ({ currentUser, params: { id, memberId }, teamService, teamStaffService }) => {
      let team;
      
      try {
        team = await teamService.getTeamById(id);
      } catch (error) {
        throw new BadRequestError("Team not found");
      }

      // Only team owner can remove members
      if (team.ownerId !== currentUser.id) {
        throw new BadRequestError(
          "You do not have permission to remove members from this team"
        );
      }

      // Get the member to check if they exist
      let member;
      try {
        member = await teamStaffService.getTeamMember(id, memberId);
      } catch (error) {
        throw new BadRequestError("Team member not found");
      }

      // Prevent removing yourself (owner should not be removed as a member)
      if (member.userId === currentUser.id) {
        throw new BadRequestError("You cannot remove yourself from the team");
      }

      try {
        await teamStaffService.removeTeamMember(id, memberId);
        return { message: "Team member removed successfully" };
      } catch (error) {
        if (error instanceof Error) {
          throw new BadRequestError(error.message);
        }
        throw new BadRequestError("Failed to remove team member");
      }
    },
    removeTeamMemberRequest
  );
