import { setupErrorHandler, setupLogging, setupSwagger } from "@/setup";

import { Elysia } from "elysia";
import { authController } from "@/controllers/auth-controller";
import cors from "@elysiajs/cors";
import { healthController } from "@/controllers/health-controller";
import { helmet } from "elysia-helmet";
import { passwordController } from "@/controllers/password-controller";
import { profileController } from "@/controllers/profile-controller";
import { teamInvitationController } from "@/controllers/team-invitation-controller";
import { teamsController } from "@/controllers/team-controller";
import { usersController } from "@/controllers/user-controller";

export const app = new Elysia({ prefix: "/api/v1", precompile: true })
  .use(setupSwagger)
  .use(helmet())
  .use(cors())
  .use(setupLogging)
  .use(setupErrorHandler)
  .get("/", () => {
    return {
      message: "ElysiaJS API Server",
    };
  })
  .use(healthController)
  .use(authController)
  .use(passwordController)
  .use(usersController)
  .use(teamsController)
  .use(teamInvitationController)
  .use(profileController);

export type App = typeof app;
