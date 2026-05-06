import { cn } from "@/lib/utils";

export type PlayerCardProps = {
  id: number;
  name: string;
  team: string;
  position: string;
  cost: number;
  form: number;
  owned: number;
  selected?: boolean;
  onClick?: () => void;
};

export function PlayerCard({
  name,
  team,
  position,
  cost,
  form,
  owned,
  selected,
  onClick,
}: PlayerCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-3 rounded-lg border p-3 text-left transition",
        selected ? "border-foreground bg-foreground/5" : "hover:border-muted-foreground"
      )}
      aria-pressed={selected}
    >
      <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold">
        {team}
      </div>
      <div className="min-w-0 flex-1">
        <div className="truncate font-medium">{name}</div>
        <div className="text-xs text-muted-foreground">
          {position} · £{cost.toFixed(1)} · form {form.toFixed(1)} · {owned.toFixed(1)}%
        </div>
      </div>
    </button>
  );
}
