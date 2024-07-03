import Elysia from "elysia";
import { ServerError } from "@/errors/server-error";
import { User } from "@/drizzle/schema/users";
import { currentUser } from "@/middleware/current-user";
import { logging } from "@/logging";
import { services } from "@/service";
import { updateProfileRequest } from "@/requests/profile/update-profile-request";

export const profileController = new Elysia({
  prefix: "profile",
  detail: {
    tags: ["Profile"],
  },
})
  .use(logging)
  .use(currentUser)
  .use(services)
  .get("/", async ({ log, currentUser, userService }): Promise<User> => {
    let user: User;
    try {
      user = await userService.getUserById(currentUser.id);
    } catch (error) {
      log.error(error);
      throw new ServerError();
    }

    return user;
  })
  .put(
    "/",
    async ({ set, log, userService, currentUser, body }) => {
      try {
        await userService.updateUser(currentUser.id, body);
      } catch (error) {
        log.error(error);
        throw new ServerError();
      }

      set.status = "No Content";
    },
    updateProfileRequest
  );
