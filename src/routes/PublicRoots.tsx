import { useQuery } from "@tanstack/react-query";
import { Link, useSearchParams } from "react-router-dom";
import { listPublicRoots } from "../api/flywheel";
import { AtlasTile } from "../components/AtlasTile";
import { Icon } from "../components/Icon";
import { State } from "../components/State";
import type { HomeLayout } from "../components/TopBar";

const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];
const DEFAULT_PAGE_SIZE = 20;

export function PublicRoots() {
  const [params, setParams] = useSearchParams();
  const layout = ((params.get("layout") as HomeLayout | null) ??
    "list") as HomeLayout;
  const n = parseInt(params.get("n") ?? "", 10);
  const pageSize = PAGE_SIZE_OPTIONS.includes(n) ? n : DEFAULT_PAGE_SIZE;

  const setPageSize = (next: number) => {
    const p = new URLSearchParams(params);
    if (next === DEFAULT_PAGE_SIZE) p.delete("n");
    else p.set("n", String(next));
    setParams(p, { replace: true });
  };

  const { data, isLoading, error } = useQuery({
    queryKey: ["publicRoots"],
    queryFn: () => listPublicRoots(),
  });

  const allRoots = data?.roots ?? [];
  const roots = allRoots.slice(0, pageSize);

  return (
    <>
      <div className="subhead">
        <label className="muted" style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem" }}>
          Show
          <select
            value={pageSize}
            onChange={(e) => setPageSize(parseInt(e.target.value, 10))}
            aria-label="Number of roots to show"
          >
            {PAGE_SIZE_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
          roots
        </label>
        <span className="subhead-stats">
          {!isLoading && !error && (
            <span className="badge">
              <Icon name="atlas" size={11} />
              {roots.length === allRoots.length
                ? `${allRoots.length}`
                : `${roots.length} / ${allRoots.length}`}
            </span>
          )}
        </span>
      </div>

      <div className="viz">
        {isLoading && <State variant="loading" title="Loading public roots…" />}
        {error && (
          <State variant="error" title="Couldn't load public roots">
            <span className="muted">{(error as Error).message}</span>
          </State>
        )}
        {!isLoading && !error && roots.length === 0 && (
          <State variant="empty" title="No public roots returned">
            <span className="muted">Try minting a fresh key or check your network.</span>
          </State>
        )}

        {!isLoading && !error && roots.length > 0 && layout === "atlas" && (
          <div className="atlas-grid">
            {roots.map((r) => (
              <AtlasTile key={r.node_id} root={r} />
            ))}
          </div>
        )}

        {!isLoading && !error && roots.length > 0 && layout === "list" && (
          <ul className="root-list">
            {roots.map((n) => {
              const title = n.title?.trim() || n.slug_name || n.node_id;
              const owner = n.owner_user_email || n.owner_email;
              return (
                <li key={n.node_id} className="root-list-item">
                  <span className="state-icon" aria-hidden="true" style={{ color: "var(--muted)" }}>
                    <Icon name="tree" size={18} />
                  </span>
                  <div className="root-list-item-main">
                    <Link
                      to={`/n/${encodeURIComponent(n.node_id)}`}
                      className="root-list-item-title"
                    >
                      {title}
                    </Link>
                    <div className="root-list-item-meta">
                      {owner && (
                        <span style={{ display: "inline-flex", alignItems: "center", gap: "0.3rem" }}>
                          <Icon name="owners" size={11} /> {owner}
                        </span>
                      )}
                      <code>{n.node_id}</code>
                    </div>
                  </div>
                  <span className="root-list-item-aside">
                    <Icon name="arrow-left" size={14} style={{ transform: "rotate(180deg)" }} />
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </>
  );
}
