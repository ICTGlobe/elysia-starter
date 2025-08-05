import { t } from "elysia";

export const createNoteRequest = t.Object({
  title: t.String({ minLength: 1, maxLength: 255 }),
  content: t.String({ minLength: 1 }),
});
