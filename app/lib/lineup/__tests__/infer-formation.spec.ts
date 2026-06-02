import { describe, it, expect } from "vitest";
import { inferFormation, FORMATION_KEYS } from "../formations";

describe("inferFormation", () => {
  it("matches 4-3-3 from its position counts", () => {
    const positions = ["GK", "DEF", "DEF", "DEF", "DEF", "MID", "MID", "MID", "FWD", "FWD", "FWD"];
    expect(inferFormation(positions)).toBe("4-3-3");
  });
  it("matches 3-5-2 regardless of position order", () => {
    const positions = ["FWD", "MID", "DEF", "MID", "GK", "DEF", "MID", "FWD", "DEF", "MID", "MID"];
    expect(inferFormation(positions)).toBe("3-5-2");
  });
  it("matches every formation from its own slot positions", () => {
    for (const key of FORMATION_KEYS) {
      const [def, mid, fwd] = key.split("-").map(Number);
      const positions = [
        "GK",
        ...Array<string>(def).fill("DEF"),
        ...Array<string>(mid).fill("MID"),
        ...Array<string>(fwd).fill("FWD"),
      ];
      expect(inferFormation(positions)).toBe(key);
    }
  });
  it("falls back to the default for an unrecognised shape", () => {
    expect(inferFormation(["GK", "GK", "DEF"])).toBe("4-3-3");
  });
});
