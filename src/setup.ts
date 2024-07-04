import * as Sentry from "@sentry/bun";

import { Elysia, NotFoundError, ValidationError } from "elysia";

import { CustomError } from "@/errors/custom-error";
import { RequestValidationError } from "@/errors/request-validation-error";
import cron from "@elysiajs/cron";
import { humanFileSize } from "./util";
import logixlysia from "logixlysia";
import { memoryUsage } from "bun:jsc";
import swagger from "@elysiajs/swagger";

export const setupLogging = (app: Elysia) =>
  app.use(
    logixlysia({
      config: {
        ip: true,
        customLogFormat:
          "🪵 {now} {level} {duration} {method} {pathname} [{status}] {ip}",
        logFilter: {
          level: ["ERROR", "WARNING"],
          status: [500, 400],
        },
      },
    })
  );

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

export const setupSwagger = (app: Elysia) =>
  app.use(
    swagger({
      path: "/swagger",
      exclude: [/\/api\/v1\/admin/],
      autoDarkMode: true,
      documentation: {
        info: {
          title: "ElysiaJS API",
          description: "ElysiaJS API Documentation 🚀",
          version: "1.0.0",
        },
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
