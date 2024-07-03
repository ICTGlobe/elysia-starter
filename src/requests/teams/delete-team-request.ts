import { t } from "elysia";

export const deleteTeamRequest = {
  params: t.Object({
    id: t.String(),
  }),
};
