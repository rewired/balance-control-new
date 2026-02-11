import { describe, it, expect } from "vitest";
import { BOT_MODULE } from "./index";

describe("bot skeleton", () => {
  it("exports BOT_MODULE", () => {
    expect(BOT_MODULE).toBe("bot-skeleton");
  });
});

