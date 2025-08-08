import { t } from "elysia";

export const removeTeamMemberRequest = {
  params: t.Object({
    id: t.String(),
    memberId: t.String(),
  }),
};
