import { t } from "elysia";

export const noteResponse = t.Object({
  id: t.String(),
  title: t.String(),
  content: t.String(),
  teamId: t.String(),
  authorId: t.String(),
  createdAt: t.String(),
  updatedAt: t.String(),
  authorName: t.Optional(t.String()),
  teamName: t.Optional(t.String()),
});
