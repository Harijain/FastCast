import { cn } from "@/lib/utils";
import type { VideoStatus } from "@/api/types";

const map: Record<VideoStatus, { dot: string; bg: string; text: string; label: string }> = {
  READY: { dot: "bg-success", bg: "bg-success/10 border-success/20", text: "text-success", label: "Ready" },
  PROCESSING: { dot: "bg-warning animate-pulse", bg: "bg-warning/10 border-warning/20", text: "text-warning", label: "Processing" },
  QUEUED: { dot: "bg-accent animate-pulse", bg: "bg-accent/10 border-accent/20", text: "text-accent", label: "Queued" },
  FAILED: { dot: "bg-danger", bg: "bg-danger/10 border-danger/20", text: "text-danger", label: "Failed" },
};

export function StatusBadge({ status, className }: { status: VideoStatus; className?: string }) {
  const s = map[status] ?? map.READY;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px] font-medium",
        s.bg,
        s.text,
        className,
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", s.dot)} />
      {s.label}
    </span>
  );
}