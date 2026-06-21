import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import type { NodeSummary } from "../api/flywheel";
import { State } from "./State";

function ts(s: string | null | undefined): number | null {
  if (!s) return null;
  const t = Date.parse(s);
  return Number.isFinite(t) ? t : null;
}

function fmtDate(ms: number): string {
  return new Date(ms).toISOString().slice(0, 10);
}

interface Bar {
  id: string;
  title: string;
  start: number;
  end: number;
  revisions: number;
  owner: string | null;
}

export function WaterfallView({ nodes }: { nodes: NodeSummary[] }) {
  const navigate = useNavigate();

  const { bars, tMin, tMax, maxRev } = useMemo(() => {
    const out: Bar[] = [];
    let tmn = Infinity;
    let tmx = -Infinity;
    let mr = 0;
    for (const n of nodes) {
      const created = ts(n.created_at);
      const updated = ts(n.updated_at) ?? created;
      if (created === null || updated === null) continue;
      const end = Math.max(created + 60_000, updated);
      if (created < tmn) tmn = created;
      if (end > tmx) tmx = end;
      const rev = n.revision ?? 0;
      if (rev > mr) mr = rev;
      out.push({
        id: n.node_id,
        title: n.title?.trim() || n.slug_name || n.node_id,
        start: created,
        end,
        revisions: rev,
        owner: n.owner_user_email ?? n.owner_email ?? null,
      });
    }
    out.sort((a, b) => a.start - b.start);
    if (!Number.isFinite(tmn) || !Number.isFinite(tmx)) {
      return { bars: out, tMin: 0, tMax: 1, maxRev: 0 };
    }
    const pad = Math.max(1, (tmx - tmn) * 0.01);
    return { bars: out, tMin: tmn - pad, tMax: tmx + pad, maxRev: mr };
  }, [nodes]);

  if (bars.length === 0) {
    return <State variant="empty" title="No timestamped nodes in this subgraph" />;
  }

  const span = tMax - tMin || 1;
  const pct = (t: number) => ((t - tMin) / span) * 100;

  return (
    <div className="waterfall-wrap">
      <div className="waterfall-axis">
        <span>{fmtDate(tMin)}</span>
        <span>{fmtDate((tMin + tMax) / 2)}</span>
        <span>{fmtDate(tMax)}</span>
      </div>
      <div className="waterfall-bars">
        {bars.map((b) => {
          const left = pct(b.start);
          const width = Math.max(0.3, pct(b.end) - left);
          const intensity =
            maxRev === 0 ? 0.3 : 0.25 + 0.6 * (b.revisions / maxRev);
          return (
            <div
              key={b.id}
              className="waterfall-row"
              onClick={() => navigate(`/n/${encodeURIComponent(b.id)}`)}
              title={`${b.title}\n${fmtDate(b.start)} → ${fmtDate(b.end)} · ${b.revisions} revisions`}
            >
              <div
                className="waterfall-bar"
                style={{
                  left: `${left}%`,
                  width: `${width}%`,
                  background: `rgba(var(--heat-rgb), ${intensity})`,
                }}
              >
                <span className="waterfall-bar-label">
                  {b.title}
                  {b.revisions > 0 && (
                    <span className="muted"> · r{b.revisions}</span>
                  )}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
