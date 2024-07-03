import {
  InferInsertModel,
  InferSelectModel,
  relations,
  sql,
} from "drizzle-orm";
import { sqliteTable, text } from "drizzle-orm/sqlite-core";

import { createId } from "@paralleldrive/cuid2";
import { teams } from "./teams";

export const teamInvitation = sqliteTable("team_invitations", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => createId()),
  teamId: text("team_id")
    .notNull()
    .references(() => teams.id),
  role: text("role").notNull(),
  email: text("email").notNull(),
  createdAt: text("created_at")
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at")
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
});

export const teamInvitationRelations = relations(teamInvitation, ({ one }) => ({
  group: one(teams, {
    fields: [teamInvitation.teamId],
    references: [teams.id],
  }),
}));

export type TeamInvitation = InferSelectModel<typeof teamInvitation>;
export type NewTeamInvitation = InferInsertModel<typeof teamInvitation>;
