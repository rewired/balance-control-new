import { describe, it, expect } from "vitest";
import { skeletonVersion } from "./index";

describe("shared skeleton", () => {
  it("exports version", () => {
    expect(skeletonVersion).toContain("skeleton");
  });
});

