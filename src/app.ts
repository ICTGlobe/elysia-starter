import { Elysia } from "elysia";
import { setupErrorHandler } from "@/setup";
import { corsPlugin, logPlugin, swaggerPlugin } from "@/plugins";
import { routes } from "./routes";

export const app = new Elysia({ precompile: true })
  .use(swaggerPlugin)
  .use(corsPlugin)
  .use(logPlugin)
  .use(setupErrorHandler)
  .get("/", ({ redirect }) => redirect("/swagger"))
  .use(routes);

export type App = typeof app;
