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
import { Icon } from "./Icon";
import { layoutLayered, NODE_H, NODE_W, truncate, type Placed } from "../lib/layout";

interface ViewBox {
  x: number;
  y: number;
  w: number;
  h: number;
}

export function GraphView({
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
    return layoutLayered(anchorId, byId);
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
    const dx = ((e.clientX - dragRef.current.x) / rect.width) * dragRef.current.vb.w;
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
    <div className="graph-canvas" ref={containerRef}>
      <button
        type="button"
        onClick={resetView}
        className="graph-fit-btn"
        title="Fit graph to viewport"
      >
        <Icon name="expand" size={12} />
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
              id="arrow"
              viewBox="0 0 10 10"
              refX="9"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M0,0 L10,5 L0,10 z" className="graph-arrow-head" />
            </marker>
          </defs>
          <g>
            {layout.edges.map((e, i) => {
              const a = posById.get(e.from);
              const b = posById.get(e.to);
              if (!a || !b) return null;
              const ax = a.x + NODE_W / 2;
              const bx = b.x - NODE_W / 2;
              const mx = (ax + bx) / 2;
              const d = `M ${ax} ${a.y} C ${mx} ${a.y}, ${mx} ${b.y}, ${bx} ${b.y}`;
              return (
                <path
                  key={i}
                  d={d}
                  className="graph-edge"
                  markerEnd="url(#arrow)"
                />
              );
            })}
          </g>
          <g>
            {layout.nodes.map((n) => (
              <g
                key={n.id}
                transform={`translate(${n.x - NODE_W / 2} ${n.y - NODE_H / 2})`}
                className={n.isAnchor ? "graph-node anchor" : "graph-node"}
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/n/${encodeURIComponent(n.id)}`);
                }}
              >
                <rect
                  width={NODE_W}
                  height={NODE_H}
                  rx={6}
                  className="graph-node-bg"
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
            ))}
          </g>
        </svg>
      )}
    </div>
  );
}
