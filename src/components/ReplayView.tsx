import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { NodeSummary } from "../api/flywheel";
import { Icon } from "./Icon";
import {
  layoutLayered,
  NODE_H,
  NODE_W,
  truncate,
  type Placed,
} from "../lib/layout";

interface ViewBox {
  x: number;
  y: number;
  w: number;
  h: number;
}

function parseTs(s: string | null | undefined): number | null {
  if (!s) return null;
  const t = Date.parse(s);
  return Number.isFinite(t) ? t : null;
}

function fmt(ms: number): string {
  return new Date(ms).toISOString().slice(0, 16).replace("T", " ");
}

export function ReplayView({
  anchorId,
  nodes,
}: {
  anchorId: string;
  nodes: NodeSummary[];
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerSize, setContainerSize] = useState({ w: 800, h: 500 });
  const [viewBox, setViewBox] = useState<ViewBox | null>(null);
  const [playing, setPlaying] = useState(false);
  const [t, setT] = useState<number | null>(null);

  const { tMin, tMax } = useMemo(() => {
    const ts = nodes
      .map((n) => parseTs(n.created_at))
      .filter((v): v is number => v !== null);
    if (ts.length === 0) return { tMin: 0, tMax: 1 };
    return { tMin: Math.min(...ts), tMax: Math.max(...ts) };
  }, [nodes]);

  useEffect(() => {
    setT(tMax);
  }, [tMax]);

  const layout = useMemo(() => {
    const byId = new Map(nodes.map((n) => [n.node_id, n]));
    return layoutLayered(anchorId, byId);
  }, [anchorId, nodes]);

  const posById = useMemo(() => {
    const m = new Map<string, Placed>();
    for (const p of layout.nodes) m.set(p.id, p);
    return m;
  }, [layout]);

  const tsById = useMemo(() => {
    const m = new Map<string, number>();
    for (const n of nodes) {
      const ts = parseTs(n.created_at);
      if (ts !== null) m.set(n.node_id, ts);
    }
    return m;
  }, [nodes]);

  useLayoutEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const r = entries[0].contentRect;
      setContainerSize({ w: r.width, h: r.height });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const fittedKey = useRef<string>("");
  useEffect(() => {
    const key = `${layout.width}x${layout.height}|${containerSize.w}x${containerSize.h}|${anchorId}`;
    if (fittedKey.current === key) return;
    fittedKey.current = key;
    const aspect = containerSize.w / Math.max(1, containerSize.h);
    let w = layout.width;
    let h = layout.height;
    if (w / h > aspect) h = w / aspect;
    else w = h * aspect;
    setViewBox({
      x: (layout.width - w) / 2,
      y: (layout.height - h) / 2,
      w,
      h,
    });
  }, [layout, containerSize, anchorId]);

  // Auto-play loop.
  useEffect(() => {
    if (!playing || t === null) return;
    const step = (tMax - tMin) / 200;
    const id = setInterval(() => {
      setT((prev) => {
        if (prev === null) return tMax;
        const next = prev + step;
        if (next >= tMax) {
          setPlaying(false);
          return tMax;
        }
        return next;
      });
    }, 50);
    return () => clearInterval(id);
  }, [playing, tMin, tMax, t]);

  const onWheel = useCallback(
    (e: React.WheelEvent) => {
      if (!viewBox) return;
      e.preventDefault();
      const factor = Math.exp(e.deltaY * 0.0015);
      const rect = (e.currentTarget as SVGSVGElement).getBoundingClientRect();
      const px = (e.clientX - rect.left) / rect.width;
      const py = (e.clientY - rect.top) / rect.height;
      const newW = viewBox.w * factor;
      const newH = viewBox.h * factor;
      setViewBox({
        x: viewBox.x + (viewBox.w - newW) * px,
        y: viewBox.y + (viewBox.h - newH) * py,
        w: newW,
        h: newH,
      });
    },
    [viewBox],
  );

  const tNow = t ?? tMax;
  const visibleCount = Array.from(tsById.values()).filter((ts) => ts <= tNow)
    .length;

  return (
    <div className="replay-wrap">
      <div className="replay-canvas" ref={containerRef}>
        {viewBox && (
          <svg
            className="graph-svg"
            viewBox={`${viewBox.x} ${viewBox.y} ${viewBox.w} ${viewBox.h}`}
            onWheel={onWheel}
          >
            <g>
              {layout.edges.map((e, i) => {
                const a = posById.get(e.from);
                const b = posById.get(e.to);
                if (!a || !b) return null;
                const aTs = tsById.get(e.from) ?? Infinity;
                const bTs = tsById.get(e.to) ?? Infinity;
                const alive = aTs <= tNow && bTs <= tNow;
                const ax = a.x + NODE_W / 2;
                const bx = b.x - NODE_W / 2;
                const mx = (ax + bx) / 2;
                const d = `M ${ax} ${a.y} C ${mx} ${a.y}, ${mx} ${b.y}, ${bx} ${b.y}`;
                return (
                  <path
                    key={i}
                    d={d}
                    className="graph-edge"
                    style={{ opacity: alive ? 1 : 0.06 }}
                  />
                );
              })}
            </g>
            <g>
              {layout.nodes.map((n) => {
                const ts = tsById.get(n.id) ?? Infinity;
                const alive = ts <= tNow;
                const justBorn = alive && tNow - ts < (tMax - tMin) / 40;
                return (
                  <g
                    key={n.id}
                    transform={`translate(${n.x - NODE_W / 2} ${n.y - NODE_H / 2})`}
                    style={{ opacity: alive ? 1 : 0.08 }}
                  >
                    <rect
                      width={NODE_W}
                      height={NODE_H}
                      rx={6}
                      className={
                        justBorn
                          ? "graph-node-bg replay-born"
                          : n.isAnchor
                            ? "graph-node-bg anchor"
                            : "graph-node-bg"
                      }
                    />
                    <text
                      x={NODE_W / 2}
                      y={NODE_H / 2}
                      className="graph-node-label"
                      dominantBaseline="middle"
                      textAnchor="middle"
                    >
                      {truncate(n.title, 26)}
                    </text>
                  </g>
                );
              })}
            </g>
          </svg>
        )}
      </div>
      <div className="replay-controls">
        <button
          type="button"
          className="graph-btn"
          onClick={() => {
            if (tNow >= tMax) setT(tMin);
            setPlaying((p) => !p);
          }}
          aria-label={playing ? "Pause" : "Play"}
        >
          <Icon name={playing ? "pause" : "play"} size={13} />
          {playing ? "pause" : "play"}
        </button>
        <input
          type="range"
          min={tMin}
          max={tMax}
          step={Math.max(1, (tMax - tMin) / 1000)}
          value={tNow}
          onChange={(e) => {
            setPlaying(false);
            setT(parseFloat(e.target.value));
          }}
          className="replay-slider"
        />
        <span className="muted replay-time">
          {fmt(tNow)} · {visibleCount}/{nodes.length}
        </span>
      </div>
    </div>
  );
}
