import { t } from "elysia";

export const getNotesQueryRequest = t.Object({
  teamId: t.Optional(t.String({ minLength: 1 })),
});
