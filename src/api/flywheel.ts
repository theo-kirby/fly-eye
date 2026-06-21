import { request } from "./client";

export interface GraphTag {
  tag_id: string;
  name: string;
  bg_color?: string | null;
  text_color?: string | null;
  one_only?: boolean | null;
  track_history?: boolean | null;
}

export interface TagHistoryEntry {
  tag_id: string;
  history_index: number;
  superseded_at: string;
  superseded_by_node_id: string | null;
}

export interface NodeSummary {
  node_id: string;
  title?: string | null;
  slug_name?: string | null;
  summary?: string | null;
  content?: string | null;
  visibility?: string | null;
  revision?: number | null;
  created_at?: string | null;
  updated_at?: string | null;
  owner_email?: string | null;
  owner_user_email?: string | null;
  home_domain?: string | null;
  outgoing_ids?: string[] | null;
  incoming_ids?: string[] | null;
  graph_tags?: GraphTag[] | null;
  tag_ids?: string[] | null;
  tag_history?: TagHistoryEntry[] | null;
  artifacts_total?: number | null;
  is_root?: boolean | null;
  depth?: number | null;
  lane?: number | null;
}

export interface Artifact {
  artifact_id: string;
  artifact_type?: string | null;
  title?: string | null;
  storage_url?: string | null;
  storage_path?: string | null;
  media_type?: string | null;
  payload?: {
    path?: string | null;
    media_type?: string | null;
  } | null;
  created_at?: string | null;
}

export interface ArtifactsResponse {
  artifacts: Artifact[];
  total?: number;
}

export interface GraphResponse {
  roots: NodeSummary[];
  nodes_by_id: Record<string, NodeSummary>;
  has_more?: boolean;
  next_cursor?: string | null;
  page_size?: number;
}

// Browse all public roots across users. depth=0 means "roots only, no
// descendants" — without it, max_nodes is a budget for roots + their topology
// and clips the roots list before we run out of actual roots.
export function listPublicRoots() {
  const params = new URLSearchParams({
    projection: "topology",
    access_scopes: "public",
    depth: "0",
    max_nodes: "500",
  });
  return request<GraphResponse>(`/v1/graph?${params.toString()}`);
}

// Pull the full subgraph rooted at a node — used for both tree and horserace.
// access_scopes=public so nodes from other users are included.
export function getSubgraph(nodeId: string, maxNodes = 500) {
  const params = new URLSearchParams({
    node_id: nodeId,
    access_scopes: "public",
    projection: "full",
    max_nodes: String(maxNodes),
  });
  return request<GraphResponse>(`/v1/graph?${params.toString()}`);
}

export function listNodeArtifacts(nodeId: string, limit = 50) {
  const params = new URLSearchParams({
    offset: "0",
    limit: String(limit),
  });
  return request<ArtifactsResponse>(
    `/v1/nodes/${encodeURIComponent(nodeId)}/artifacts?${params.toString()}`,
  );
}

export function getNode(nodeId: string) {
  const params = new URLSearchParams({ projection: "full" });
  return request<NodeSummary>(
    `/v1/nodes/${encodeURIComponent(nodeId)}?${params.toString()}`,
  );
}
