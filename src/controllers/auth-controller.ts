import * as argon2 from "argon2";

import { BadRequestError } from "@/errors/bad-request-error";
import { Elysia } from "elysia";
import { ServerError } from "@/errors/server-error";
import { User } from "@/drizzle/schema/users";
import { currentUser } from "@/middleware/current-user";
import { logging } from "@/logging";
import { services } from "@/service";
import { signinRequest } from "@/requests/auth/signin-request";
import { signinResponse } from "@/responses/auth/signin-response";
import { signupRequest } from "@/requests/auth/signup-request";
import { signupResponse } from "@/responses/auth/signup-response";
import { emit } from '@/events/event-bus'
import { UserRegistered } from '@/events/user-registered'

export const authController = new Elysia({
  prefix: "auth",
  detail: {
    tags: ["Auth"],
  },
})
  .use(services)
  .use(logging)

  /**
   * Sign in a user
   */
  .post(
    "/signin",
    async ({ log, userService, authService, body }) => {
      let user: User;

      try {
        user = await userService.getUserByEmail(body.email);
      } catch (error) {
        log.debug(error);
        throw new BadRequestError("Invalid email or password");
      }

      let passwordMatch = await argon2.verify(user.password, body.password);
      if (!passwordMatch) {
        throw new BadRequestError("Invalid email or password");
      }

      return {
        id: user.id,
        name: user.name,
        email: user.email,
        token: authService.generateUserJwt(user),
      };
    },
    {
      body: signinRequest,
      response: signinResponse,
    }
  )

  /**
   * Sign up a user
   */
  .post(
    "/signup",
    async ({ log, authService, teamService, body }) => {
      let user: User;

      try {
        let encryptedPassword = await argon2.hash(body.password);
        user = await authService.signup({
          ...body,
          password: encryptedPassword,
        });
      } catch (error) {
        log.error(error);
        throw new BadRequestError("Email already in use");
      }

      try {
        await teamService.createTeam({
          name: `${user.name}'s Team`,
          ownerId: user.id,
          isPrivate: true,
        });
      } catch (error) {
        log.error(error);
        await authService.deleteUser(user.id);
        throw new ServerError();
      }

       emit(new UserRegistered(user.id))

      return {
        id: user.id,
        name: user.name,
        email: user.email,
        token: authService.generateUserJwt(user),
      };
    },
    {
      body: signupRequest,
      response: signupResponse,
    }
  )

  /**
   * Refresh a user's JWT token
   */
  .use(currentUser)
  .post("/refresh", async ({ authService, currentUser }) => {
    let refreshedToken = await authService.refreshJwtToken(currentUser.id);

    return {
      id: currentUser.id,
      name: currentUser.name,
      email: currentUser.email,
      token: refreshedToken,
    };
  })

  /**
   * Logout the currently authenticated user
   */
  .post("/logout", async () => {
    return { message: "Logged out" };
  });
