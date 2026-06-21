import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import type { NodeSummary } from "../api/flywheel";
import { Icon } from "./Icon";
import { State } from "./State";

const STOPWORDS = new Set([
  "the",
  "and",
  "for",
  "with",
  "from",
  "that",
  "this",
  "into",
  "over",
  "under",
  "are",
  "was",
  "were",
  "but",
  "not",
  "you",
  "all",
  "any",
  "can",
  "has",
  "had",
  "have",
  "its",
  "their",
  "them",
  "they",
  "our",
  "out",
  "via",
]);

function tokenize(s: string): string[] {
  return s
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((t) => t.length > 2 && !STOPWORDS.has(t));
}

// Deterministic hash → 2D unit vector. Tokens shared across nodes pull them
// to the same spot; unrelated tokens cancel out. This is just random
// projection of a bag-of-words vector — not a real embedding, but enough
// to cluster nodes by shared vocabulary in a demo.
function tokenVector(t: string): { rx: number; ry: number } {
  let h1 = 2166136261 >>> 0;
  let h2 = 5381 >>> 0;
  for (let i = 0; i < t.length; i++) {
    const c = t.charCodeAt(i);
    h1 = Math.imul(h1 ^ c, 16777619) >>> 0;
    h2 = ((h2 * 33) ^ c) >>> 0;
  }
  const a = (h1 / 0xffffffff) * 2 * Math.PI;
  return { rx: Math.cos(a), ry: Math.sin(a + (h2 % 1000) * 0.001) };
}

function project(text: string): { x: number; y: number; norm: number } {
  const tokens = tokenize(text);
  let x = 0;
  let y = 0;
  for (const t of tokens) {
    const v = tokenVector(t);
    x += v.rx;
    y += v.ry;
  }
  const norm = Math.sqrt(Math.max(1, tokens.length));
  return { x: x / norm, y: y / norm, norm: tokens.length };
}

interface EmbedNode {
  id: string;
  title: string;
  x: number;
  y: number;
  isAnchor: boolean;
  weight: number;
}

const VIEW_W = 100;
const VIEW_H = 60;

export function EmbedView({
  anchorId,
  nodes,
}: {
  anchorId: string;
  nodes: NodeSummary[];
}) {
  const navigate = useNavigate();

  const placed = useMemo(() => {
    const out: EmbedNode[] = [];
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    for (const n of nodes) {
      const text = `${n.title ?? ""} ${n.summary ?? ""}`;
      const p = project(text);
      const title = n.title?.trim() || n.slug_name || n.node_id;
      out.push({
        id: n.node_id,
        title,
        x: p.x,
        y: p.y,
        isAnchor: n.node_id === anchorId,
        weight: p.norm,
      });
      if (p.x < minX) minX = p.x;
      if (p.x > maxX) maxX = p.x;
      if (p.y < minY) minY = p.y;
      if (p.y > maxY) maxY = p.y;
    }
    if (!Number.isFinite(minX)) return out;
    const dx = maxX - minX || 1;
    const dy = maxY - minY || 1;
    const pad = 8;
    for (const n of out) {
      n.x = pad + ((n.x - minX) / dx) * (VIEW_W - 2 * pad);
      n.y = pad + ((n.y - minY) / dy) * (VIEW_H - 2 * pad);
    }
    return out;
  }, [nodes, anchorId]);

  if (placed.length === 0) {
    return <State variant="empty" title="No nodes to embed" />;
  }

  return (
    <div className="embed-wrap">
      <svg
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        className="embed-svg"
        preserveAspectRatio="xMidYMid meet"
      >
        {placed.map((n) => (
          <g
            key={n.id}
            onClick={() => navigate(`/n/${encodeURIComponent(n.id)}`)}
            className="embed-node"
          >
            <circle
              cx={n.x}
              cy={n.y}
              r={n.isAnchor ? 1.4 : 0.9}
              className={
                n.isAnchor ? "embed-dot anchor" : "embed-dot"
              }
            />
            <text
              x={n.x + 1.2}
              y={n.y + 0.4}
              className="embed-label"
            >
              {n.title.length > 24 ? n.title.slice(0, 24) + "…" : n.title}
            </text>
          </g>
        ))}
      </svg>
      <p className="embed-disclaimer">
        <Icon name="info" size={12} />
        Random projection of bag-of-words on title + summary. Nodes that share
        vocabulary land near each other — useful for spotting unrelated
        branches that touch the same topic. Not a real embedding model.
      </p>
    </div>
  );
}
