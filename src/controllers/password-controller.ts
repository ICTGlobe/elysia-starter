import * as argon2 from "argon2";

import { BadRequestError } from "@/errors/bad-request-error";
import Elysia from "elysia";
import { User } from "@/drizzle/schema/users";
import { forgotPasswordRequest } from "@/requests/password/forgot-password-request";
import { logging } from "@/logging";
import { resetPasswordRequest } from "@/requests/password/reset-password-request";
import { services } from "@/service";

export const passwordController = new Elysia({
  prefix: "password",
  detail: {
    tags: ["Password"],
  },
})
  .use(services)
  .use(logging)

  /**
   * Forgot your password
   */
  .post(
    "/forgot",
    async ({ userService, passwordService, log, body }) => {
      let user: User;

      try {
        user = await userService.getUserByEmail(body.email);
      } catch (error) {
        log.error(error);
        throw new BadRequestError("Invalid email address");
      }

      let token = await passwordService.generatePasswordResetToken(user.id);
      // TODO: Send Password Reset instructions to the user

      return { message: "Password reset instructions sent" };
    },
    forgotPasswordRequest
  )

  /**
   * Reset User Password
   */
  .post(
    "/reset",
    async ({ userService, passwordService, log, body }) => {
      try {
        let user = await userService.getUserByEmail(body.email);
        let token = await passwordService.validatePasswordResetToken(
          body.token
        );

        await userService.updateUser(user.id, {
          password: await argon2.hash(body.password),
        });

        await passwordService.deletePasswordResetToken(token.id);
      } catch (error) {
        log.error(error);
        throw new BadRequestError("Invalid token");
      }

      return { message: "Password reset was successful" };
    },
    resetPasswordRequest
  );
