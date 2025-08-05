import { t } from "elysia";

export const getTeamNotesRequest = {
  params: t.Object({
    teamId: t.String(),
  }),
};
