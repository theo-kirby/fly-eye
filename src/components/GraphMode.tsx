import { useState } from "react";
import type { NodeSummary } from "../api/flywheel";
import { GraphView } from "./GraphView";
import { Icon, type IconName } from "./Icon";
import { RadialGraphView } from "./RadialGraphView";
import { ReplayView } from "./ReplayView";

type GraphSubMode = "graph" | "dag" | "replay";

const SUB_MODES: { id: GraphSubMode; icon: IconName; label: string }[] = [
  { id: "graph", icon: "graph", label: "graph" },
  { id: "dag", icon: "dag", label: "dag" },
  { id: "replay", icon: "replay", label: "replay" },
];

export function GraphMode({
  anchorId,
  nodes,
}: {
  anchorId: string;
  nodes: NodeSummary[];
}) {
  const [mode, setMode] = useState<GraphSubMode>("graph");

  return (
    <div className="graph-mode">
      {mode === "graph" && <RadialGraphView anchorId={anchorId} nodes={nodes} />}
      {mode === "dag" && <GraphView anchorId={anchorId} nodes={nodes} />}
      {mode === "replay" && <ReplayView anchorId={anchorId} nodes={nodes} />}
      <nav className="graph-mode-switch" aria-label="Graph mode">
        {SUB_MODES.map((m) => {
          const active = m.id === mode;
          return (
            <button
              key={m.id}
              type="button"
              className={active ? "layout-btn is-active" : "layout-btn"}
              onClick={() => setMode(m.id)}
              aria-pressed={active}
              title={m.label}
            >
              <Icon name={m.icon} size={13} />
              <span className="layout-btn-label">{m.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
