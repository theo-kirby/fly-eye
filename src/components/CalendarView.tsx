import { useMemo, useState } from "react";
import type { NodeSummary } from "../api/flywheel";
import { State } from "./State";

function dayKey(ts: string | null | undefined): string | null {
  if (!ts) return null;
  return ts.slice(0, 10);
}

function dayDiff(a: Date, b: Date): number {
  return Math.round(
    (Date.UTC(b.getUTCFullYear(), b.getUTCMonth(), b.getUTCDate()) -
      Date.UTC(a.getUTCFullYear(), a.getUTCMonth(), a.getUTCDate())) /
      86_400_000,
  );
}

function addDays(d: Date, n: number): Date {
  const next = new Date(d);
  next.setUTCDate(next.getUTCDate() + n);
  return next;
}

const MONTH_NAMES = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

interface DayCell {
  day: string;
  date: Date;
  created: number;
  updated: number;
  titles: string[];
}

export function CalendarView({ nodes }: { nodes: NodeSummary[] }) {
  const [hovered, setHovered] = useState<DayCell | null>(null);

  const { cells, weeks, maxActivity } = useMemo(() => {
    const cellMap = new Map<string, DayCell>();
    for (const n of nodes) {
      const title = n.title?.trim() || n.slug_name || n.node_id;
      const cKey = dayKey(n.created_at);
      const uKey = dayKey(n.updated_at);
      if (cKey) {
        const cell =
          cellMap.get(cKey) ??
          ({ day: cKey, date: new Date(cKey), created: 0, updated: 0, titles: [] } as DayCell);
        cell.created += 1;
        cell.titles.push(title);
        cellMap.set(cKey, cell);
      }
      if (uKey && uKey !== cKey) {
        const cell =
          cellMap.get(uKey) ??
          ({ day: uKey, date: new Date(uKey), created: 0, updated: 0, titles: [] } as DayCell);
        cell.updated += 1;
        cellMap.set(uKey, cell);
      }
    }

    if (cellMap.size === 0) {
      return { cells: cellMap, weeks: [] as DayCell[][], maxActivity: 0 };
    }

    const sortedDays = [...cellMap.keys()].sort();
    const start = new Date(sortedDays[0]);
    const end = new Date(sortedDays[sortedDays.length - 1]);
    // Align start to Sunday for a clean weekly grid.
    const startSunday = addDays(start, -start.getUTCDay());
    const totalDays = dayDiff(startSunday, end) + 1;

    let max = 0;
    const allCells: DayCell[] = [];
    for (let i = 0; i < totalDays; i++) {
      const d = addDays(startSunday, i);
      const key = d.toISOString().slice(0, 10);
      const c =
        cellMap.get(key) ??
        ({ day: key, date: d, created: 0, updated: 0, titles: [] } as DayCell);
      const a = c.created + c.updated;
      if (a > max) max = a;
      allCells.push(c);
    }

    const weekArr: DayCell[][] = [];
    for (let i = 0; i < allCells.length; i += 7) {
      weekArr.push(allCells.slice(i, i + 7));
    }

    return { cells: cellMap, weeks: weekArr, maxActivity: max };
  }, [nodes]);

  if (weeks.length === 0) {
    return <State variant="empty" title="No timestamped nodes in this subgraph" />;
  }

  // Month labels: render once per month above the first week of that month.
  const monthLabels: { col: number; label: string }[] = [];
  let prevMonth = -1;
  weeks.forEach((w, col) => {
    const month = w[0].date.getUTCMonth();
    if (month !== prevMonth) {
      monthLabels.push({ col, label: MONTH_NAMES[month] });
      prevMonth = month;
    }
  });

  return (
    <div className="calendar-wrap">
      <div className="calendar-grid">
        <div className="calendar-months" style={{ gridColumn: "2 / -1" }}>
          {monthLabels.map((m) => (
            <span
              key={`${m.col}-${m.label}`}
              style={{ gridColumnStart: m.col + 1 }}
            >
              {m.label}
            </span>
          ))}
        </div>
        <div className="calendar-dow">
          <span>Mon</span>
          <span>Wed</span>
          <span>Fri</span>
        </div>
        <div className="calendar-cells">
          {weeks.map((week, ci) => (
            <div className="calendar-col" key={ci}>
              {Array.from({ length: 7 }, (_, ri) => {
                const cell = week[ri];
                if (!cell)
                  return <span className="calendar-cell empty" key={ri} />;
                const activity = cell.created + cell.updated;
                const intensity =
                  maxActivity === 0 ? 0 : Math.min(1, activity / maxActivity);
                const c =
                  intensity === 0 ? 0 : Math.max(0.15, Math.sqrt(intensity));
                return (
                  <span
                    key={ri}
                    className="calendar-cell"
                    style={{
                      background:
                        activity === 0
                          ? "var(--bg-elev)"
                          : `rgba(var(--heat-rgb), ${c})`,
                    }}
                    onMouseEnter={() => setHovered(cell)}
                    onMouseLeave={() => setHovered((h) => (h === cell ? null : h))}
                    title={`${cell.day}: ${cell.created} created, ${cell.updated} updated`}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>
      <div className="calendar-detail">
        {hovered ? (
          <>
            <strong>{hovered.day}</strong> — {hovered.created} created,{" "}
            {hovered.updated} updated
            {hovered.titles.length > 0 && (
              <ul>
                {hovered.titles.slice(0, 10).map((t, i) => (
                  <li key={i}>{t}</li>
                ))}
                {hovered.titles.length > 10 && (
                  <li className="muted">… and {hovered.titles.length - 10} more</li>
                )}
              </ul>
            )}
          </>
        ) : (
          <span className="muted">
            Hover a cell. {cells.size} day{cells.size === 1 ? "" : "s"} of
            activity. Max day: {maxActivity} events.
          </span>
        )}
      </div>
    </div>
  );
}
