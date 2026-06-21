import type { NodeSummary } from "../api/flywheel";

export const NODE_W = 170;
export const NODE_H = 44;
export const COL_GAP = 90;
export const ROW_GAP = 18;
export const PAD = 40;

export interface Placed {
  id: string;
  x: number;
  y: number;
  title: string;
  isAnchor: boolean;
}

export interface Edge {
  from: string;
  to: string;
}

export interface LayoutResult {
  nodes: Placed[];
  edges: Edge[];
  width: number;
  height: number;
}

// Layered layout for a DAG with the anchor at column 0.
//   - Forward BFS via outgoing edges places descendants in positive columns.
//   - Backward BFS via incoming edges places ancestors in negative columns.
//   - Anything still unreachable from the anchor is collected in an "orphans"
//     column at the far right so every node in `byId` is visible.
// Within each column, sort by mean Y of already-placed neighbours (one-pass
// barycenter) to keep crossings sane.
export function layoutLayered(
  anchorId: string,
  byId: Map<string, NodeSummary>,
): LayoutResult {
  const depth = new Map<string, number>();
  depth.set(anchorId, 0);

  // Forward BFS — descendants (positive depth).
  let frontier: string[] = [anchorId];
  while (frontier.length) {
    const next: string[] = [];
    for (const id of frontier) {
      const node = byId.get(id);
      if (!node) continue;
      const d = depth.get(id) ?? 0;
      for (const child of node.outgoing_ids ?? []) {
        if (!depth.has(child) && byId.has(child)) {
          depth.set(child, d + 1);
          next.push(child);
        }
      }
    }
    frontier = next;
  }

  // Backward BFS — ancestors (negative depth).
  frontier = [anchorId];
  while (frontier.length) {
    const next: string[] = [];
    for (const id of frontier) {
      const node = byId.get(id);
      if (!node) continue;
      const d = depth.get(id) ?? 0;
      for (const parent of node.incoming_ids ?? []) {
        if (!depth.has(parent) && byId.has(parent)) {
          depth.set(parent, d - 1);
          next.push(parent);
        }
      }
    }
    frontier = next;
  }

  // Orphans: any node in byId that BFS couldn't reach from the anchor.
  const reachedDepths = [...depth.values()];
  const maxReached = reachedDepths.length ? Math.max(...reachedDepths) : 0;
  for (const id of byId.keys()) {
    if (!depth.has(id)) depth.set(id, maxReached + 1);
  }

  // Shift so the smallest depth becomes column 0.
  const minDepth = Math.min(...depth.values());
  if (minDepth !== 0) {
    for (const [id, d] of depth) depth.set(id, d - minDepth);
  }

  const cols: string[][] = [];
  for (const [id, d] of depth) {
    cols[d] = cols[d] ?? [];
    cols[d].push(id);
  }
  cols.forEach((col) => col?.sort());

  const pos = new Map<string, { x: number; y: number }>();
  const colY = (idx: number) => PAD + idx * (NODE_H + ROW_GAP) + NODE_H / 2;

  if (cols[0]) {
    cols[0].forEach((id, i) => {
      pos.set(id, { x: PAD + NODE_W / 2, y: colY(i) });
    });
  }

  for (let d = 1; d < cols.length; d++) {
    const col = cols[d];
    if (!col) continue;
    const incoming = new Map<string, string[]>();
    for (const [id, n] of byId) {
      for (const child of n.outgoing_ids ?? []) {
        const list = incoming.get(child) ?? [];
        list.push(id);
        incoming.set(child, list);
      }
    }
    const score = (id: string) => {
      const parents = incoming.get(id) ?? [];
      const ys = parents
        .map((p) => pos.get(p)?.y)
        .filter((y): y is number => y !== undefined);
      if (ys.length === 0) return Number.POSITIVE_INFINITY;
      return ys.reduce((a, b) => a + b, 0) / ys.length;
    };
    col.sort((a, b) => score(a) - score(b));
    col.forEach((id, i) => {
      pos.set(id, {
        x: PAD + d * (NODE_W + COL_GAP) + NODE_W / 2,
        y: colY(i),
      });
    });
  }

  const placed: Placed[] = [];
  for (const [id, p] of pos) {
    const n = byId.get(id);
    placed.push({
      id,
      x: p.x,
      y: p.y,
      title: n?.title?.trim() || n?.slug_name || id,
      isAnchor: id === anchorId,
    });
  }

  const edges: Edge[] = [];
  for (const [id, n] of byId) {
    if (!pos.has(id)) continue;
    for (const child of n.outgoing_ids ?? []) {
      if (pos.has(child)) edges.push({ from: id, to: child });
    }
  }

  const maxX = Math.max(0, ...placed.map((p) => p.x + NODE_W / 2));
  const maxY = Math.max(0, ...placed.map((p) => p.y + NODE_H / 2));

  return {
    nodes: placed,
    edges,
    width: maxX + PAD,
    height: maxY + PAD,
  };
}

export function truncate(s: string, max: number): string {
  if (s.length <= max) return s;
  return s.slice(0, max - 1) + "…";
}
