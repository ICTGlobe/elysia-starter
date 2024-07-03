import { t } from "elysia";

export const resetPasswordRequest = {
  body: t.Object(
    {
      email: t.String({
        format: "email",
        default: "john@example.com",
      }),
      password: t.String({
        minLength: 8,
      }),
      token: t.String({
        minLength: 1,
      }),
    },
    {
      description: "Change the password for the given email address",
    }
  ),
  response: t.Object({
    message: t.String(),
  }),
};
