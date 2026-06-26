import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Download as DownloadIcon, FileVideo } from "lucide-react";

import { downloadsService } from "@/services/downloadsService";
import { PageHeader } from "@/components/shared/PageHeader";
import { EmptyState } from "@/components/shared/EmptyState";
import { Button } from "@/components/ui/button";
import { formatBytes, formatRelativeTime } from "@/utils/format";

export const Route = createFileRoute("/_authenticated/downloads")({
  head: () => ({
    meta: [{ title: "Downloads — FastCast" }],
  }),
  component: DownloadsPage,
});

function DownloadsPage() {
  const downloads = useQuery({
    queryKey: ["downloads"],
    queryFn: () => downloadsService.list(),
  });

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Library"
        title="Downloads"
        description="Videos you've downloaded for offline viewing."
      />

      {downloads.isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-20 animate-shimmer rounded-xl" />
          ))}
        </div>
      ) : !downloads.data?.length ? (
        <EmptyState
          icon={DownloadIcon}
          title="No downloads yet"
          description="Download a video from the watch page to see it here."
        />
      ) : (
        <div className="glass-card overflow-hidden rounded-xl">

          {/* Header */}

          <div className="grid grid-cols-[1fr_120px_120px_180px] gap-4 border-b border-white/5 px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">

            <div>Video</div>

            <div>Quality</div>

            <div>File Size</div>

            <div>Downloaded</div>

          </div>

          {/* Body */}

          <div className="divide-y divide-white/5">

            {downloads.data.map((d) => (
              <div
                key={d.id}
                className="grid grid-cols-[1fr_120px_120px_180px] items-center gap-4 px-5 py-4 transition hover:bg-white/[0.03]"
              >
                {/* Video */}

                <div className="flex items-center gap-4">

                  {d.thumbnailUrl ? (
                    <img
                      src={d.thumbnailUrl}
                      alt={d.videoTitle}
                      className="h-16 w-28 rounded-lg object-cover bg-white/5"
                    />
                  ) : (
                    <div className="flex h-16 w-28 items-center justify-center rounded-lg bg-white/5">
                      <FileVideo className="h-8 w-8 text-muted-foreground" />
                    </div>
                  )}

                  <div className="min-w-0">

                    <div className="truncate text-sm font-semibold">
                      {d.videoTitle}
                    </div>

                    <div className="mt-1 text-xs text-muted-foreground">
                      Video ID: {d.videoId.slice(0, 8)}...
                    </div>

                  </div>
                </div>

                {/* Quality */}

                <div>
                  <span className="rounded-md bg-primary/10 px-2 py-1 text-xs font-semibold text-primary">
                    {d.quality}
                  </span>
                </div>

                {/* File Size */}

                <div className="text-sm text-muted-foreground">
                  {d.fileSizeBytes
                    ? formatBytes(d.fileSizeBytes)
                    : "Unknown"}
                </div>

                {/* Download Time */}

                <div className="text-sm text-muted-foreground">
                  {formatRelativeTime(d.downloadedAt)}
                </div>
              </div>
            ))}

          </div>

          {/* Footer */}

          <div className="border-t border-white/5 px-5 py-3 text-xs text-muted-foreground">
            Total Downloads: <span className="font-semibold text-foreground">{downloads.data.length}</span>
          </div>

        </div>
      )}
    </div>
  );
}