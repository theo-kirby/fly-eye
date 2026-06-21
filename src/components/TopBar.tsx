import { Link, useMatch, useSearchParams } from "react-router-dom";
import { useTheme } from "../theme/useTheme";
import { Icon, type IconName } from "./Icon";

export type HomeLayout = "list" | "atlas";
export type NodeLayout =
  | "tree"
  | "graph"
  | "calendar"
  | "waterfall"
  | "embed"
  | "reading";
export type Layout = HomeLayout | NodeLayout;

const HOME_LAYOUTS: HomeLayout[] = ["list", "atlas"];
export const NODE_LAYOUTS: NodeLayout[] = [
  "tree",
  "graph",
  "calendar",
  "waterfall",
  "embed",
  "reading",
];

const LAYOUT_ICON: Record<Layout, IconName> = {
  list: "list",
  atlas: "atlas",
  tree: "tree",
  graph: "graph",
  calendar: "calendar",
  waterfall: "waterfall",
  embed: "embed",
  reading: "reading",
};

export function TopBar() {
  const onNode = useMatch("/n/:nodeId");
  const [params, setParams] = useSearchParams();
  const { theme, toggle } = useTheme();

  const homeCurrent =
    (params.get("layout") as HomeLayout | null) ?? HOME_LAYOUTS[0];
  const nodeCurrent =
    (params.get("layout") as NodeLayout | null) ?? NODE_LAYOUTS[0];

  const setLayout = (l: Layout, defaultLayout: Layout) => {
    const next = new URLSearchParams(params);
    if (l === defaultLayout) next.delete("layout");
    else next.set("layout", l);
    setParams(next, { replace: true });
  };

  const layouts: Layout[] = onNode ? NODE_LAYOUTS : HOME_LAYOUTS;
  const current: Layout = onNode ? nodeCurrent : homeCurrent;
  const defaultLayout: Layout = layouts[0];

  return (
    <header className="topbar">
      <div className="topbar-left">
        <Link to="/" className="brand" aria-label="fly-eye home">
          <span className="brand-mark">
            <Icon name="brand" size={20} />
          </span>
          <span>fly-eye</span>
        </Link>
        <span className="brand-tag">Flywheel public graph viewer</span>
      </div>
      <div className="topbar-right">
        <nav className="layout-switch" aria-label="Layout">
          {layouts.map((l) => {
            const active = l === current;
            return (
              <button
                key={l}
                type="button"
                className={active ? "layout-btn is-active" : "layout-btn"}
                onClick={() => setLayout(l, defaultLayout)}
                title={l}
                aria-pressed={active}
              >
                <Icon name={LAYOUT_ICON[l]} size={14} />
                <span className="layout-btn-label">{l}</span>
              </button>
            );
          })}
        </nav>
        <button
          type="button"
          className="theme-btn"
          onClick={toggle}
          aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} theme`}
          title={`Switch to ${theme === "dark" ? "light" : "dark"} theme`}
        >
          <Icon name={theme === "dark" ? "sun" : "moon"} size={16} />
        </button>
      </div>
    </header>
  );
}
