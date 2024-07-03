import { describe, expect, it } from "bun:test";

import { app } from "@/app";

describe("basics", () => {
  it("displays a welcome message", async () => {
    const response = await app
      .handle(new Request("http://localhost/api/v1"))
      .then((res) => res.json());

    expect(response).toEqual({
      message: "ElysiaJS API Server",
    });
  });
});
