import {
  InferInsertModel,
  InferSelectModel,
  relations,
  sql,
} from "drizzle-orm";
import { sqliteTable, text } from "drizzle-orm/sqlite-core";

import { createId } from "@paralleldrive/cuid2";
import { users } from "./users";

export const passwordResets = sqliteTable("password_resets", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => createId()),
  userId: text("user_id")
    .notNull()
    .references(() => users.id),
  token: text("token"),
  expiresAt: text("expires_at").notNull(),
  createdAt: text("created_at")
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at")
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
});

export const passwordResetsRelations = relations(passwordResets, ({ one }) => ({
  user: one(users, {
    fields: [passwordResets.userId],
    references: [users.id],
  }),
}));

export type PasswordReset = InferSelectModel<typeof passwordResets>;
export type NewPasswordReset = InferInsertModel<typeof passwordResets>;
