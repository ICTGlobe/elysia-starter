import Elysia from "elysia";
import logixlysia from "logixlysia";

export const logPlugin = (app: Elysia) =>
  app.use(
    /** @ts-ignore */
    logixlysia({
      config: {
        ip: true,
        customLogFormat:
          "🪵 {now} {level} {duration} {method} {pathname} [{status}] {ip}",
        logFilter: {
          level: ["INFO", "WARNING", "ERROR"],
          status: [200, 400, 500],
        },
      },
    })
  );
