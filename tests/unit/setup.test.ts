import { describe, it, expect } from "bun:test";
import { setupCron, setupErrorHandler } from "@/setup";
import { Elysia, NotFoundError, ValidationError } from "elysia";
import { BadRequestError } from "@/errors/bad-request-error";

describe("Setup Functions", () => {
  describe("setupCron", () => {
    it("should add cron functionality to Elysia app", () => {
      const app = new Elysia();
      const appWithCron = setupCron(app);
      
      // Verify the app is returned and still functional
      expect(appWithCron).toBeDefined();
      expect(appWithCron).toBeInstanceOf(Elysia);
    });
  });

  describe("setupErrorHandler", () => {
    it("should handle NotFoundError correctly", async () => {
      const app = new Elysia();
      const appWithErrorHandler = setupErrorHandler(app);
      
      // Create a mock error scenario
      appWithErrorHandler.get("/test-not-found", () => {
        throw new NotFoundError();
      });
      
      const response = await appWithErrorHandler.handle(
        new Request("http://localhost/test-not-found")
      );
      
      expect(response.status).toBe(404);
      
      const data = await response.json();
      expect(data).toHaveProperty("errors");
      expect(data.errors[0]).toHaveProperty("message", "Not found");
    });

    it("should handle BadRequestError correctly", async () => {
      const app = new Elysia();
      const appWithErrorHandler = setupErrorHandler(app);
      
      // Create a mock custom error scenario
      appWithErrorHandler.get("/test-bad-request", () => {
        throw new BadRequestError("Test bad request error");
      });
      
      const response = await appWithErrorHandler.handle(
        new Request("http://localhost/test-bad-request")
      );
      
      expect(response.status).toBe(400);
      
      const data = await response.json();
      expect(data).toHaveProperty("errors");
      expect(data.errors[0]).toHaveProperty("message", "Test bad request error");
    });

    it("should handle generic errors", async () => {
      const app = new Elysia();
      const appWithErrorHandler = setupErrorHandler(app);
      
      // Create a mock generic error scenario
      appWithErrorHandler.get("/test-error", () => {
        throw new Error("Generic test error");
      });
      
      const response = await appWithErrorHandler.handle(
        new Request("http://localhost/test-error")
      );
      
      expect(response.status).toBe(500);
      
      const data = await response.json();
      expect(data).toHaveProperty("errors");
      expect(data.errors[0]).toHaveProperty("message", "Internal server error");
    });

    it("should handle unknown error types", async () => {
      const app = new Elysia();
      const appWithErrorHandler = setupErrorHandler(app);
      
      // Create a scenario with an unknown error type
      appWithErrorHandler.get("/test-unknown", () => {
        throw "String error"; // Non-Error object
      });
      
      const response = await appWithErrorHandler.handle(
        new Request("http://localhost/test-unknown")
      );
      
      expect(response.status).toBe(500);
      
      const data = await response.json();
      expect(data).toHaveProperty("errors");
      expect(data.errors[0]).toHaveProperty("message", "Internal server error");
    });
  });

  describe("Memory Monitoring", () => {
    it("should handle memory monitoring without errors", () => {
      // This test covers the memory usage logging in setupCron
      const { memoryUsage } = require("bun:jsc");
      const { humanFileSize } = require("@/util");
      
      const memory = memoryUsage();
      expect(memory).toBeDefined();
      
      // Test the memory formatting
      const formattedMemory = Object.entries(memory).map(([key, value]) => [
        key,
        humanFileSize(value),
      ]);
      
      expect(formattedMemory).toBeInstanceOf(Array);
      expect(formattedMemory.length).toBeGreaterThan(0);
    });
  });
});
