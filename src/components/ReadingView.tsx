import { useMemo, useState } from "react";
import type { NodeSummary } from "../api/flywheel";
import { Icon } from "./Icon";

function pickPath(
  anchorId: string,
  byId: Map<string, NodeSummary>,
  preferredChildIdx = 0,
): NodeSummary[] {
  const path: NodeSummary[] = [];
  const seen = new Set<string>();
  let current: string | undefined = anchorId;
  let step = 0;
  while (current) {
    if (seen.has(current)) break;
    seen.add(current);
    const n = byId.get(current);
    if (!n) break;
    path.push(n);
    const children = (n.outgoing_ids ?? []).filter(
      (id) => !seen.has(id) && byId.has(id),
    );
    if (children.length === 0) break;
    // First step uses preferredChildIdx; thereafter, just pick first.
    const idx = step === 0 ? preferredChildIdx % children.length : 0;
    current = children[idx];
    step += 1;
  }
  return path;
}

export function ReadingView({
  anchorId,
  nodes,
}: {
  anchorId: string;
  nodes: NodeSummary[];
}) {
  const byId = useMemo(
    () => new Map(nodes.map((n) => [n.node_id, n])),
    [nodes],
  );
  const anchor = byId.get(anchorId);
  const branchCount = anchor?.outgoing_ids?.length ?? 0;
  const [branchIdx, setBranchIdx] = useState(0);
  const path = useMemo(
    () => pickPath(anchorId, byId, branchIdx),
    [anchorId, byId, branchIdx],
  );

  return (
    <div className="reading">
      <div className="reading-controls">
        <span className="badge">
          <Icon name="reading" size={11} />
          {path.length} node{path.length === 1 ? "" : "s"}
        </span>
        {branchCount > 1 && (
          <>
            <button
              type="button"
              className="graph-btn"
              onClick={() => setBranchIdx((i) => (i - 1 + branchCount) % branchCount)}
              title="Previous branch"
            >
              <Icon name="arrow-left" size={12} />
              branch
            </button>
            <span className="muted" style={{ fontVariantNumeric: "tabular-nums" }}>
              {(branchIdx % branchCount) + 1} / {branchCount}
            </span>
            <button
              type="button"
              className="graph-btn"
              onClick={() => setBranchIdx((i) => (i + 1) % branchCount)}
              title="Next branch"
            >
              branch
              <Icon name="arrow-left" size={12} style={{ transform: "rotate(180deg)" }} />
            </button>
          </>
        )}
      </div>
      <article className="reading-article">
        {path.map((n, i) => (
          <section key={n.node_id} className="reading-section">
            <h2>
              <span className="muted reading-num">{i + 1}.</span> {n.title || "(untitled)"}
            </h2>
            {n.summary && <p className="reading-summary">{n.summary}</p>}
            {n.content && (
              <pre className="reading-content">{n.content}</pre>
            )}
          </section>
        ))}
      </article>
    </div>
  );
}
