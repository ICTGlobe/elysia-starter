import Elysia from "elysia";
import { ServerError } from "@/errors/server-error";
import { TeamInvitation } from "@/drizzle/schema/teamInvitation";
import { createTeamInvitation } from "@/requests/team-invitations/create-team-invitation-request";
import { currentUser } from "@/middleware/current-user";
import { logging } from "@/logging";
import { services } from "@/service";

export const teamInvitationController = new Elysia({
  prefix: "teams/:id",
  detail: {
    tags: ["Team Invitations"],
  },
})
  .use(currentUser)
  .use(logging)
  .use(services)

  /**
   * Get all team Invitations
   */
  .get(
    "/invitations",
    async ({
      params: { id },
      log,
      teamInvitationService,
    }): Promise<TeamInvitation[]> => {
      let invitations: TeamInvitation[];

      try {
        invitations = await teamInvitationService.getTeamInvitations(id);
      } catch (error) {
        log.error(error);
        throw new ServerError();
      }

      return invitations;
    }
  )

  /**
   * Get the team Invitation
   */
  .get(
    "/invitations/:invitation",
    async ({
      params: { invitation },
      log,
      teamInvitationService,
    }): Promise<TeamInvitation> => {
      let teamInvitation: TeamInvitation;

      try {
        teamInvitation =
          await teamInvitationService.getTeamInvitationById(invitation);
      } catch (error) {
        log.error(error);
        throw new ServerError();
      }

      return teamInvitation;
    }
  )

  /**
   * Delete the team Invitation
   */
  .delete(
    "/invitations/:invitation",
    async ({ params: { invitation }, log, teamInvitationService }) => {
      try {
        await teamInvitationService.deleteTeamInvitationById(invitation);
      } catch (error) {
        log.error(error);
        throw new ServerError();
      }

      return { message: "Team invitation deleted" };
    }
  )

  /**
   * Create a new team invitation
   */
  .post(
    "/invitations",
    async ({
      params: { id },
      body,
      teamInvitationService,
      log,
    }): Promise<TeamInvitation> => {
      let invitation: TeamInvitation;

      try {
        invitation = await teamInvitationService.createTeamInvitation({
          teamId: id,
          ...body,
        });
      } catch (error) {
        log.error(error);
        throw new ServerError();
      }

      return invitation;
    },
    createTeamInvitation
  );
