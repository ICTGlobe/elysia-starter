import { defineConfig } from "drizzle-kit"

export default defineConfig({
    dialect: "sqlite",
    dbCredentials: {
        url: process.env.DATABASE_URL!,
    },
  schema: "./src/drizzle/schema",
  out: "./src/drizzle/migrations"
})

