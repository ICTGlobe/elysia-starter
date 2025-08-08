import { t } from "elysia";

export const updateTeamMemberRequest = {
  params: t.Object({
    id: t.String(),
    memberId: t.String(),
  }),
  body: t.Object({
    role: t.String(),
  }),
};
