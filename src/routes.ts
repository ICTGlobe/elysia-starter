import Elysia from "elysia";

import { authController } from "@/controllers/auth-controller";
import { healthController } from "@/controllers/health-controller";
import { notesController } from "@/controllers/notes-controller";
import { passwordController } from "@/controllers/password-controller";
import { profileController } from "@/controllers/profile-controller";
import { teamInvitationController } from "@/controllers/team-invitation-controller";
import { teamsController } from "@/controllers/team-controller";
import { usersController } from "@/controllers/user-controller";

export const routes = new Elysia({ prefix: "api/v1", precompile: true })
  .use(healthController)
  .use(authController)
  .use(passwordController)
  .use(usersController)
  .use(teamsController)
  .use(teamInvitationController)
  .use(profileController)
  .use(notesController);