export const TEAM_COLOR: Record<string, string> = {
  ARS: "#EF0107",
  AVL: "#7B003C",
  BHA: "#0057B8",
  BOU: "#DA291C",
  BRE: "#E30613",
  CHE: "#034694",
  CRY: "#1B458F",
  EVE: "#003399",
  FUL: "#FFFFFF",
  IPS: "#3764A4",
  LEI: "#003090",
  LIV: "#C8102E",
  MCI: "#6CABDD",
  MUN: "#DA291C",
  NEW: "#241F20",
  NFO: "#DD0000",
  SOU: "#D71920",
  TOT: "#132257",
  WHU: "#7A263A",
  WOL: "#FDB913",
};

export const DEFAULT_TEAM_COLOR = "#00DF7C";

export function teamColor(short?: string): string {
  if (!short) return DEFAULT_TEAM_COLOR;
  return TEAM_COLOR[short] ?? DEFAULT_TEAM_COLOR;
}
