import { describe, it, expect } from "bun:test";
import { logPlugin } from "@/plugins/log.plugin";
import { Elysia } from "elysia";

describe("Log Plugin", () => {
  describe("logPlugin", () => {
    it("should add logging functionality to Elysia app", () => {
      const app = new Elysia();
      const appWithLog = logPlugin(app);
      
      // Verify the app is returned and still functional
      expect(appWithLog).toBeDefined();
      expect(appWithLog).toBeInstanceOf(Elysia);
    });
    
    it("should handle requests without errors", async () => {
      const app = new Elysia();
      const appWithLog = logPlugin(app);
      
      // Add a simple test route
      appWithLog.get("/test-log", () => {
        return { message: "Test log endpoint" };
      });
      
      const response = await appWithLog.handle(
        new Request("http://localhost/test-log")
      );
      
      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(data).toHaveProperty("message", "Test log endpoint");
    });
    
    it("should handle POST requests with logging", async () => {
      const app = new Elysia();
      const appWithLog = logPlugin(app);
      
      // Add a POST test route
      appWithLog.post("/test-log-post", ({ body }) => {
        return { received: body };
      });
      
      const response = await appWithLog.handle(
        new Request("http://localhost/test-log-post", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ test: "data" })
        })
      );
      
      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(data).toHaveProperty("received");
    });
    
    it("should handle error responses with logging", async () => {
      const app = new Elysia();
      const appWithLog = logPlugin(app);
      
      // Add an error test route
      appWithLog.get("/test-log-error", () => {
        throw new Error("Test error for logging");
      });
      
      const response = await appWithLog.handle(
        new Request("http://localhost/test-log-error")
      );
      
      // Should still handle the request, even with error
      expect(response).toBeDefined();
      expect(response.status).toBeGreaterThanOrEqual(400);
    });
    
    it("should handle different HTTP methods", async () => {
      const app = new Elysia();
      const appWithLog = logPlugin(app);
      
      // Add routes for different methods
      appWithLog.get("/test-get", () => ({ method: "GET" }));
      appWithLog.post("/test-post", () => ({ method: "POST" }));
      appWithLog.put("/test-put", () => ({ method: "PUT" }));
      appWithLog.delete("/test-delete", () => ({ method: "DELETE" }));
      
      // Test GET
      const getResponse = await appWithLog.handle(
        new Request("http://localhost/test-get")
      );
      expect(getResponse.status).toBe(200);
      
      // Test POST
      const postResponse = await appWithLog.handle(
        new Request("http://localhost/test-post", { method: "POST" })
      );
      expect(postResponse.status).toBe(200);
      
      // Test PUT
      const putResponse = await appWithLog.handle(
        new Request("http://localhost/test-put", { method: "PUT" })
      );
      expect(putResponse.status).toBe(200);
      
      // Test DELETE
      const deleteResponse = await appWithLog.handle(
        new Request("http://localhost/test-delete", { method: "DELETE" })
      );
      expect(deleteResponse.status).toBe(200);
    });
    
    it("should handle requests with different content types", async () => {
      const app = new Elysia();
      const appWithLog = logPlugin(app);
      
      appWithLog.post("/test-content-type", ({ body, headers }) => {
        return { 
          contentType: headers["content-type"], 
          bodyReceived: !!body 
        };
      });
      
      // Test with JSON
      const jsonResponse = await appWithLog.handle(
        new Request("http://localhost/test-content-type", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ test: "data" })
        })
      );
      expect(jsonResponse.status).toBe(200);
      
      // Test with form data
      const formResponse = await appWithLog.handle(
        new Request("http://localhost/test-content-type", {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: "test=data"
        })
      );
      expect(formResponse.status).toBe(200);
    });
  });
});
