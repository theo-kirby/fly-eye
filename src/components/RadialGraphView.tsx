import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useNavigate } from "react-router-dom";
import type { NodeSummary } from "../api/flywheel";

interface ViewBox {
  x: number;
  y: number;
  w: number;
  h: number;
}

interface Placed {
  id: string;
  x: number;
  y: number;
  r: number;
  depth: number;
  title: string;
  isAnchor: boolean;
}

interface RadialLayout {
  nodes: Placed[];
  edges: { from: string; to: string }[];
  bounds: ViewBox;
}

const NODE_R = 30;
const ANCHOR_R = 38;
const RING_STEP = 200;
const FIRST_RING = 200;

// Radial BFS layout: anchor at origin, each BFS depth a concentric ring.
// Children inherit a slice of angle around their parent's angle so clusters
// stay together — close to the spring-graph look of the reference image.
function layoutRadial(
  anchorId: string,
  byId: Map<string, NodeSummary>,
): RadialLayout {
  const depth = new Map<string, number>();
  const parent = new Map<string, string | null>();
  const queue: string[] = [anchorId];
  depth.set(anchorId, 0);
  parent.set(anchorId, null);

  while (queue.length) {
    const id = queue.shift()!;
    const node = byId.get(id);
    if (!node) continue;
    const d = depth.get(id) ?? 0;
    // Walk outgoing + incoming so disconnected-by-direction siblings still join
    // the layout (matches the undirected look of a force graph).
    const neighbors = [
      ...(node.outgoing_ids ?? []),
      ...(node.incoming_ids ?? []),
    ];
    for (const nbr of neighbors) {
      if (!depth.has(nbr) && byId.has(nbr)) {
        depth.set(nbr, d + 1);
        parent.set(nbr, id);
        queue.push(nbr);
      }
    }
  }

  const byDepth = new Map<number, string[]>();
  for (const [id, d] of depth) {
    const arr = byDepth.get(d) ?? [];
    arr.push(id);
    byDepth.set(d, arr);
  }

  const angleOf = new Map<string, number>();
  const placedPos = new Map<string, { x: number; y: number; depth: number }>();
  placedPos.set(anchorId, { x: 0, y: 0, depth: 0 });
  angleOf.set(anchorId, 0);

  // depth 1 spreads evenly around the anchor
  const d1 = (byDepth.get(1) ?? []).slice().sort();
  d1.forEach((id, i) => {
    const a = (i / d1.length) * 2 * Math.PI - Math.PI / 2;
    angleOf.set(id, a);
    const r = FIRST_RING;
    placedPos.set(id, { x: Math.cos(a) * r, y: Math.sin(a) * r, depth: 1 });
  });

  let maxDepth = Math.max(0, ...byDepth.keys());

  // Orphans: nodes in byId that BFS couldn't reach via either direction.
  // Drop them on a fresh outer ring so they're still visible.
  const orphans: string[] = [];
  for (const id of byId.keys()) {
    if (!depth.has(id)) orphans.push(id);
  }
  if (orphans.length > 0) {
    maxDepth = maxDepth + 1;
    orphans.sort();
    for (const id of orphans) {
      depth.set(id, maxDepth);
      const arr = byDepth.get(maxDepth) ?? [];
      arr.push(id);
      byDepth.set(maxDepth, arr);
    }
    orphans.forEach((id, i) => {
      const a = (i / orphans.length) * 2 * Math.PI - Math.PI / 2;
      angleOf.set(id, a);
      const r = FIRST_RING + (maxDepth - 1) * RING_STEP;
      placedPos.set(id, {
        x: Math.cos(a) * r,
        y: Math.sin(a) * r,
        depth: maxDepth,
      });
    });
  }

  // Deeper rings: each parent gets a slice of angle for its children.
  for (let d = 2; d <= maxDepth; d++) {
    const ids = byDepth.get(d) ?? [];
    const byParent = new Map<string, string[]>();
    for (const id of ids) {
      const p = parent.get(id);
      if (!p) continue;
      const arr = byParent.get(p) ?? [];
      arr.push(id);
      byParent.set(p, arr);
    }
    for (const [p, kids] of byParent) {
      const parentAngle = angleOf.get(p) ?? 0;
      const spread = Math.min(Math.PI * 0.7, 0.35 + kids.length * 0.22);
      kids.sort();
      kids.forEach((id, i) => {
        const a =
          kids.length === 1
            ? parentAngle
            : parentAngle -
              spread / 2 +
              (i / (kids.length - 1)) * spread;
        angleOf.set(id, a);
        const r = FIRST_RING + (d - 1) * RING_STEP;
        placedPos.set(id, {
          x: Math.cos(a) * r,
          y: Math.sin(a) * r,
          depth: d,
        });
      });
    }
  }

  const nodes: Placed[] = [];
  for (const [id, p] of placedPos) {
    const n = byId.get(id);
    const title = n?.title?.trim() || n?.slug_name || id;
    nodes.push({
      id,
      x: p.x,
      y: p.y,
      r: id === anchorId ? ANCHOR_R : NODE_R,
      depth: p.depth,
      title,
      isAnchor: id === anchorId,
    });
  }

  const edges: { from: string; to: string }[] = [];
  for (const [id, n] of byId) {
    if (!placedPos.has(id)) continue;
    for (const child of n.outgoing_ids ?? []) {
      if (placedPos.has(child) && child !== id) {
        edges.push({ from: id, to: child });
      }
    }
  }

  let minX = -ANCHOR_R;
  let maxX = ANCHOR_R;
  let minY = -ANCHOR_R;
  let maxY = ANCHOR_R;
  for (const p of nodes) {
    if (p.x - p.r < minX) minX = p.x - p.r;
    if (p.x + p.r > maxX) maxX = p.x + p.r;
    if (p.y - p.r < minY) minY = p.y - p.r;
    if (p.y + p.r > maxY) maxY = p.y + p.r;
  }
  const pad = 80;
  return {
    nodes,
    edges,
    bounds: {
      x: minX - pad,
      y: minY - pad,
      w: maxX - minX + pad * 2,
      h: maxY - minY + pad * 2,
    },
  };
}

// Naive word-wrap to fit a circle: aim for ~3 short lines.
function wrap(text: string, lineLen: number, maxLines: number): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let current = "";
  for (const w of words) {
    const candidate = current ? current + " " + w : w;
    if (candidate.length <= lineLen) {
      current = candidate;
    } else {
      if (current) lines.push(current);
      current = w;
      if (lines.length >= maxLines) break;
    }
  }
  if (current && lines.length < maxLines) lines.push(current);
  if (lines.length === maxLines && words.length > lines.join(" ").split(/\s+/).length) {
    const last = lines[maxLines - 1];
    lines[maxLines - 1] =
      last.length > lineLen - 1 ? last.slice(0, lineLen - 1) + "…" : last + "…";
  }
  return lines;
}

export function RadialGraphView({
  anchorId,
  nodes,
}: {
  anchorId: string;
  nodes: NodeSummary[];
}) {
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerSize, setContainerSize] = useState({ w: 800, h: 500 });
  const [viewBox, setViewBox] = useState<ViewBox | null>(null);
  const dragRef = useRef<{ x: number; y: number; vb: ViewBox } | null>(null);

  const layout = useMemo(() => {
    const byId = new Map(nodes.map((n) => [n.node_id, n]));
    return layoutRadial(anchorId, byId);
  }, [anchorId, nodes]);

  const posById = useMemo(() => {
    const m = new Map<string, Placed>();
    for (const p of layout.nodes) m.set(p.id, p);
    return m;
  }, [layout]);

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

  const fittedKey = useRef("");
  useEffect(() => {
    const key = `${layout.bounds.w}x${layout.bounds.h}|${containerSize.w}x${containerSize.h}|${anchorId}`;
    if (fittedKey.current === key) return;
    fittedKey.current = key;
    const aspect = containerSize.w / Math.max(1, containerSize.h);
    let w = layout.bounds.w;
    let h = layout.bounds.h;
    if (w / h > aspect) h = w / aspect;
    else w = h * aspect;
    setViewBox({
      x: layout.bounds.x + (layout.bounds.w - w) / 2,
      y: layout.bounds.y + (layout.bounds.h - h) / 2,
      w,
      h,
    });
  }, [layout, containerSize, anchorId]);

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

  const onPointerDown = (e: React.PointerEvent) => {
    if (!viewBox) return;
    (e.target as Element).setPointerCapture?.(e.pointerId);
    dragRef.current = { x: e.clientX, y: e.clientY, vb: viewBox };
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragRef.current || !viewBox) return;
    const rect = (e.currentTarget as SVGSVGElement).getBoundingClientRect();
    const dx =
      ((e.clientX - dragRef.current.x) / rect.width) * dragRef.current.vb.w;
    const dy =
      ((e.clientY - dragRef.current.y) / rect.height) * dragRef.current.vb.h;
    setViewBox({
      x: dragRef.current.vb.x - dx,
      y: dragRef.current.vb.y - dy,
      w: dragRef.current.vb.w,
      h: dragRef.current.vb.h,
    });
  };
  const onPointerUp = (e: React.PointerEvent) => {
    (e.target as Element).releasePointerCapture?.(e.pointerId);
    dragRef.current = null;
  };

  const resetView = () => {
    fittedKey.current = "";
    setContainerSize((s) => ({ ...s }));
  };

  return (
    <div className="graph-canvas radial-canvas" ref={containerRef}>
      <button
        type="button"
        onClick={resetView}
        className="graph-fit-btn"
        title="Fit graph to viewport"
      >
        fit
      </button>
      {viewBox && (
        <svg
          className="graph-svg"
          viewBox={`${viewBox.x} ${viewBox.y} ${viewBox.w} ${viewBox.h}`}
          onWheel={onWheel}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
        >
          <defs>
            <marker
              id="radial-arrow"
              viewBox="0 0 10 10"
              refX="9"
              refY="5"
              markerWidth="5"
              markerHeight="5"
              orient="auto-start-reverse"
            >
              <path d="M0,0 L10,5 L0,10 z" className="radial-arrow-head" />
            </marker>
          </defs>
          <g>
            {layout.edges.map((e, i) => {
              const a = posById.get(e.from);
              const b = posById.get(e.to);
              if (!a || !b) return null;
              const dx = b.x - a.x;
              const dy = b.y - a.y;
              const len = Math.hypot(dx, dy);
              if (len < 0.001) return null;
              // shorten on both ends so arrowhead sits at the node edge
              const ux = dx / len;
              const uy = dy / len;
              const sx = a.x + ux * a.r;
              const sy = a.y + uy * a.r;
              const ex = b.x - ux * (b.r + 2);
              const ey = b.y - uy * (b.r + 2);
              return (
                <line
                  key={i}
                  x1={sx}
                  y1={sy}
                  x2={ex}
                  y2={ey}
                  className="radial-edge"
                  markerEnd="url(#radial-arrow)"
                />
              );
            })}
          </g>
          <g>
            {layout.nodes.map((n) => {
              const klass = n.isAnchor
                ? "radial-node radial-node-anchor"
                : n.depth === 1
                  ? "radial-node radial-node-d1"
                  : "radial-node radial-node-d2";
              const lineCount = n.isAnchor ? 2 : 3;
              const lineLen = n.isAnchor ? 10 : 12;
              const lines = wrap(n.title, lineLen, lineCount);
              const lineH = n.isAnchor ? 7.5 : 7;
              const startY = n.y - ((lines.length - 1) * lineH) / 2;
              return (
                <g
                  key={n.id}
                  className={klass}
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/n/${encodeURIComponent(n.id)}`);
                  }}
                >
                  <circle cx={n.x} cy={n.y} r={n.r} className="radial-node-bg" />
                  <text
                    x={n.x}
                    y={startY}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    className="radial-node-label"
                  >
                    {lines.map((ln, i) => (
                      <tspan key={i} x={n.x} dy={i === 0 ? 0 : lineH}>
                        {ln}
                      </tspan>
                    ))}
                  </text>
                </g>
              );
            })}
          </g>
        </svg>
      )}
    </div>
  );
}
