import { t } from "elysia";

export const createTeamInvitation = {
  body: t.Object({
    email: t.String({
      format: "email",
      default: "john@example.com",
    }),
    role: t.String({}),
  }),
};
