import { t } from "elysia";

export const signupRequest = t.Object(
  {
    name: t.String({
      minLength: 3,
    }),
    email: t.String({
      format: "email",
      default: "john@example.com",
    }),
    password: t.String({
      minLength: 8,
    }),
  },
  {
    description: "Sign up for a new account with the service",
  }
);
