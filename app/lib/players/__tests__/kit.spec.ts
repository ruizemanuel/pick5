import { describe, it, expect } from "vitest";
import { kitUrl } from "../kit";

describe("kitUrl", () => {
  it("builds the public kit path from a teamId (squadId)", () => {
    expect(kitUrl(2)).toBe("/kits/2.png");
    expect(kitUrl(48)).toBe("/kits/48.png");
  });
  it("returns undefined when there is no teamId (FPL has none)", () => {
    expect(kitUrl(undefined)).toBeUndefined();
    expect(kitUrl(0)).toBeUndefined();
  });
});
