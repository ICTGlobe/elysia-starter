import { defineConfig } from "drizzle-kit"
export default defineConfig({
    dialect: "sqlite", // "postgresql" | "mysql"
    driver: "turso", // optional and used only if `aws-data-api`, `turso`, `d1-http`(WIP) or `expo` are used
    dbCredentials: {
        url: "file:./db.sqlite",
    },
  "schema": "./src/drizzle/schema",
  "out": "./src/drizzle/migrations"
})

