export type StatProps = {
  label: string;
  value: string;
  sub?: string;
  highlight?: boolean;
};

export function Stat({ label, value, sub, highlight }: StatProps) {
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
      {sub && <div className="text-[10px] text-white/40">{sub}</div>}
    </div>
  );
}
