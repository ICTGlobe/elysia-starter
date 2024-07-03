import { t } from "elysia";

export const forgotPasswordRequest = {
  body: t.Object(
    {
      email: t.String({
        format: "email",
        default: "john@example.com",
      }),
      redirect_url: t.String({
        format: "uri",
        default: "https://google.com",
      }),
    },
    {
      description: "Initiate a password reset for the provided email address",
    }
  ),
  response: t.Object({
    message: t.String(),
  }),
};
