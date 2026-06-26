import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Activity, Eye, Server, Wifi, ThumbsUp, Share2, Download, Check, Loader2 } from "lucide-react";
import { videoService } from "@/services/videoService";
import { watchHistoryService } from "@/services/watchHistoryService";
import { downloadsService } from "@/services/downloadsService";
import { VideoPlayer } from "@/features/player/VideoPlayer";
import { VideoCard } from "@/components/shared/VideoCard";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { formatDuration, formatNumber, formatRelativeTime } from "@/utils/format";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/watch/$id")({
  head: () => ({ meta: [{ title: "Now playing — FastCast" }] }),
  component: WatchPage,
});

const QUALITIES = ["720p", "480p", "240p", "original"] as const;
type Quality = (typeof QUALITIES)[number];

function WatchPage() {
  const { id } = Route.useParams();

  const video = useQuery({
    queryKey: ["video", id],
    queryFn: () => videoService.byId(id),
  });

  const info = useQuery({
    queryKey: ["stream", id],
    queryFn: () => videoService.streamingInfo(id),
    enabled: video.data?.status === "READY",
  });

  const progress = useQuery({
    queryKey: ["progress", id],
    queryFn: () => watchHistoryService.forVideo(id),
  });

  const suggested = useQuery({
    queryKey: ["suggested"],
    queryFn: () => videoService.list({ pageSize: 6 }),
  });

  const [liked, setLiked] = useState(false);
  const [copied, setCopied] = useState(false);
  const [downloadOpen, setDownloadOpen] = useState(false);
  const [downloadingQuality, setDownloadingQuality] = useState<Quality | null>(null);
  const [downloadDone, setDownloadDone] = useState<Quality | null>(null);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [id]);

  // Close dropdown on outside click
  useEffect(() => {
    if (!downloadOpen) return;
    const handler = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest("[data-download-root]")) setDownloadOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [downloadOpen]);

  const onProgress = (s: number) => {
    watchHistoryService.saveProgress(id, s).catch(() => {});
    videoService.reportProgress(id, s).catch(() => {});
  };

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback: select the URL
    }
  };

  const handleDownload = async (quality: Quality) => {
    if (downloadingQuality) return;
    setDownloadingQuality(quality);
    setDownloadOpen(false);
    try {
      const res = await downloadsService.requestDownload(id, quality);
      // Trigger browser download
      const a = document.createElement("a");
      a.href = res.downloadUrl;
      a.download = `${res.title ?? "video"}-${quality}.${quality === "original" ? "mp4" : "m3u8"}`;
      a.target = "_blank";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setDownloadDone(quality);
      setTimeout(() => setDownloadDone(null), 3000);
    } catch (err) {
      console.error("Download failed", err);
    } finally {
      setDownloadingQuality(null);
    }
  };

  const src = info.data?.masterPlaylistUrl
  ? (
      info.data.masterPlaylistUrl.startsWith("http")
        ? info.data.masterPlaylistUrl
        : `http://localhost:8080${info.data.masterPlaylistUrl}`
    )
  : videoService.masterUrl(id);

  const resumeAt = progress.data?.progressSeconds ?? 0;
  const isReady = video.data?.status === "READY";

  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-3">
        {/* ── Player + info ── */}
        <div className="lg:col-span-2 space-y-4">
          {isReady ? (
            <VideoPlayer
              src={src}
              poster={video.data?.thumbnailUrl}
              startAt={resumeAt}
              onProgress={onProgress}
            />
          ) : (
            <div className="aspect-video w-full rounded-xl bg-black/40 flex items-center justify-center">
              <div className="text-center space-y-2">
                <div className="text-sm text-muted-foreground">
                  {video.isLoading
                    ? "Loading video..."
                    : video.data
                    ? `Video is ${video.data.status.toLowerCase()} — check back soon`
                    : "Video not found"}
                </div>
                {video.data?.status && video.data.status !== "READY" && (
                  <StatusBadge status={video.data.status} />
                )}
              </div>
            </div>
          )}

          {/* ── Video metadata ── */}
          <div className="space-y-3">
            {/* Status + cache badge */}
            <div className="flex flex-wrap items-center gap-2">
              {video.data && <StatusBadge status={video.data.status} />}
              <span className="text-[11px] font-mono text-muted-foreground">
                {info.data?.cacheHit ? "Edge cache HIT" : "Origin fetch"}
              </span>
            </div>

            {/* Title */}
            <h1 className="text-2xl font-semibold tracking-tight">
              {video.isLoading ? (
                <span className="inline-block h-6 w-2/3 animate-shimmer rounded" />
              ) : (
                video.data?.title
              )}
            </h1>

            {/* Views · uploader · date */}
            <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <Eye className="h-3.5 w-3.5" />
                {video.data ? formatNumber(video.data.views ?? 0) : "—"} views
              </span>
              <span>·</span>
              <span>{video.data ? (video.data.uploaderName ?? "FastCast") : "—"}</span>
              <span>·</span>
              <span>{video.data ? formatRelativeTime(video.data.createdAt) : "—"}</span>
            </div>

            {/* ── Action bar: Like · Share · Download ── */}
            <div className="flex flex-wrap items-center gap-2 border-y border-white/[0.06] py-3">
              {/* Like */}
              <button
                onClick={() => setLiked((v) => !v)}
                className={cn(
                  "flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition-colors",
                  liked
                    ? "border-primary/40 bg-primary/10 text-primary"
                    : "border-white/10 bg-white/[0.03] text-muted-foreground hover:border-white/20 hover:bg-white/[0.06] hover:text-foreground",
                )}
              >
                <ThumbsUp className={cn("h-4 w-4", liked && "fill-primary")} />
                Like
              </button>

              {/* Share */}
              <button
                onClick={handleShare}
                className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.03] px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:border-white/20 hover:bg-white/[0.06] hover:text-foreground"
              >
                {copied ? (
                  <Check className="h-4 w-4 text-success" />
                ) : (
                  <Share2 className="h-4 w-4" />
                )}
                {copied ? "Copied!" : "Share"}
              </button>

              {/* Download — only shown when video is READY */}
              {isReady && (
                <div className="relative" data-download-root>
                  <button
                    onClick={() => setDownloadOpen((v) => !v)}
                    disabled={!!downloadingQuality}
                    className={cn(
                      "flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition-colors",
                      downloadDone
                        ? "border-success/40 bg-success/10 text-success"
                        : "border-white/10 bg-white/[0.03] text-muted-foreground hover:border-white/20 hover:bg-white/[0.06] hover:text-foreground",
                      downloadingQuality && "cursor-not-allowed opacity-60",
                    )}
                  >
                    {downloadingQuality ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : downloadDone ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <Download className="h-4 w-4" />
                    )}
                    {downloadingQuality
                      ? `Preparing ${downloadingQuality}…`
                      : downloadDone
                      ? `${downloadDone} ready`
                      : "Download"}
                  </button>

                  {/* Quality picker dropdown */}
                  {downloadOpen && (
                    <div className="absolute left-0 top-full z-50 mt-2 w-48 rounded-xl border border-white/10 bg-black/90 p-1.5 shadow-xl backdrop-blur-md">
                      <p className="px-2 pb-1.5 pt-1 text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
                        Select quality
                      </p>
                      {QUALITIES.map((q) => (
                        <button
                          key={q}
                          onClick={() => handleDownload(q)}
                          className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm text-left hover:bg-white/10 transition-colors"
                        >
                          <span className="font-medium">
                            {q === "original" ? "Original file" : q}
                          </span>
                          <span className="font-mono text-[10px] text-muted-foreground">
                            {q === "720p"
                              ? "HD"
                              : q === "480p"
                              ? "SD"
                              : q === "240p"
                              ? "Low"
                              : "MP4"}
                          </span>
                        </button>
                      ))}
                      <p className="px-2 pb-1 pt-1.5 text-[10px] text-muted-foreground">
                        Link expires in {60} min
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Description */}
            {video.data?.description && (
              <p className="max-w-2xl text-sm text-muted-foreground leading-relaxed">
                {video.data.description}
              </p>
            )}
          </div>
        </div>

        {/* ── Sidebar ── */}
        <aside className="space-y-4">
          <div className="glass-card rounded-xl p-5">
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Streaming session
            </h3>
            <ul className="space-y-3 text-sm">
              <Row
                icon={Server}
                label="Origin"
                value={info.data?.cacheHit ? "Redis (edge)" : "S3 (ap-south-1)"}
              />
              <Row icon={Wifi} label="Manifest" value="HLS · master.m3u8" mono />
              <Row
                icon={Activity}
                label="Duration"
                value={info.data ? formatDuration(info.data.durationSeconds) : "—"}
                mono
              />
              <Row
                icon={Eye}
                label="Resume at"
                value={resumeAt > 0 ? formatDuration(resumeAt) : "Start"}
                mono
              />
            </ul>
            <div className="mt-4">
              <div className="mb-1.5 flex items-center justify-between text-[11px] text-muted-foreground">
                <span>Buffer health</span>
                <span className="font-mono">healthy</span>
              </div>
              <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
                <div className="h-full w-4/5 bg-[image:var(--gradient-primary)] animate-pulse" />
              </div>
            </div>
          </div>

          <div className="glass-card rounded-xl p-5">
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Available qualities
            </h3>
            <div className="flex flex-wrap gap-1.5">
              {(info.data?.availableQualities ?? []).map((q) => (
                <span
                  key={q.label}
                  className="rounded-md border border-white/10 bg-white/[0.03] px-2 py-1 font-mono text-[11px]"
                >
                  {q.label}
                </span>
              ))}
              {!info.data?.availableQualities?.length &&
                video.data?.qualities?.map((q) => (
                  <span
                    key={q}
                    className="rounded-md border border-white/10 bg-white/[0.03] px-2 py-1 font-mono text-[11px]"
                  >
                    {q}
                  </span>
                ))}
            </div>
          </div>
        </aside>
      </div>

      {/* ── Up next ── */}
      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Up next
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {suggested.data
            ?.filter((v) => v.id !== id)
            .slice(0, 4)
            .map((v, i) => (
              <VideoCard key={v.id} video={v} index={i} />
            ))}
        </div>
      </section>
    </div>
  );
}

function Row({
  icon: Icon,
  label,
  value,
  mono,
}: {
  icon: typeof Activity;
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <li className="flex items-center justify-between">
      <span className="flex items-center gap-2 text-muted-foreground">
        <Icon className="h-3.5 w-3.5" />
        {label}
      </span>
      <span className={mono ? "font-mono text-xs" : "text-xs"}>{value}</span>
    </li>
  );
}