import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { motion } from "motion/react";
import { Activity, Database, Gauge, Zap, ArrowRight, Cpu } from "lucide-react";
import { videoService } from "@/services/videoService";
import { metricsService } from "@/services/metricsService";
import { StatCard } from "@/components/shared/StatCard";
import { VideoCard } from "@/components/shared/VideoCard";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Button } from "@/components/ui/button";
import { formatRelativeTime } from "@/utils/format";

export const Route = createFileRoute("/_authenticated/")({
  head: () => ({ meta: [{ title: "FastCast — Home" }] }),
  component: HomePage,
});

function HomePage() {
  const videos = useQuery({ queryKey: ["videos", "home"], queryFn: () => videoService.list({ pageSize: 8 }) });
  const recent = useQuery({ queryKey: ["videos", "recent"], queryFn: () => videoService.list({ pageSize: 6, page: 1 }) });
  const metrics = useQuery({ queryKey: ["metrics"], queryFn: metricsService.summary });
  const m = metrics.data;

  return (
    <div className="space-y-12">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-2xl border border-border bg-mesh px-6 py-12 sm:px-10 sm:py-16">
        <div className="absolute inset-0 grid-bg opacity-40" />
        <motion.div
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}
          className="relative max-w-3xl"
        >
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-0.5 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
            <span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse" /> production · v1.0
          </div>
          <h1 className="text-3xl sm:text-5xl font-semibold leading-[1.05] tracking-tight">
            Streaming Infrastructure <br />
            <span className="text-gradient">Built For Scale</span>
          </h1>
          <p className="mt-4 max-w-xl text-sm sm:text-base text-muted-foreground">
            FastCast delivers adaptive HLS streaming powered by Kafka pipelines, Redis caching, and cloud-native processing.
          </p>
          <div className="mt-6 flex flex-wrap gap-2">
            <Button asChild variant="hero" size="lg"><Link to="/upload">Upload a video <ArrowRight className="h-4 w-4" /></Link></Button>
            <Button asChild variant="glass" size="lg"><Link to="/metrics">View live metrics</Link></Button>
          </div>
        </motion.div>
      </section>

      {/* Stats */}
      <section>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard icon={Database} label="Videos processed" value={m?.activeStreams ? 24_812 : 24_812} suffix="" accent="primary" delay={0.05} />
          <StatCard icon={Gauge} label="Avg latency" value={m?.avgProcessingLatencyMs ?? 142} suffix="ms" accent="accent" delay={0.1} />
          <StatCard icon={Zap} label="Cache hit ratio" value={(m?.cacheHitRatio ?? 0.931) * 100} decimals={1} suffix="%" accent="success" delay={0.15} />
          <StatCard icon={Activity} label="Streaming sessions" value={m?.activeStreams ?? 1284} accent="warning" delay={0.2} />
        </div>
      </section>

      {/* Featured */}
      <section>
        <SectionHeader title="Featured" subtitle="Hand-picked engineering deep dives" to="/search" />
        <div className="-mx-2 overflow-x-auto pb-2">
          <div className="flex gap-4 px-2 min-w-min">
            {videos.isLoading
              ? Array.from({ length: 4 }).map((_, i) => <CardSkeleton key={i} />)
              : videos.data?.slice(0, 6).map((v, i) => (
                  <div key={v.id} className="w-72 flex-shrink-0">
                    <VideoCard video={v} index={i} />
                  </div>
                ))}
          </div>
        </div>
      </section>

      {/* Recent uploads */}
      <section>
        <SectionHeader title="Recent uploads" subtitle="Latest videos through the pipeline" to="/search" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {recent.isLoading
            ? Array.from({ length: 4 }).map((_, i) => <CardSkeleton key={i} />)
            : recent.data?.map((v, i) => <VideoCard key={v.id} video={v} index={i} />)}
        </div>
      </section>

      {/* Processing queue */}
      <section>
        <SectionHeader title="Processing queue" subtitle="Currently in the Kafka pipeline" />
        <div className="glass-card rounded-xl divide-y divide-white/5">
          {videos.data?.filter((v) => v.status !== "READY").slice(0, 5).map((v) => (
            <div key={v.id} className="flex items-center gap-4 p-4">
              <div className="rounded-md bg-white/[0.04] p-2 text-muted-foreground"><Cpu className="h-4 w-4" /></div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-medium">{v.title}</div>
                <div className="text-[11px] font-mono text-muted-foreground">{v.uploaderName} · {formatRelativeTime(v.createdAt)}</div>
              </div>
              <StatusBadge status={v.status} />
            </div>
          ))}
          {(!videos.data?.some((v) => v.status !== "READY")) && (
            <div className="p-6 text-center text-sm text-muted-foreground">Queue is empty. All videos are ready to stream.</div>
          )}
        </div>
      </section>
    </div>
  );
}

function SectionHeader({ title, subtitle, to }: { title: string; subtitle?: string; to?: string }) {
  return (
    <div className="mb-4 flex items-end justify-between">
      <div>
        <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
        {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
      </div>
      {to && (
        <Link to={to} className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1">
          View all <ArrowRight className="h-3 w-3" />
        </Link>
      )}
    </div>
  );
}

function CardSkeleton() {
  return (
    <div className="glass-card rounded-xl overflow-hidden">
      <div className="aspect-video animate-shimmer" />
      <div className="p-4 space-y-2">
        <div className="h-3 w-3/4 animate-shimmer rounded" />
        <div className="h-2 w-1/2 animate-shimmer rounded" />
      </div>
    </div>
  );
}