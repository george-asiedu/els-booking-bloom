// Display metadata for feature-request statuses, shared by the studio and
// platform pages. Lives outside both page modules so neither page chunk has to
// import the other, and so the pages only export components (fast refresh).
import type { FeatureRequestStatus } from "@/lib/api";

export const STATUS_META: Record<
  FeatureRequestStatus,
  { label: string; className: string }
> = {
  NEW: {
    label: "New",
    className: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  },
  PLANNED: {
    label: "Planned",
    className:
      "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
  },
  IN_PROGRESS: {
    label: "In progress",
    className:
      "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200",
  },
  DONE: {
    label: "Done",
    className:
      "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  },
  DECLINED: {
    label: "Declined",
    className: "bg-muted text-muted-foreground",
  },
};
