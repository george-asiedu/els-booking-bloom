import { cn } from "@/lib/utils";

/** The Zuri "Z": four interlocking pieces, drawn on a 100×100 grid. */
export const Z_PATHS = [
  "M0 0H92L74 20H17L0 36Z",
  "M100 1V33L66 69H39Z",
  "M60 31H26L0 62V100Z",
  "M24 80H83L100 65V100H7Z",
];
export const ZURI_YELLOW = "#FDB913";
export const ZURI_NAVY = "#111827";

/** The mark on its navy tile; reads on light and dark backgrounds alike. */
export const ZuriMark = ({ className, tile = true }: { className?: string; tile?: boolean }) => (
  <svg viewBox="0 0 160 160" className={cn("h-8 w-8 shrink-0", className)} role="img" aria-label="Zuri Studios">
    {tile && <rect width="160" height="160" rx="36" fill={ZURI_NAVY} />}
    <g transform="translate(30 30)" fill={ZURI_YELLOW}>
      {Z_PATHS.map((d) => <path key={d} d={d} />)}
    </g>
  </svg>
);
