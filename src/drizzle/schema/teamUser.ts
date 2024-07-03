import {
  InferInsertModel,
  InferSelectModel,
  relations,
  sql,
} from "drizzle-orm";
import { sqliteTable, text } from "drizzle-orm/sqlite-core";

import { createId } from "@paralleldrive/cuid2";
import { teams } from "./teams";
import { users } from "./users";

export const teamUser = sqliteTable("team_users", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => createId()),
  teamId: text("team_id")
    .notNull()
    .references(() => teams.id),
  userId: text("user_id")
    .notNull()
    .references(() => users.id),
  role: text("role").notNull(),
  createdAt: text("created_at")
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at")
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
});

export const usersToTeamsRelations = relations(teamUser, ({ one }) => ({
  group: one(teams, {
    fields: [teamUser.teamId],
    references: [teams.id],
  }),
  user: one(users, {
    fields: [teamUser.userId],
    references: [users.id],
  }),
}));

export type TeamUser = InferSelectModel<typeof teamUser>;
export type NewTeamUser = InferInsertModel<typeof teamUser>;
