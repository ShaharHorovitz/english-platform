import * as React from "react";

/** GitHub-style activity heatmap (weeks as columns). Token-driven teal scale,
 * native title tooltips — no client JS. Pattern via 21st.dev Magic inspiration. */
function cellStyle(count: number): React.CSSProperties {
  if (count <= 0) return { backgroundColor: "var(--muted)" };
  const pct = [0, 32, 52, 74, 100][Math.min(4, count)];
  return {
    backgroundColor: `color-mix(in oklab, var(--primary) ${pct}%, var(--muted))`,
  };
}

export function ActivityHeatmap({
  data,
}: {
  data: { date: string; count: number }[];
}) {
  if (data.length === 0) return null;
  const first = new Date(`${data[0].date}T00:00:00Z`).getUTCDay();
  const cells: ({ date: string; count: number } | null)[] = [
    ...Array(first).fill(null),
    ...data,
  ];
  while (cells.length % 7 !== 0) cells.push(null);
  const weeks: (typeof cells)[] = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));

  return (
    <div className="flex flex-col gap-3">
      <div className="flex gap-1 overflow-x-auto">
        {weeks.map((week, wi) => (
          <div key={wi} className="flex flex-col gap-1">
            {week.map((cell, ci) =>
              cell ? (
                <span
                  key={ci}
                  className="size-3.5 rounded-[3px]"
                  style={cellStyle(cell.count)}
                  title={`${cell.date}: ${cell.count} attempt${cell.count === 1 ? "" : "s"}`}
                />
              ) : (
                <span key={ci} className="size-3.5" />
              ),
            )}
          </div>
        ))}
      </div>
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <span>Less</span>
        {[0, 1, 2, 3, 4].map((l) => (
          <span
            key={l}
            className="size-3.5 rounded-[3px]"
            style={cellStyle(l)}
          />
        ))}
        <span>More</span>
      </div>
    </div>
  );
}
