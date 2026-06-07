package com.fastcast.metrics.dto;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class MetricsSummary {

    // Cache stats
    private double cacheHitCount;
    private double cacheMissCount;
    private double cacheHitRatio;

    // Latency (ms)
    private double cachedLatencyP50Ms;
    private double cachedLatencyP95Ms;
    private double cachedLatencyP99Ms;
    private double uncachedLatencyP50Ms;
    private double uncachedLatencyP95Ms;
    private double uncachedLatencyP99Ms;
    private double latencyImprovementPercent;

    // Streaming
    private double streamingStartupP50Ms;
    private double streamingStartupP95Ms;

    // Throughput
    private double totalRequests;
    private double uploadLatencyP95Ms;
    private double processingLatencyP95Ms;

    // JVM / system
    private double jvmHeapUsedMb;
    private double jvmHeapMaxMb;
    private double cpuUsagePercent;
}
