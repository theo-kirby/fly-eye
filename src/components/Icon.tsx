import type { SVGProps } from "react";

export type IconName =
  | "brand"
  | "list"
  | "atlas"
  | "tree"
  | "graph"
  | "dag"
  | "replay"
  | "calendar"
  | "waterfall"
  | "owners"
  | "embed"
  | "reading"
  | "arrow-left"
  | "sun"
  | "moon"
  | "key"
  | "external"
  | "play"
  | "pause"
  | "expand"
  | "warn"
  | "empty"
  | "spinner"
  | "info";

interface IconProps extends Omit<SVGProps<SVGSVGElement>, "name"> {
  name: IconName;
  size?: number;
}

// All paths assume a 24×24 box, currentColor stroke, 1.6 stroke width.
// Keeping everything inline + tiny avoids an icon-lib dependency.
const PATHS: Record<IconName, JSX.Element> = {
  brand: (
    <>
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="5" />
      <circle cx="12" cy="12" r="1.6" fill="currentColor" stroke="none" />
    </>
  ),
  list: (
    <>
      <path d="M4 6h16" />
      <path d="M4 12h16" />
      <path d="M4 18h10" />
    </>
  ),
  atlas: (
    <>
      <rect x="3.5" y="3.5" width="7" height="7" rx="1.5" />
      <rect x="13.5" y="3.5" width="7" height="7" rx="1.5" />
      <rect x="3.5" y="13.5" width="7" height="7" rx="1.5" />
      <rect x="13.5" y="13.5" width="7" height="7" rx="1.5" />
    </>
  ),
  tree: (
    <>
      <path d="M5 5v14" />
      <path d="M5 9h6" />
      <path d="M5 14h6" />
      <path d="M5 19h6" />
      <circle cx="13" cy="9" r="1.6" fill="currentColor" stroke="none" />
      <circle cx="13" cy="14" r="1.6" fill="currentColor" stroke="none" />
      <circle cx="13" cy="19" r="1.6" fill="currentColor" stroke="none" />
      <circle cx="5" cy="5" r="1.6" fill="currentColor" stroke="none" />
    </>
  ),
  graph: (
    <>
      <circle cx="12" cy="12" r="2.4" fill="currentColor" stroke="none" />
      <circle cx="5" cy="6" r="1.6" />
      <circle cx="19" cy="7" r="1.6" />
      <circle cx="5" cy="18" r="1.6" />
      <circle cx="19" cy="17" r="1.6" />
      <path d="M10 11l-4-4" />
      <path d="M14 11l4-4" />
      <path d="M10 13l-4 4" />
      <path d="M14 13l4 4" />
    </>
  ),
  dag: (
    <>
      <rect x="3" y="4.5" width="6" height="4" rx="1" />
      <rect x="3" y="15.5" width="6" height="4" rx="1" />
      <rect x="15" y="10" width="6" height="4" rx="1" />
      <path d="M9 6.5h3.5l2.5 5" />
      <path d="M9 17.5h3.5l2.5-5" />
    </>
  ),
  replay: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M10 9l5 3-5 3z" fill="currentColor" stroke="none" />
    </>
  ),
  calendar: (
    <>
      <rect x="3.5" y="5" width="17" height="15" rx="2" />
      <path d="M3.5 9.5h17" />
      <path d="M8 3v4" />
      <path d="M16 3v4" />
    </>
  ),
  waterfall: (
    <>
      <path d="M3 5h7" />
      <path d="M6 10h9" />
      <path d="M9 15h8" />
      <path d="M12 20h6" />
    </>
  ),
  owners: (
    <>
      <circle cx="9" cy="9" r="3" />
      <path d="M3.5 19c.7-3 3-4.5 5.5-4.5S14 16 14.5 19" />
      <circle cx="17" cy="10" r="2.4" />
      <path d="M14.5 18c.4-2 1.8-3 3-3 1.6 0 2.7 1.2 3 3" />
    </>
  ),
  embed: (
    <>
      <circle cx="6" cy="8" r="1.4" fill="currentColor" stroke="none" />
      <circle cx="11" cy="5" r="1.4" fill="currentColor" stroke="none" />
      <circle cx="17" cy="9" r="1.4" fill="currentColor" stroke="none" />
      <circle cx="8" cy="15" r="1.4" fill="currentColor" stroke="none" />
      <circle cx="14" cy="13" r="1.4" fill="currentColor" stroke="none" />
      <circle cx="18" cy="18" r="1.4" fill="currentColor" stroke="none" />
      <circle cx="5" cy="19" r="1.4" fill="currentColor" stroke="none" />
    </>
  ),
  reading: (
    <>
      <path d="M3 5.5h7c1.7 0 3 1.1 3 2.5v12c0-1.4-1.3-2.5-3-2.5H3z" />
      <path d="M21 5.5h-7c-1.7 0-3 1.1-3 2.5v12c0-1.4 1.3-2.5 3-2.5h7z" />
    </>
  ),
  "arrow-left": (
    <>
      <path d="M14 6l-6 6 6 6" />
      <path d="M8 12h12" />
    </>
  ),
  sun: (
    <>
      <circle cx="12" cy="12" r="3.8" />
      <path d="M12 3v2" />
      <path d="M12 19v2" />
      <path d="M3 12h2" />
      <path d="M19 12h2" />
      <path d="M5.5 5.5l1.5 1.5" />
      <path d="M17 17l1.5 1.5" />
      <path d="M5.5 18.5L7 17" />
      <path d="M17 7l1.5-1.5" />
    </>
  ),
  moon: (
    <>
      <path d="M20 14.5A8 8 0 119.5 4a6.5 6.5 0 0010.5 10.5z" />
    </>
  ),
  key: (
    <>
      <circle cx="8" cy="14" r="3.5" />
      <path d="M11 12l9-9" />
      <path d="M16 5l3 3" />
    </>
  ),
  external: (
    <>
      <path d="M13 5h6v6" />
      <path d="M19 5l-9 9" />
      <path d="M19 14v4a2 2 0 01-2 2H6a2 2 0 01-2-2V7a2 2 0 012-2h4" />
    </>
  ),
  play: (
    <>
      <path d="M7 5l11 7-11 7z" fill="currentColor" stroke="none" />
    </>
  ),
  pause: (
    <>
      <rect x="7" y="5" width="3.5" height="14" rx="0.8" fill="currentColor" stroke="none" />
      <rect x="13.5" y="5" width="3.5" height="14" rx="0.8" fill="currentColor" stroke="none" />
    </>
  ),
  expand: (
    <>
      <path d="M4 9V4h5" />
      <path d="M20 9V4h-5" />
      <path d="M4 15v5h5" />
      <path d="M20 15v5h-5" />
    </>
  ),
  warn: (
    <>
      <path d="M12 3l10 17H2z" />
      <path d="M12 10v4" />
      <circle cx="12" cy="17" r="0.6" fill="currentColor" stroke="none" />
    </>
  ),
  empty: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M8 13.5c1 1 2.5 1.5 4 1.5s3-.5 4-1.5" />
      <circle cx="9" cy="10" r="0.7" fill="currentColor" stroke="none" />
      <circle cx="15" cy="10" r="0.7" fill="currentColor" stroke="none" />
    </>
  ),
  spinner: (
    <>
      <path d="M12 3a9 9 0 019 9" />
      <path d="M12 21a9 9 0 01-9-9" opacity="0.25" />
    </>
  ),
  info: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 11v5.5" />
      <circle cx="12" cy="8" r="0.8" fill="currentColor" stroke="none" />
    </>
  ),
};

export function Icon({ name, size = 16, ...rest }: IconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...rest}
    >
      {PATHS[name]}
    </svg>
  );
}
