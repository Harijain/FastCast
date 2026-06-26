import { api, USE_MOCKS } from "@/api/client";
import { endpoints } from "@/api/endpoints";
import { mockDelay, mockMetrics } from "@/api/mock";
import type { MetricsSummary } from "@/api/types";

export const metricsService = {
  async summary(): Promise<MetricsSummary> {
    if (USE_MOCKS) return mockDelay(mockMetrics(), 200);
    const raw = await api.get(endpoints.metrics.summary);
    const d = raw.data?.data ?? raw.data;
    return {
      cacheHitCount: d.cacheHitCount ?? 0,
      cacheMissCount: d.cacheMissCount ?? 0,
      cacheHitRatio: d.cacheHitRatio ?? 0,
      cachedLatencyP50Ms: d.cachedLatencyP50Ms ?? 0,
      cachedLatencyP95Ms: d.cachedLatencyP95Ms ?? 0,
      cachedLatencyP99Ms: d.cachedLatencyP99Ms ?? 0,
      uncachedLatencyP50Ms: d.uncachedLatencyP50Ms ?? 0,
      uncachedLatencyP95Ms: d.uncachedLatencyP95Ms ?? 0,
      uncachedLatencyP99Ms: d.uncachedLatencyP99Ms ?? 0,
      latencyImprovementPercent: d.latencyImprovementPercent ?? 0,
      streamingStartupP50Ms: d.streamingStartupP50Ms ?? 0,
      streamingStartupP95Ms: d.streamingStartupP95Ms ?? 0,
      totalRequests: d.totalRequests ?? 0,
      uploadLatencyP95Ms: d.uploadLatencyP95Ms ?? 0,
      processingLatencyP95Ms: d.processingLatencyP95Ms ?? 0,
      jvmHeapUsedMb: d.jvmHeapUsedMb ?? 0,
      jvmHeapMaxMb: d.jvmHeapMaxMb ?? 0,
      cpuUsagePercent: d.cpuUsagePercent ?? 0,
      avgProcessingLatencyMs: d.avgProcessingLatencyMs ?? d.processingLatencyP95Ms ?? 0,
      streamingThroughputMbps: d.streamingThroughputMbps ?? d.streamingStartupP50Ms ?? 0,
      activeStreams: d.activeStreams ?? 0,
      kafkaEventsPerSec: d.kafkaEventsPerSec ?? 0,
      systemHealth: d.systemHealth ?? "HEALTHY",
      latencySeries: d.latencySeries ?? [],
      throughputSeries: d.throughputSeries ?? [],
      cacheSeries: d.cacheSeries ?? [],
      recentEvents: d.recentEvents ?? [],
    };
  },
};