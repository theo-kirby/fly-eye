import { useQuery } from "@tanstack/react-query";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { getSubgraph } from "../api/flywheel";
import { NodeOutline } from "../components/NodeOutline";
import { GraphMode } from "../components/GraphMode";
import { CalendarView } from "../components/CalendarView";
import { WaterfallView } from "../components/WaterfallView";
import { ReadingView } from "../components/ReadingView";
import { EmbedView } from "../components/EmbedView";
import { Icon } from "../components/Icon";
import { State } from "../components/State";
import type { NodeLayout } from "../components/TopBar";

const FULL_BLEED: NodeLayout[] = ["graph", "embed"];

export function NodeView() {
  const { nodeId = "" } = useParams<{ nodeId: string }>();
  const [params] = useSearchParams();
  const layout = ((params.get("layout") as NodeLayout | null) ??
    "tree") as NodeLayout;

  const { data, isLoading, error } = useQuery({
    queryKey: ["subgraph", nodeId],
    queryFn: () => getSubgraph(nodeId, 500),
    enabled: Boolean(nodeId),
  });

  if (isLoading) {
    return (
      <div className="viz">
        <State variant="loading" title="Loading subgraph…" />
      </div>
    );
  }
  if (error) {
    return (
      <div className="viz">
        <State variant="error" title="Couldn't load subgraph">
          <span className="muted">{(error as Error).message}</span>
        </State>
      </div>
    );
  }
  if (!data) return null;

  const byId = new Map(Object.entries(data.nodes_by_id));
  const anchor = byId.get(nodeId);
  const allNodes = Object.values(data.nodes_by_id);
  const anchorTitle =
    anchor?.title?.trim() || anchor?.slug_name || nodeId.slice(0, 8);

  const fullBleed = FULL_BLEED.includes(layout);

  let body: React.ReactNode = null;
  switch (layout) {
    case "tree":
      body = anchor ? (
        <NodeOutline node={anchor} byId={byId} />
      ) : (
        <State variant="empty" title="Anchor node not found in subgraph response." />
      );
      break;
    case "graph":
      body = <GraphMode anchorId={nodeId} nodes={allNodes} />;
      break;
    case "calendar":
      body = <CalendarView nodes={allNodes} />;
      break;
    case "waterfall":
      body = <WaterfallView nodes={allNodes} />;
      break;
    case "embed":
      body = <EmbedView anchorId={nodeId} nodes={allNodes} />;
      break;
    case "reading":
      body = <ReadingView anchorId={nodeId} nodes={allNodes} />;
      break;
  }

  return (
    <>
      <div className="subhead">
        <Link to="/" className="back-link">
          <Icon name="arrow-left" size={14} /> Roots
        </Link>
        <span className="subhead-title" title={anchorTitle}>
          {anchorTitle}
        </span>
        <span className="subhead-stats">
          <span className="badge">
            <Icon name="graph" size={11} />
            {allNodes.length} nodes
          </span>
          {data.has_more && (
            <span className="badge" title="More nodes are available but were not loaded">
              <Icon name="info" size={11} /> more available
            </span>
          )}
        </span>
      </div>

      <div className={fullBleed ? "viz viz-full" : "viz"}>{body}</div>
    </>
  );
}
