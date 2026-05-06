import Link from "next/link";

type Row = {
  mw: number;
  playerIds: number[];
  reasoning: string[];
  commitmentHash: string;
  publishTxHash: string | null;
  revealTxHash: string | null;
  accuracy: number | null;
};

export function CoachPickCard({ row }: { row: Row }) {
  const explorerBase = "https://celoscan.io/tx/";

  return (
    <article className="rounded-lg border p-4">
      <header className="flex items-baseline justify-between">
        <h2 className="text-lg font-semibold">Matchweek {row.mw}</h2>
        {row.accuracy !== null && (
          <span className="text-sm text-muted-foreground">accuracy: {row.accuracy}%</span>
        )}
      </header>
      <ol className="mt-3 space-y-2 text-sm">
        {row.playerIds.map((id, i) => (
          <li key={i}>
            <strong>#{id}</strong> —{" "}
            <span className="text-muted-foreground">{row.reasoning[i] ?? "—"}</span>
          </li>
        ))}
      </ol>
      <footer className="mt-3 flex flex-wrap gap-3 text-xs">
        {row.publishTxHash && (
          <Link
            className="text-muted-foreground underline"
            href={`${explorerBase}${row.publishTxHash}`}
            target="_blank"
            rel="noreferrer"
          >
            Commit tx
          </Link>
        )}
        {row.revealTxHash && (
          <Link
            className="text-muted-foreground underline"
            href={`${explorerBase}${row.revealTxHash}`}
            target="_blank"
            rel="noreferrer"
          >
            Reveal tx
          </Link>
        )}
      </footer>
    </article>
  );
}
