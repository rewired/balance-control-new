import { describe, it, expect } from "vitest";
import { RULES_MODULE } from "./index";

describe("rules skeleton", () => {
  it("exports RULES_MODULE", () => {
    expect(RULES_MODULE).toBe("rules-skeleton");
  });
});

