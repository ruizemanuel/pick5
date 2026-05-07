import { Bebas_Neue, Inter_Tight } from "next/font/google";
import Image from "next/image";

const bebas = Bebas_Neue({ weight: "400", subsets: ["latin"], variable: "--font-display" });
const inter = Inter_Tight({ subsets: ["latin"], variable: "--font-body" });

const FPL_PHOTO = (code: number) =>
  `https://resources.premierleague.com/premierleague/photos/players/250x250/p${code}.png`;

type Slot = {
  empty?: boolean;
  code?: number;
  name?: string;
  team?: string;
  pos?: string;
  initials?: string;
  teamColor?: string;
};

const lineup: Slot[] = [
  { code: 223094, name: "Haaland",  team: "MCI", pos: "FWD", teamColor: "#6CABDD" },
  { code: 223340, name: "Saka",     team: "ARS", pos: "MID", teamColor: "#EF0107" },
  { code: 462424, name: "Saliba",   team: "ARS", pos: "DEF", teamColor: "#EF0107" },
  { code: 244851, name: "Palmer",   team: "CHE", pos: "MID", teamColor: "#034694" },
  { initials: "JP", name: "Pedro",  team: "BHA", pos: "FWD", teamColor: "#0057B8" },
];

// Pentagonal pitch positions chosen to avoid the penalty boxes and center circle
const positions = [
  { top: "13%", left: "50%" },
  { top: "37%", left: "22%" },
  { top: "37%", left: "78%" },
  { top: "67%", left: "32%" },
  { top: "67%", left: "68%" },
] as const;

function PlayerSlot({ slot }: { slot: Slot }) {
  return (
    <div
      className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-2"
      style={{ filter: "drop-shadow(0 8px 16px rgba(0,0,0,0.5))" }}
    >
      <div className="relative size-20">
        <div
          className="absolute inset-0 rounded-full p-[3px]"
          style={{
            background: `conic-gradient(from 180deg, ${slot.teamColor ?? "#00DF7C"}, transparent 70%, ${slot.teamColor ?? "#00DF7C"})`,
          }}
        >
          <div className="size-full rounded-full bg-[#13121A] overflow-hidden flex items-center justify-center relative">
            {slot.code ? (
              <Image
                src={FPL_PHOTO(slot.code)}
                alt={slot.name ?? ""}
                fill
                sizes="80px"
                className="object-cover scale-110"
                unoptimized
              />
            ) : slot.initials ? (
              <span className="text-2xl font-semibold text-white/90 tracking-wide">
                {slot.initials}
              </span>
            ) : null}
          </div>
        </div>
      </div>
      <div className="flex flex-col items-center gap-0.5 text-center">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-white">
          {slot.name}
        </span>
        <span className="flex items-center gap-1 text-[9px] text-white/60">
          <span
            className="inline-block size-1.5 rounded-full"
            style={{ background: slot.teamColor }}
          />
          <span>{slot.team}</span>
          <span className="text-white/30">·</span>
          <span>{slot.pos}</span>
        </span>
      </div>
    </div>
  );
}

// Proper football pitch markings via SVG.
// viewBox 600 (w) × 800 (h) — vertical 3:4 ratio.
function PitchSVG() {
  return (
    <svg
      viewBox="0 0 600 800"
      className="absolute inset-0 size-full"
      preserveAspectRatio="none"
      aria-hidden
    >
      <defs>
        {/* Subtle horizontal stripes via diagonal lines pattern */}
        <pattern id="grass-stripes" x="0" y="0" width="60" height="60" patternUnits="userSpaceOnUse">
          <rect x="0" y="0" width="60" height="60" fill="rgba(255,255,255,0)" />
          <rect x="0" y="0" width="60" height="30" fill="rgba(255,255,255,0.025)" />
        </pattern>
      </defs>

      {/* Grass stripes overlay */}
      <rect x="0" y="0" width="600" height="800" fill="url(#grass-stripes)" />

      <g
        stroke="rgba(255,255,255,0.45)"
        strokeWidth="2"
        fill="none"
        strokeLinejoin="round"
        strokeLinecap="round"
      >
        {/* Outer line — inset 18px from edges */}
        <rect x="18" y="18" width="564" height="764" rx="2" />

        {/* Halfway line */}
        <line x1="18" y1="400" x2="582" y2="400" />

        {/* Center circle */}
        <circle cx="300" cy="400" r="64" />

        {/* Top penalty area (16.5m × 40.32m → ~120 × 240 in our viewBox) */}
        <rect x="180" y="18" width="240" height="120" />
        {/* Top goal area (5.5m × 18.32m → ~40 × 110) */}
        <rect x="245" y="18" width="110" height="40" />
        {/* Top goal */}
        <rect x="270" y="6" width="60" height="12" />
        {/* Top penalty arc — partial circle at penalty spot, only segment below penalty area */}
        <path d="M 240 138 A 64 64 0 0 0 360 138" />

        {/* Bottom penalty area */}
        <rect x="180" y="662" width="240" height="120" />
        {/* Bottom goal area */}
        <rect x="245" y="742" width="110" height="40" />
        {/* Bottom goal */}
        <rect x="270" y="782" width="60" height="12" />
        {/* Bottom penalty arc */}
        <path d="M 240 662 A 64 64 0 0 1 360 662" />
      </g>

      {/* Spots — solid dots */}
      <g fill="rgba(255,255,255,0.7)">
        <circle cx="300" cy="400" r="3" />
        <circle cx="300" cy="100" r="3" />
        <circle cx="300" cy="700" r="3" />
      </g>

      {/* Corner arcs */}
      <g stroke="rgba(255,255,255,0.45)" strokeWidth="2" fill="none">
        <path d="M 18 30 A 12 12 0 0 0 30 18" />
        <path d="M 570 18 A 12 12 0 0 0 582 30" />
        <path d="M 18 770 A 12 12 0 0 1 30 782" />
        <path d="M 570 782 A 12 12 0 0 1 582 770" />
      </g>
    </svg>
  );
}

export default function MockupPage() {
  const lockTime = new Date("2026-05-16T14:00:00Z");
  const now = new Date();
  const diffMs = lockTime.getTime() - now.getTime();
  const days = Math.max(0, Math.floor(diffMs / 86400000));
  const hours = Math.max(0, Math.floor((diffMs % 86400000) / 3600000));
  const mins = Math.max(0, Math.floor((diffMs % 3600000) / 60000));

  return (
    <div
      className={`${inter.variable} ${bebas.variable} font-sans min-h-dvh bg-[#08070D] text-white antialiased`}
    >
      {/* Constrain to mobile width on desktop */}
      <div className="mx-auto max-w-[440px]">
        {/* Top bar */}
        <header className="flex items-center justify-between px-5 pt-5">
          <div className="flex items-center gap-2">
            <span className={`${bebas.className} text-2xl tracking-[0.2em] text-white`}>
              PICK<span className="text-[#00DF7C]">5</span>
            </span>
          </div>
          <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 backdrop-blur">
            <span className="size-1.5 rounded-full bg-[#00DF7C] shadow-[0_0_8px_#00DF7C]" />
            <span className="text-xs font-medium tabular-nums text-white/80">
              0xBA98…6171
            </span>
          </div>
        </header>

        {/* Hero */}
        <section className="relative px-5 pt-8 pb-4">
          <div className="flex items-baseline justify-between">
            <div>
              <div className="text-[10px] font-medium uppercase tracking-[0.2em] text-[#00DF7C]">
                Tournament Live
              </div>
              <h1 className={`${bebas.className} text-[42px] leading-[0.95] tracking-tight`}>
                Premier League<br />
                <span className="text-[#00DF7C]">Final 2 weeks</span>
              </h1>
            </div>
            <div className="text-right">
              <div className="text-[10px] font-medium uppercase tracking-[0.15em] text-white/50">
                Your lineup
              </div>
              <div className={`${bebas.className} text-3xl leading-none`}>5/5</div>
            </div>
          </div>
        </section>

        {/* Pitch */}
        <section className="px-5">
          <div
            className="relative aspect-[3/4] w-full overflow-hidden rounded-3xl"
            style={{
              background:
                "radial-gradient(ellipse at top, #1A6B3E 0%, #0A2818 100%)",
              boxShadow:
                "inset 0 0 0 1px rgba(255,255,255,0.06), inset 0 -40px 80px rgba(0,0,0,0.6), 0 16px 40px rgba(0,0,0,0.4)",
            }}
          >
            <PitchSVG />

            {/* Vignette */}
            <div
              className="pointer-events-none absolute inset-0"
              style={{
                background:
                  "radial-gradient(ellipse at center, transparent 60%, rgba(0,0,0,0.45) 100%)",
              }}
              aria-hidden
            />

            {/* Slots */}
            {positions.map((p, i) => (
              <div key={i} className="absolute" style={{ top: p.top, left: p.left }}>
                <PlayerSlot slot={lineup[i]} />
              </div>
            ))}
          </div>
        </section>

        {/* Stats */}
        <section className="px-5 pt-5">
          <div className="grid grid-cols-3 gap-2">
            <Stat label="Pool" value="$25" sub="5 players" />
            <Stat label="Prize" value="$10.04" sub="seed + yield" highlight />
            <Stat label="Yield" value="2.4%" sub="Aave V3 APY" />
          </div>
        </section>

        {/* Countdown */}
        <section className="px-5 pt-5">
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 backdrop-blur">
            <div className="text-[10px] font-medium uppercase tracking-[0.2em] text-white/50">
              Lineup locks in
            </div>
            <div
              className={`${bebas.className} mt-1 flex items-baseline gap-2 text-5xl leading-none tracking-tight`}
            >
              <span>{String(days).padStart(2, "0")}</span>
              <span className="text-base text-white/40">d</span>
              <span>{String(hours).padStart(2, "0")}</span>
              <span className="text-base text-white/40">h</span>
              <span>{String(mins).padStart(2, "0")}</span>
              <span className="text-base text-white/40">m</span>
            </div>
            <div className="mt-2 text-xs text-white/50">
              Saturday · 16 May · 14:00 UTC
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="sticky bottom-0 mt-6 px-5 pb-6">
          <button
            className={`${bebas.className} group relative w-full overflow-hidden rounded-2xl bg-[#00DF7C] py-4 text-xl tracking-[0.18em] text-black shadow-[0_8px_32px_rgba(0,223,124,0.3)] transition active:scale-[0.98]`}
          >
            <span className="relative z-10">Submit lineup · $5</span>
            <span
              className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/40 to-transparent group-hover:translate-x-full transition-transform duration-700"
              aria-hidden
            />
          </button>
          <p className="mt-3 text-center text-[11px] text-white/40">
            You can withdraw your $5 anytime after the tournament.
          </p>
        </section>
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  sub,
  highlight,
}: {
  label: string;
  value: string;
  sub: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl border p-3 ${
        highlight
          ? "border-[#F5C842]/30 bg-[#F5C842]/5"
          : "border-white/10 bg-white/[0.03]"
      }`}
    >
      <div className="text-[10px] font-medium uppercase tracking-wider text-white/50">
        {label}
      </div>
      <div
        className={`mt-0.5 text-xl font-semibold tabular-nums ${
          highlight ? "text-[#F5C842]" : "text-white"
        }`}
      >
        {value}
      </div>
      <div className="text-[10px] text-white/40">{sub}</div>
    </div>
  );
}
