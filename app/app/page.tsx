import { ConnectedWalletPill } from "@/components/ConnectedWalletPill";
import { LandingCTA } from "@/components/LandingCTA";
import { Pitch, type PitchSlot } from "@/components/design/Pitch";
import { Stat } from "@/components/design/Stat";

const FPL_PHOTO = (code: number) =>
  `https://resources.premierleague.com/premierleague/photos/players/250x250/p${code}.png`;

const PREVIEW_LINEUP: PitchSlot[] = [
  {
    photoUrl: FPL_PHOTO(223094),
    initials: "EH",
    name: "Haaland",
    team: "MCI",
    position: "FWD",
    teamColor: "#6CABDD",
  },
  {
    photoUrl: FPL_PHOTO(223340),
    initials: "BS",
    name: "Saka",
    team: "ARS",
    position: "MID",
    teamColor: "#EF0107",
  },
  {
    photoUrl: FPL_PHOTO(244851),
    initials: "CP",
    name: "Palmer",
    team: "CHE",
    position: "MID",
    teamColor: "#034694",
  },
  {
    photoUrl: FPL_PHOTO(221820),
    initials: "LM",
    name: "Martinez",
    team: "MUN",
    position: "DEF",
    teamColor: "#DA291C",
  },
  {
    photoUrl: FPL_PHOTO(462424),
    initials: "WS",
    name: "Saliba",
    team: "ARS",
    position: "DEF",
    teamColor: "#EF0107",
  },
];

const LOCK_DATE = new Date("2026-05-16T14:00:00Z");

function daysUntil(target: Date): number {
  const ms = target.getTime() - Date.now();
  return Math.max(0, Math.ceil(ms / 86_400_000));
}

export default function LandingPage() {
  const days = daysUntil(LOCK_DATE);

  return (
    <main className="min-h-dvh bg-[#08070D] text-white">
      <div className="mx-auto flex max-w-[440px] flex-col px-5 pt-5">
        <header className="flex items-center justify-between">
          <span className="font-display text-2xl tracking-[0.2em] text-white">
            PICK<span className="text-[#00DF7C]">5</span>
          </span>
          <ConnectedWalletPill />
        </header>

        <section className="pt-10">
          <div className="text-[10px] font-medium uppercase tracking-[0.2em] text-[#00DF7C]">
            Tournament Live
          </div>
          <h1 className="font-display mt-2 text-[44px] leading-[0.95] tracking-tight">
            Pick 5.<br />
            Win the pool.<br />
            <span className="text-[#00DF7C]">Lose nothing.</span>
          </h1>
          <p className="mt-3 max-w-[34ch] text-sm text-white/60">
            Deposit $1 USDT, pick 5 Premier League players for the final 2
            matchweeks. Your stake earns yield in Aave V3 — top scorer takes the
            entire prize pool. Withdraw your $1 anytime after.
          </p>
        </section>

        <section className="pt-6">
          <Pitch slots={PREVIEW_LINEUP} />
        </section>

        <section className="pt-5">
          <div className="grid grid-cols-3 gap-2">
            <Stat label="Pool" value="$25" sub="5 players" />
            <Stat label="Prize" value="$10" sub="seed + yield" highlight />
            <Stat
              label="Locks in"
              value={`${days}d`}
              sub="Sat · 16 May · 14:00 UTC"
            />
          </div>
        </section>

        <section className="pt-8">
          <LandingCTA />
          <p className="mt-3 text-center text-[11px] text-white/40">
            Built on Celo · ERC-8004 verified Coach
          </p>
        </section>

        <div className="h-10" />
      </div>
    </main>
  );
}
