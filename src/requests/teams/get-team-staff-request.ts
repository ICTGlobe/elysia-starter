import { t } from "elysia";

export const getTeamStaffRequest = {
  params: t.Object({
    id: t.String(),
  }),
};
