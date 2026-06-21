import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { getSubgraph, type NodeSummary } from "../api/flywheel";
import { Constellation } from "./Constellation";
import { Icon } from "./Icon";

export function AtlasTile({ root }: { root: NodeSummary }) {
  // Same cache key the NodeView uses, so clicking through is instant.
  const { data, isLoading, error } = useQuery({
    queryKey: ["subgraph", root.node_id],
    queryFn: () => getSubgraph(root.node_id, 150),
  });

  const title = root.title?.trim() || root.slug_name || root.node_id;
  const owner = root.owner_user_email || root.owner_email;
  const nodes = data ? Object.values(data.nodes_by_id) : [];

  return (
    <Link to={`/n/${encodeURIComponent(root.node_id)}`} className="atlas-tile">
      <div className="atlas-tile-canvas">
        {isLoading && (
          <span className="muted spin" aria-label="Loading">
            <Icon name="spinner" size={18} />
          </span>
        )}
        {error && (
          <span className="error" aria-label="Error">
            <Icon name="warn" size={18} />
          </span>
        )}
        {!isLoading && !error && nodes.length > 0 && (
          <Constellation anchorId={root.node_id} nodes={nodes} />
        )}
      </div>
      <div className="atlas-tile-meta">
        <div className="atlas-tile-title" title={title}>
          {title}
        </div>
        <div className="atlas-tile-sub">
          <Icon name="graph" size={11} />
          {nodes.length > 0 ? `${nodes.length} nodes` : "—"}
          {owner && (
            <>
              <span aria-hidden="true">·</span>
              <span style={{ display: "inline-flex", alignItems: "center", gap: "0.25rem" }}>
                <Icon name="owners" size={11} /> {owner.split("@")[0]}
              </span>
            </>
          )}
        </div>
      </div>
    </Link>
  );
}
