import { describe, it, expect } from "vitest";
import {
  SEASONS,
  getActiveSeason,
  getSeasonById,
  seasonForFecha,
  fechaRound,
  seasonFechaIds,
  isConfiguredRound,
} from "../seasons";

describe("season config helpers", () => {
  it("getActiveSeason returns the highest seasonId", () => {
    expect(getActiveSeason().seasonId).toBe(Math.max(...SEASONS.map((s) => s.seasonId)));
  });

  it("getSeasonById finds by id, undefined otherwise", () => {
    const s = SEASONS[0];
    expect(getSeasonById(s.seasonId)?.label).toBe(s.label);
    expect(getSeasonById(-999)).toBeUndefined();
  });

  it("fechaRound maps a configured fecha to its FPL round", () => {
    const f = SEASONS[0].fechas[0];
    expect(fechaRound(f.tournamentId)).toBe(f.round);
    expect(fechaRound(-1)).toBeUndefined();
  });

  it("seasonForFecha finds the owning season", () => {
    const f = SEASONS[0].fechas[0];
    expect(seasonForFecha(f.tournamentId)?.seasonId).toBe(SEASONS[0].seasonId);
    expect(seasonForFecha(-1)).toBeUndefined();
  });

  it("seasonFechaIds returns the tournamentIds", () => {
    expect(seasonFechaIds(SEASONS[0])).toEqual(SEASONS[0].fechas.map((f) => f.tournamentId));
  });

  it("isConfiguredRound reflects configured FPL rounds", () => {
    expect(isConfiguredRound(SEASONS[0].fechas[0].round)).toBe(true);
    expect(isConfiguredRound(99999)).toBe(false);
  });
});
