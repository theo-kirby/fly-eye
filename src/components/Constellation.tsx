import { useMemo } from "react";
import type { NodeSummary } from "../api/flywheel";

interface Placed {
  id: string;
  x: number;
  y: number;
}

interface Layout {
  nodes: Placed[];
  edges: { ax: number; ay: number; bx: number; by: number }[];
  anchorId: string;
}

// BFS depth from the anchor. Each depth becomes a column; nodes inside a
// column are distributed vertically. Edges are drawn for outgoing_ids that
// land on other placed nodes.
function buildLayout(
  anchorId: string,
  byId: Map<string, NodeSummary>,
  width: number,
  height: number,
  padding: number,
): Layout {
  const depth = new Map<string, number>();
  const queue: string[] = [anchorId];
  depth.set(anchorId, 0);
  while (queue.length) {
    const id = queue.shift()!;
    const n = byId.get(id);
    if (!n) continue;
    const d = depth.get(id) ?? 0;
    for (const child of n.outgoing_ids ?? []) {
      if (!depth.has(child) && byId.has(child)) {
        depth.set(child, d + 1);
        queue.push(child);
      }
    }
  }

  const byDepth = new Map<number, string[]>();
  for (const [id, d] of depth) {
    const arr = byDepth.get(d) ?? [];
    arr.push(id);
    byDepth.set(d, arr);
  }
  const maxDepth = Math.max(0, ...depth.values());

  const pos = new Map<string, { x: number; y: number }>();
  for (const [d, ids] of byDepth) {
    ids.sort();
    const x =
      maxDepth === 0
        ? width / 2
        : padding + (d / maxDepth) * (width - 2 * padding);
    ids.forEach((id, i) => {
      const y =
        ids.length === 1
          ? height / 2
          : padding + (i / (ids.length - 1)) * (height - 2 * padding);
      pos.set(id, { x, y });
    });
  }

  const edges: Layout["edges"] = [];
  for (const [id, p] of pos) {
    const n = byId.get(id);
    if (!n) continue;
    for (const child of n.outgoing_ids ?? []) {
      const q = pos.get(child);
      if (q) edges.push({ ax: p.x, ay: p.y, bx: q.x, by: q.y });
    }
  }

  const placed: Placed[] = [];
  for (const [id, p] of pos) placed.push({ id, x: p.x, y: p.y });

  return { nodes: placed, edges, anchorId };
}

interface ConstellationProps {
  anchorId: string;
  nodes: NodeSummary[];
  width?: number;
  height?: number;
}

export function Constellation({
  anchorId,
  nodes,
  width = 220,
  height = 120,
}: ConstellationProps) {
  const layout = useMemo(() => {
    const byId = new Map(nodes.map((n) => [n.node_id, n]));
    return buildLayout(anchorId, byId, width, height, 10);
  }, [anchorId, nodes, width, height]);

  return (
    <svg
      className="constellation"
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      {layout.edges.map((e, i) => (
        <line
          key={i}
          x1={e.ax}
          y1={e.ay}
          x2={e.bx}
          y2={e.by}
          className="constellation-edge"
        />
      ))}
      {layout.nodes.map((n) => (
        <circle
          key={n.id}
          cx={n.x}
          cy={n.y}
          r={n.id === layout.anchorId ? 3.5 : 2}
          className={
            n.id === layout.anchorId
              ? "constellation-node anchor"
              : "constellation-node"
          }
        />
      ))}
    </svg>
  );
}
