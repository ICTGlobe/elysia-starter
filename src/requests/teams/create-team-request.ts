import { t } from "elysia";

export const createTeamRequest = {
  body: t.Object({
    name: t.String({
      minLength: 3,
    }),
    isPrivate: t.Optional(
      t.Boolean({
        default: false,
      }),
    ),
  }),
};
