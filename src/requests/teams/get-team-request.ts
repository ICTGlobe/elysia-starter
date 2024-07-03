import { t } from "elysia";

export const getTeamRequest = {
  params: t.Object({
    id: t.String(),
  }),
};
