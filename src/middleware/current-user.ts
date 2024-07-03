import * as jwt from "jsonwebtoken";

import { AuthenticatedUser } from "@/types/authenticated-user";
import { BadRequestError } from "@/errors/bad-request-error";
import { Elysia } from "elysia";
import bearer from "@elysiajs/bearer";

export const currentUser = (app: Elysia) =>
  app.use(bearer()).derive(({ bearer }) => ({
    get currentUser(): AuthenticatedUser {
      if (!bearer) {
        throw new BadRequestError("Unauthorized", 401);
      }

      try {
        return jwt.verify(bearer, process.env.JWT_SECRET!) as AuthenticatedUser;
      } catch (error) {
        throw new BadRequestError("Unauthorized", 401);
      }
    },
  }));
