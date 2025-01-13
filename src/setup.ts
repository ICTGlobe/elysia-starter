import * as Sentry from "@sentry/bun";

import { Elysia, NotFoundError, ValidationError } from "elysia";

import { CustomError } from "@/errors/custom-error";
import { RequestValidationError } from "@/errors/request-validation-error";
import cron from "@elysiajs/cron";
import { humanFileSize } from "./util";
import { memoryUsage } from "bun:jsc";

export const setupCron = (app: Elysia) =>
  app.use(
    cron({
      name: "heartbeat",
      pattern: "*/10 * * * * *",
      run() {
        const memory = memoryUsage();
        console.log(
          Object.entries(memory).map(([key, value]) => [
            key,
            humanFileSize(value),
          ])
        );
      },
    })
  );

export const setupErrorHandler = (app: Elysia) =>
  app.onError(({ error }) => {
    if (error instanceof NotFoundError) {
      return {
        errors: [{ message: "Not found" }],
      };
    }

    if (error instanceof ValidationError) {
      let err = new RequestValidationError(error);
      return {
        errors: err.serializeErrors(),
      };
    }

    if (error instanceof CustomError) {
      return {
        errors: error.serializeErrors(),
      };
    }

    Sentry.captureException(error);
    return {
      errors: [{ message: "Internal server error" }],
    };
  });
