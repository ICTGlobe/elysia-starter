import { t } from "elysia";

export const updateNoteRequest = t.Object({
  title: t.Optional(t.String({ minLength: 1, maxLength: 255 })),
  content: t.Optional(t.String({ minLength: 1 })),
});
