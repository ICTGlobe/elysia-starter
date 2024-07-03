import { t } from "elysia";

export const updateTeamRequest = {
  params: t.Object({
    id: t.String(),
  }),
  body: t.Object({
    name: t.Optional(
      t.String({
        minLength: 3,
      }),
    ),
    isPrivate: t.Optional(
      t.Boolean({
        default: false,
      }),
    ),
  }),
};
