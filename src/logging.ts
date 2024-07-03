import { logger } from "@bogeychan/elysia-logger";
import Elysia from "elysia";

export const logging = new Elysia({ name: "logging" }).use(
  logger({
    level: "error",
  }),
);
