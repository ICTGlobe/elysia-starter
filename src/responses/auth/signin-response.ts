import { t } from "elysia";

export const signinResponse = t.Object(
  {
    id: t.String(),
    name: t.String(),
    email: t.String(),
    token: t.String({
      description: "JWT Token",
    }),
  },
  {
    description: "Authenticated user details",
  }
);
