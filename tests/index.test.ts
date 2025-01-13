import { describe, expect, it } from "bun:test";

import { app } from "@/app";

describe("basics", () => {
  it("displays a welcome message", async () => {
    const response = await app
      .handle(new Request("http://localhost/"))
      .then((res) => res.text());

    expect(response).toEqual("ElysiaJS API");
  });
});
