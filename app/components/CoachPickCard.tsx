type Row = {
  mw: number;
  playerIds: number[];
  playerNames: (string | null)[];
  playerTeams: (string | null)[];
  reasoning: string[];
  commitmentHash: string;
  publishTxHash: string | null;
  revealTxHash: string | null;
  accuracy: number | null;
};

const EXPLORER_BY_NETWORK: Record<string, string> = {
  celo: "https://celoscan.io/tx/",
  alfajores: "https://alfajores.celoscan.io/tx/",
  "celo-sepolia": "https://celo-sepolia.blockscout.com/tx/",
};

export function CoachPickCard({ row }: { row: Row }) {
  const network = process.env.NEXT_PUBLIC_NETWORK ?? "celo-sepolia";
  const explorerBase = EXPLORER_BY_NETWORK[network] ?? EXPLORER_BY_NETWORK.celo;

  return (
    <article className="rounded-lg border p-4">
      <header className="flex items-baseline justify-between">
        <h2 className="text-lg font-semibold">Matchweek {row.mw}</h2>
        {row.accuracy !== null && (
          <span className="text-sm text-muted-foreground">accuracy: {row.accuracy}%</span>
        )}
      </header>
      <ol className="mt-3 space-y-2 text-sm">
        {row.playerIds.map((id, i) => {
          const name = row.playerNames[i];
          const team = row.playerTeams[i];
          return (
            <li key={i}>
              <strong>{name ?? `#${id}`}</strong>
              {team ? <span className="ml-1 text-xs text-muted-foreground">{team}</span> : null}
              <span className="text-muted-foreground"> — {row.reasoning[i] ?? "—"}</span>
            </li>
          );
        })}
      </ol>
      <footer className="mt-3 flex flex-wrap gap-3 text-xs">
        {row.publishTxHash && (
          <a
            className="text-muted-foreground underline"
            href={`${explorerBase}${row.publishTxHash}`}
            target="_blank"
            rel="noreferrer"
          >
            Commit tx
          </a>
        )}
        {row.revealTxHash && (
          <a
            className="text-muted-foreground underline"
            href={`${explorerBase}${row.revealTxHash}`}
            target="_blank"
            rel="noreferrer"
          >
            Reveal tx
          </a>
        )}
      </footer>
    </article>
  );
}
