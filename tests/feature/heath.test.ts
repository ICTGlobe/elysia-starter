import { describe, expect, it } from "bun:test";

import { app } from "@/app";

describe("Health endpoints", () => {
  it("returns health status", async () => {
    const response = await app
      .handle(new Request("http://localhost/api/v1/health"))
      .then((res) => res.json());

    expect(response).toEqual({ status: "ok" });
  });

  it("returns memory usage information", async () => {
    const response = await app
      .handle(new Request("http://localhost/api/v1/health/memory"));

    expect(response.status).toBe(200);
    
    const data = await response.json();
    
    // Verify the response structure matches memoryResponse schema
    expect(data).toHaveProperty("current");
    expect(data).toHaveProperty("peak");
    expect(data).toHaveProperty("currentCommit");
    expect(data).toHaveProperty("peakCommit");
    expect(data).toHaveProperty("pageFaults");
    
    // Verify all values are strings (formatted file sizes)
    expect(typeof data.current).toBe("string");
    expect(typeof data.peak).toBe("string");
    expect(typeof data.currentCommit).toBe("string");
    expect(typeof data.peakCommit).toBe("string");
    expect(typeof data.pageFaults).toBe("string");
    
    // Basic validation that values look like file sizes (contain numbers)
    expect(data.current).toMatch(/\d/);
    expect(data.peak).toMatch(/\d/);
    expect(data.currentCommit).toMatch(/\d/);
    expect(data.peakCommit).toMatch(/\d/);
  });

  it("returns database health information", async () => {
    const response = await app
      .handle(new Request("http://localhost/api/v1/health/db"));

    expect(response.status).toBe(200);
    
    const data = await response.json();
    
    // Verify the response structure matches dbResponse schema
    expect(data).toHaveProperty("latency");
    expect(typeof data.latency).toBe("string");
    
    // Verify latency format (should contain 'ms')
    expect(data.latency).toMatch(/\d+\s*ms/);
    
    // Verify latency is a reasonable value (should be 0 or greater)
    const latencyValue = parseFloat(data.latency);
    expect(latencyValue).toBeGreaterThanOrEqual(0);
    expect(latencyValue).toBeLessThan(10000); // 10 seconds max for a simple query
  });
});
