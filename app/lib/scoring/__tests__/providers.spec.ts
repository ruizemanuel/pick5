import { describe, it, expect } from "vitest";
import { getProvider } from "../providers";
import { FplScoreProvider } from "../fpl-provider";
import { OnzeWcScoreProvider } from "../worldcup-provider";

describe("getProvider", () => {
  it("resolves known provider ids", () => {
    expect(getProvider("fpl")).toBe(FplScoreProvider);
    expect(getProvider("fifa-wc")).toBe(OnzeWcScoreProvider);
  });
  it("falls back to FPL for an unknown id", () => {
    expect(getProvider("nope")).toBe(FplScoreProvider);
  });
});
