import { t } from "elysia";

export const signupResponse = t.Object(
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
