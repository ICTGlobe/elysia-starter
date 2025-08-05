import { t } from "elysia";

export const updateProfileRequest = {
  body: t.Object({
    name: t.String({ minLength: 1 }),
  }),
};
