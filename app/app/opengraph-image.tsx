import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

export const runtime = "nodejs";
export const alt =
  "Pick5 — No-loss fantasy on Celo. Pick 5 Premier League players, win the pool, lose nothing.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  const bebas = await readFile(
    join(process.cwd(), "assets", "BebasNeue-Regular.ttf"),
  );

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          background: "#08070D",
          display: "flex",
          flexDirection: "column",
          padding: "72px 80px",
          color: "#FFFFFF",
          position: "relative",
          fontFamily: "Bebas Neue",
        }}
      >
        {/* radial glow top-right for some life */}
        <div
          style={{
            position: "absolute",
            top: -200,
            right: -200,
            width: 700,
            height: 700,
            background:
              "radial-gradient(circle, rgba(0,223,124,0.18), transparent 60%)",
            display: "flex",
          }}
        />

        {/* top bar */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div
            style={{ fontSize: 64, letterSpacing: 14, display: "flex" }}
          >
            <span>PICK</span>
            <span style={{ color: "#00DF7C" }}>5</span>
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              fontSize: 22,
              letterSpacing: 6,
              color: "#00DF7C",
            }}
          >
            <span
              style={{
                width: 12,
                height: 12,
                borderRadius: 6,
                background: "#00DF7C",
                boxShadow: "0 0 16px #00DF7C",
                display: "flex",
              }}
            />
            <span>TOURNAMENT LIVE</span>
          </div>
        </div>

        {/* hero */}
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              fontSize: 124,
              lineHeight: 0.98,
              letterSpacing: -1,
              display: "flex",
              flexDirection: "column",
            }}
          >
            <span>Pick 5.</span>
            <span>Win the pool.</span>
            <span style={{ color: "#00DF7C" }}>Lose nothing.</span>
          </div>
        </div>

        {/* footer */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-end",
            fontSize: 24,
            letterSpacing: 3,
            color: "rgba(255,255,255,0.55)",
            marginTop: 40,
          }}
        >
          <span>No-loss fantasy on Celo</span>
          <span>ERC-8004 verified AI Coach</span>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        {
          name: "Bebas Neue",
          data: bebas,
          style: "normal",
          weight: 400,
        },
      ],
    },
  );
}
