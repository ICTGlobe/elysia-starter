import { t } from "elysia";

export const addTeamMemberRequest = {
  params: t.Object({
    id: t.String(),
  }),
  body: t.Object({
    userId: t.String(),
    role: t.String(),
  }),
};
