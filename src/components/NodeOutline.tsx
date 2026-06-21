import type { NodeSummary } from "../api/flywheel";
import { Icon } from "./Icon";

const SNIPPET_LEN = 240;

function snippet(s: string | null | undefined): string | null {
  if (!s) return null;
  const trimmed = s.trim();
  if (!trimmed) return null;
  return trimmed.length > SNIPPET_LEN
    ? trimmed.slice(0, SNIPPET_LEN) + "…"
    : trimmed;
}

interface OutlineProps {
  node: NodeSummary;
  byId: Map<string, NodeSummary>;
  // visited tracks ancestor chain to break DAG cycles + avoid re-rendering
  // the same subtree multiple times when it has multiple parents.
  visited?: Set<string>;
}

export function NodeOutline({ node, byId, visited }: OutlineProps) {
  const seen = visited ?? new Set<string>();
  if (seen.has(node.node_id)) {
    return (
      <ul className="outline">
        <li>
          <div className="muted" style={{ display: "inline-flex", alignItems: "center", gap: "0.3rem" }}>
            <Icon name="info" size={11} />
            <code>{node.node_id}</code> (already shown above)
          </div>
        </li>
      </ul>
    );
  }
  const nextSeen = new Set(seen);
  nextSeen.add(node.node_id);

  const childIds = node.outgoing_ids ?? [];
  const children = childIds
    .map((id) => byId.get(id))
    .filter((n): n is NodeSummary => Boolean(n));
  const snip = snippet(node.summary) ?? snippet(node.content);
  const title = node.title?.trim() || node.slug_name || node.node_id;

  return (
    <ul className="outline">
      <li>
        <div className="node-title">{title}</div>
        {snip && <div className="node-snippet">{snip}</div>}
        <div className="muted">
          <code>{node.node_id}</code>
          {childIds.length > 0 && (
            <>
              {" · "}
              {childIds.length} child{childIds.length === 1 ? "" : "ren"}
              {children.length < childIds.length &&
                ` (${childIds.length - children.length} not loaded)`}
            </>
          )}
        </div>
        {children.map((child) => (
          <NodeOutline
            key={child.node_id}
            node={child}
            byId={byId}
            visited={nextSeen}
          />
        ))}
      </li>
    </ul>
  );
}
