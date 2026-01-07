import { Elysia } from "elysia";
import { setupErrorHandler } from "@/setup";
import { corsPlugin, logPlugin, swaggerPlugin } from "@/plugins";
import { routes } from "./routes";
import { createQueueDashboard } from "./queue/dashboard";

export const app = new Elysia({ precompile: true })  
  .use(swaggerPlugin)
  .use(corsPlugin)
  .use(logPlugin)
  .use(setupErrorHandler)
  .get("/", ({ redirect }) => redirect("/swagger"));

  // Register Bull Queue Dashboard
  if (process.env.NODE_ENV !== 'production') {
    app.use(createQueueDashboard());
  }

  // Register application routes
  app.use(routes);

export type App = typeof app;
