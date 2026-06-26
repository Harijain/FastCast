import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { History, Play } from "lucide-react";
import { watchHistoryService } from "@/services/watchHistoryService";
import { PageHeader } from "@/components/shared/PageHeader";
import { EmptyState } from "@/components/shared/EmptyState";
import { formatDuration, formatRelativeTime } from "@/utils/format";

export const Route = createFileRoute("/_authenticated/history")({
  head: () => ({ meta: [{ title: "Watch history — FastCast" }] }),
  component: HistoryPage,
});

function HistoryPage() {
  const history = useQuery({
    queryKey: ["history"],
    queryFn: () => watchHistoryService.list(),
  });

  const continueWatching = history.data?.filter((h) => !h.completed).slice(0, 6) ?? [];

  return (
    <div>
      <PageHeader
        eyebrow="History"
        title="Watch history"
        description="Pick up where you left off — progress is synced across every device."
      />

      {history.isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="aspect-video animate-shimmer rounded-xl" />
          ))}
        </div>
      ) : !history.data?.length ? (
        <EmptyState
          icon={History}
          title="No watch history yet"
          description="Start watching something and your progress will appear here."
        />
      ) : (
        <div className="space-y-10">
          {continueWatching.length > 0 && (
            <section>
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                Continue watching
              </h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {continueWatching.map((h) => {
                  const duration = h.durationSeconds ?? 1;
                  const pct = Math.min(100, (h.progressSeconds / duration) * 100);
                  return (
                    <Link
                      key={h.videoId}
                      to="/watch/$id"
                      params={{ id: h.videoId }}
                      className="glass-card-hover group block overflow-hidden rounded-xl"
                    >
                      <div className="relative aspect-video overflow-hidden bg-black/20">
                        {h.thumbnailUrl ? (
                          <img
                            src={h.thumbnailUrl}
                            alt={h.videoTitle ?? "Video"}
                            className="h-full w-full object-cover transition-transform group-hover:scale-105"
                          />
                        ) : (
                          <div className="h-full w-full bg-white/5" />
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent" />
                        <div className="absolute inset-0 grid place-items-center opacity-0 group-hover:opacity-100 transition">
                          <div className="rounded-full bg-primary/90 p-3 shadow-glow-primary">
                            <Play className="h-5 w-5 fill-white text-white" />
                          </div>
                        </div>
                        <div className="absolute inset-x-0 bottom-0">
                          <div className="h-1 bg-white/10">
                            <div className="h-full bg-primary" style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      </div>
                      <div className="p-3">
                        <div className="line-clamp-1 text-sm font-medium">
                          {h.videoTitle ?? "Untitled"}
                        </div>
                        <div className="mt-1 flex items-center justify-between text-[11px] font-mono text-muted-foreground">
                          <span>
                            {formatDuration(h.progressSeconds)} / {formatDuration(duration)}
                          </span>
                          <span>{formatRelativeTime(h.lastWatchedAt ?? h.updatedAt)}</span>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </section>
          )}

          <section>
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Recently watched
            </h2>
            <div className="glass-card rounded-xl divide-y divide-white/5">
              {history.data.map((h) => (
                <Link
                  key={h.videoId}
                  to="/watch/$id"
                  params={{ id: h.videoId }}
                  className="flex items-center gap-4 p-3 hover:bg-white/[0.02]"
                >
                  <div className="h-14 w-24 rounded-md overflow-hidden bg-white/5 flex-shrink-0">
                    {h.thumbnailUrl ? (
                      <img
                        src={h.thumbnailUrl}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="h-full w-full bg-white/10" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium">
                      {h.videoTitle ?? "Untitled"}
                    </div>
                    <div className="text-[11px] font-mono text-muted-foreground">
                      watched {formatRelativeTime(h.lastWatchedAt ?? h.updatedAt)}
                    </div>
                    {h.progressPercent !== undefined && (
                      <div className="mt-1 h-0.5 w-full rounded-full bg-white/10">
                        <div
                          className="h-full rounded-full bg-primary"
                          style={{ width: `${h.progressPercent}%` }}
                        />
                      </div>
                    )}
                  </div>
                  <span className="text-[11px] font-mono text-muted-foreground">
                    {h.progressPercent ?? 0}%
                  </span>
                </Link>
              ))}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}