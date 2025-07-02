import { Elysia } from "elysia";
import { database } from "@/database";
import { dbResponse } from "@/responses/health/db-response";
import { humanFileSize } from "@/util";
import { memoryResponse } from "@/responses/health/memory-response";
import { memoryUsage } from "bun:jsc";
import { sql } from "drizzle-orm";
import os from 'os';

export const healthController = new Elysia({
  prefix: "health",
  detail: {
    tags: ["Health"],
  },
})
  /**
   * Default health handler
   */
  .get("/", async () => {
    return {
      host: os.hostname(),
      status: "ok",
    };
  })

  /**
   * Get the current memory usage
   */
  .get(
    "/memory",
    () => {
      const memory = memoryUsage();

      return {
        current: humanFileSize(memory.current),
        peak: humanFileSize(memory.peak),
        currentCommit: humanFileSize(memory.currentCommit),
        peakCommit: humanFileSize(memory.peakCommit),
        pageFaults: humanFileSize(memory.pageFaults),
      };
    },
    {
      response: memoryResponse,
    }
  )

  /*
   * Database Health handler
   */
  .get(
    "/db",
    async () => {
      const beforeQuery = performance.now();
      try {
        await database.run(sql`select 1`).execute();
      } catch (error) {
        console.log(error);
      }
      const afterQuery = performance.now();

      return {
        latency: `${(afterQuery - beforeQuery).toFixed()} ms`,
      };
    },
    {
      response: dbResponse,
    }
  );
