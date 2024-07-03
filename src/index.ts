import * as Sentry from "@sentry/bun";

import { app } from "./app";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  tracesSampleRate: 1.0,
});

app.listen(process.env.PORT || 3000);

console.log(
  `🦊 ElysiaJS API is running at ${app.server?.hostname}:${app.server?.port} `
);
