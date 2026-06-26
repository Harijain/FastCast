import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Activity, Gauge, Zap, Cpu, ShieldCheck, Database, Server } from "lucide-react";
import { metricsService } from "@/services/metricsService";
import { PageHeader } from "@/components/shared/PageHeader";
import { StatCard } from "@/components/shared/StatCard";
import { CacheDonut, LatencyAreaChart, ThroughputLineChart } from "@/features/metrics/charts";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/metrics")({
  head: () => ({ meta: [{ title: "Metrics — FastCast" }] }),
  component: MetricsPage,
});

function MetricsPage() {
  const metrics = useQuery({
    queryKey: ["metrics"],
    queryFn: metricsService.summary,
    refetchInterval: 10_000,
  });
  const m = metrics.data;

  const cacheHitRatioPct = m ? m.cacheHitRatio : 0;

  return (
    <div>
      <PageHeader
        eyebrow="Observability"
        title="Platform metrics"
        description="Live signals from the Micrometer registry — ingest, transcode, cache, and playback layers."
        actions={
          <div className="font-mono text-[11px] text-muted-foreground">refreshing every 10s</div>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={Gauge}
          label="Avg processing latency"
          value={m?.avgProcessingLatencyMs ?? 0}
          suffix="ms"
          accent="primary"
          delay={0.05}
        />
        <StatCard
          icon={Zap}
          label="Streaming startup p50"
          value={m?.streamingStartupP50Ms ?? 0}
          suffix="ms"
          accent="accent"
          delay={0.1}
        />
        <StatCard
          icon={ShieldCheck}
          label="Cache hit ratio"
          value={cacheHitRatioPct}
          decimals={1}
          suffix="%"
          accent="success"
          delay={0.15}
        />
        <StatCard
          icon={Activity}
          label="Total requests"
          value={m?.totalRequests ?? 0}
          accent="warning"
          delay={0.2}
        />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <ChartCard className="lg:col-span-2" title="Cached vs uncached latency" subtitle="p50 in ms" badge="ms">
          {m && m.latencySeries.length > 0 ? (
            <LatencyAreaChart data={m.latencySeries} />
          ) : (
            <LatencyFallback cached={m?.cachedLatencyP50Ms ?? 0} uncached={m?.uncachedLatencyP50Ms ?? 0} />
          )}
        </ChartCard>

        <ChartCard title="Cache efficiency" subtitle="Redis hit ratio" badge="%">
          {m && <CacheDonut hit={cacheHitRatioPct} />}
        </ChartCard>

        <ChartCard className="lg:col-span-2" title="Streaming throughput" subtitle="startup latency trend" badge="ms">
          {m && m.throughputSeries.length > 0 ? (
            <ThroughputLineChart data={m.throughputSeries} />
          ) : (
            <ThroughputFallback startupP50={m?.streamingStartupP50Ms ?? 0} startupP95={m?.streamingStartupP95Ms ?? 0} />
          )}
        </ChartCard>

        <ChartCard title="Latency breakdown" subtitle="p50 / p95 / p99">
          {m && <LatencyBreakdown m={m} />}
        </ChartCard>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <ChartCard title="JVM memory" subtitle="heap usage">
          {m && <JvmMemoryBar used={m.jvmHeapUsedMb} max={m.jvmHeapMaxMb} />}
        </ChartCard>
        <ChartCard title="CPU usage" subtitle="process CPU">
          {m && <CpuBar cpu={m.cpuUsagePercent} />}
        </ChartCard>
      </div>

      <div className="mt-6">
        <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          System health
        </h3>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            {
              label: "Ingest API",
              status: m?.systemHealth === "HEALTHY" ? ("healthy" as const) : ("degraded" as const),
              icon: Activity,
              value: `p50 ${m?.cachedLatencyP50Ms?.toFixed(1) ?? 0}ms`,
            },
            {
              label: "Transcoder (FFmpeg)",
              status: "healthy" as const,
              icon: Cpu,
              value: `p95 ${m?.processingLatencyP95Ms?.toFixed(1) ?? 0}ms`,
            },
            {
              label: "Redis cache",
              status: m && m.cacheHitRatio >= 0 ? ("healthy" as const) : ("degraded" as const),
              icon: Database,
              value: `${m?.cacheHitRatio?.toFixed(1) ?? 0}% hit`,
            },
            {
              label: "S3 origin",
              status: "healthy" as const,
              icon: Server,
              value: `${m?.uploadLatencyP95Ms?.toFixed(1) ?? 0}ms p95`,
            },
          ].map((s) => (
            <div key={s.label} className="glass-card flex items-center gap-3 rounded-xl p-4">
              <div
                className={cn(
                  "rounded-md p-2",
                  s.status === "healthy"
                    ? "bg-success/10 text-success"
                    : "bg-warning/10 text-warning",
                )}
              >
                <s.icon className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-medium">{s.label}</div>
                <div className="font-mono text-[11px] text-muted-foreground">{s.value}</div>
              </div>
              <span
                className={cn(
                  "h-1.5 w-1.5 rounded-full",
                  s.status === "healthy"
                    ? "bg-success animate-pulse"
                    : "bg-warning animate-pulse",
                )}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ChartCard({
  title,
  subtitle,
  badge,
  className,
  children,
}: {
  title: string;
  subtitle?: string;
  badge?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("glass-card rounded-xl p-5", className)}>
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold">{title}</h3>
          {subtitle && <p className="text-[11px] text-muted-foreground">{subtitle}</p>}
        </div>
        {badge && (
          <div className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
            {badge}
          </div>
        )}
      </div>
      {children}
    </div>
  );
}

function LatencyFallback({ cached, uncached }: { cached: number; uncached: number }) {
  return (
    <div className="space-y-4 py-2">
      <MetricRow label="Cached (Redis hit)" value={`${cached.toFixed(2)}ms`} color="bg-success" pct={cached > 0 ? Math.min(100, (cached / Math.max(cached, uncached, 1)) * 100) : 0} />
      <MetricRow label="Uncached (DB fetch)" value={`${uncached.toFixed(2)}ms`} color="bg-primary" pct={uncached > 0 ? Math.min(100, (uncached / Math.max(cached, uncached, 1)) * 100) : 0} />
      {cached > 0 && uncached > 0 && (
        <p className="text-[11px] text-muted-foreground font-mono">
          Redis is {((1 - cached / uncached) * 100).toFixed(0)}% faster
        </p>
      )}
    </div>
  );
}

function ThroughputFallback({ startupP50, startupP95 }: { startupP50: number; startupP95: number }) {
  return (
    <div className="space-y-4 py-2">
      <MetricRow label="Startup latency p50" value={`${startupP50.toFixed(2)}ms`} color="bg-accent" pct={50} />
      <MetricRow label="Startup latency p95" value={`${startupP95.toFixed(2)}ms`} color="bg-warning" pct={95} />
    </div>
  );
}

function MetricRow({ label, value, color, pct }: { label: string; value: string; color: string; pct: number }) {
  return (
    <div>
      <div className="flex justify-between text-[12px] mb-1">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-mono font-medium">{value}</span>
      </div>
      <div className="h-1.5 rounded-full bg-white/5">
        <div className={cn("h-full rounded-full", color)} style={{ width: `${Math.max(2, pct)}%` }} />
      </div>
    </div>
  );
}

function LatencyBreakdown({ m }: { m: NonNullable<ReturnType<typeof useQuery<any>>["data"]> }) {
  const rows = [
    { label: "Cached p50", value: m.cachedLatencyP50Ms },
    { label: "Cached p95", value: m.cachedLatencyP95Ms },
    { label: "Cached p99", value: m.cachedLatencyP99Ms },
    { label: "Uncached p50", value: m.uncachedLatencyP50Ms },
    { label: "Uncached p95", value: m.uncachedLatencyP95Ms },
    { label: "Uncached p99", value: m.uncachedLatencyP99Ms },
  ];
  const max = Math.max(...rows.map((r) => r.value), 1);
  return (
    <div className="space-y-3">
      {rows.map((r) => (
        <MetricRow key={r.label} label={r.label} value={`${r.value.toFixed(2)}ms`} color="bg-primary" pct={(r.value / max) * 100} />
      ))}
    </div>
  );
}

function JvmMemoryBar({ used, max }: { used: number; max: number }) {
  const pct = max > 0 ? Math.min(100, (used / max) * 100) : 0;
  return (
    <div className="space-y-3 py-2">
      <div className="flex justify-between text-sm">
        <span className="text-muted-foreground">Heap used</span>
        <span className="font-mono font-medium">{used.toFixed(0)} MB / {max.toFixed(0)} MB</span>
      </div>
      <div className="h-3 rounded-full bg-white/5">
        <div
          className={cn("h-full rounded-full", pct > 85 ? "bg-warning" : "bg-success")}
          style={{ width: `${Math.max(2, pct)}%` }}
        />
      </div>
      <p className="text-[11px] font-mono text-muted-foreground">{pct.toFixed(1)}% heap utilization</p>
    </div>
  );
}

function CpuBar({ cpu }: { cpu: number }) {
  return (
    <div className="space-y-3 py-2">
      <div className="flex justify-between text-sm">
        <span className="text-muted-foreground">CPU usage</span>
        <span className="font-mono font-medium">{cpu.toFixed(1)}%</span>
      </div>
      <div className="h-3 rounded-full bg-white/5">
        <div
          className={cn("h-full rounded-full", cpu > 85 ? "bg-warning" : cpu > 60 ? "bg-accent" : "bg-success")}
          style={{ width: `${Math.max(2, cpu)}%` }}
        />
      </div>
      <p className="text-[11px] font-mono text-muted-foreground">
        {cpu < 30 ? "Healthy — low load" : cpu < 70 ? "Moderate load" : "High load — monitor"}
      </p>
    </div>
  );
}