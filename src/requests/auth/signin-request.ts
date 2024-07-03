import { t } from "elysia";

export const signinRequest = t.Object(
  {
    email: t.String({
      format: "email",
      default: "john@example.com",
    }),
    password: t.String(),
  },
  {
    description: "Sign in with username and password",
  }
);
