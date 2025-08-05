import { t } from "elysia";

export const getNoteRequest = {
  params: t.Object({
    teamId: t.String({ minLength: 1 }),
    id: t.String({ minLength: 1 }),
  }),
};
