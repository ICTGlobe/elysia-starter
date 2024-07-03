import { AuthenticatedUser } from "@/types/authenticated-user";
import { Elysia } from "elysia";
import { currentUser } from "@/middleware/current-user";

export const usersController = new Elysia({
  prefix: "users",
  detail: {
    tags: ["Users"],
  },
})
  .use(currentUser)
  /**
   * Get the current user
   *
   * @returns {Promise<AuthenticatedUser>} The current user
   */
  .get("/me", async ({ currentUser }): Promise<AuthenticatedUser> => {
    return currentUser;
  });
