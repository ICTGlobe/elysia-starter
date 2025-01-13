import * as systemSchema from "@/drizzle/schema";

import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";

/**
 * The main database client
 */
export const database = drizzle(
  createClient({
    url: process.env.DATABASE_URL!,
  }),
  {
    schema: systemSchema,
  }
);
