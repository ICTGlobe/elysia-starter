import {
  InferInsertModel,
  InferSelectModel,
  relations,
  sql,
} from "drizzle-orm";
import { sqliteTable, text } from "drizzle-orm/sqlite-core";

import { createId } from "@paralleldrive/cuid2";
import { teamUser } from "./teamUser";
import { teams } from "./teams";

export const users = sqliteTable("users", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => createId()),
  name: text("name").notNull(),
  email: text("email").notNull(),
  password: text("password").notNull(),
  createdAt: text("created_at")
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at")
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
});

export const userRelations = relations(users, ({ one, many }) => ({
  teamMembers: many(teamUser),
  team: one(teams, {
    fields: [users.id],
    references: [teams.ownerId],
  }),
}));

export type User = InferSelectModel<typeof users>;
export type NewUser = InferInsertModel<typeof users>;
