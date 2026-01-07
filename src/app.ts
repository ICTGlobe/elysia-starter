import { Elysia } from "elysia";
import { setupErrorHandler } from "@/setup";
import { corsPlugin, logPlugin, swaggerPlugin } from "@/plugins";
import { routes } from "./routes";
import { createQueueDashboard } from "./queue/dashboard";

export const app = new Elysia({ precompile: true })  
  .use(swaggerPlugin)
  .use(corsPlugin)
  .use(setupErrorHandler)
  .get("/", ({ redirect }) => redirect("/swagger"));

  if(process.env.LOGGING_ENABLED === 'true') {
    app.use(logPlugin)
  }  

  // Register Bull Queue Dashboard
  if (process.env.QUEUE_DASHBOARD_ENABLED === 'true') {
    app.use(createQueueDashboard())
  }

  // Register application routes
  app.use(routes);

export type App = typeof app;
