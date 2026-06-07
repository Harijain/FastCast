package com.fastcast.metrics.controller;

import com.fastcast.common.response.ApiResponse;
import com.fastcast.metrics.dto.MetricsSummary;
import io.micrometer.core.instrument.Counter;
import io.micrometer.core.instrument.MeterRegistry;
import io.micrometer.core.instrument.Timer;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.concurrent.TimeUnit;

@Slf4j
@RestController
@RequestMapping("/api/v1/metrics")
@RequiredArgsConstructor
@Tag(name = "Metrics API", description = "Performance dashboard and bottleneck analysis")
public class MetricsController {

    private final MeterRegistry meterRegistry;

    @GetMapping("/summary")
    @Operation(summary = "Get a human-readable performance metrics summary")
    public ResponseEntity<ApiResponse<MetricsSummary>> getSummary() {

        // ── Cache counters ──────────────────────────────────────────────
        double hits   = safeCounterCount("fastcast.cache.hits");
        double misses = safeCounterCount("fastcast.cache.misses");
        double total  = hits + misses;
        double hitRatio = total > 0 ? (hits / total) * 100.0 : 0.0;

        // ── Latency timers ──────────────────────────────────────────────
        double cachedP50  = safeTimerPercentileMs("fastcast.latency.cached", 0.5);
        double cachedP95  = safeTimerPercentileMs("fastcast.latency.cached", 0.95);
        double cachedP99  = safeTimerPercentileMs("fastcast.latency.cached", 0.99);
        double uncachedP50 = safeTimerPercentileMs("fastcast.latency.uncached", 0.5);
        double uncachedP95 = safeTimerPercentileMs("fastcast.latency.uncached", 0.95);
        double uncachedP99 = safeTimerPercentileMs("fastcast.latency.uncached", 0.99);

        double improvement = (uncachedP50 > 0 && cachedP50 > 0)
                ? ((uncachedP50 - cachedP50) / uncachedP50) * 100.0
                : 0.0;

        // ── Streaming startup ───────────────────────────────────────────
        double startupP50 = safeTimerPercentileMs("fastcast.latency.streaming.startup", 0.5);
        double startupP95 = safeTimerPercentileMs("fastcast.latency.streaming.startup", 0.95);

        // ── Upload / processing ─────────────────────────────────────────
        double uploadP95     = safeTimerPercentileMs("fastcast.latency.upload", 0.95);
        double processingP95 = safeTimerPercentileMs("fastcast.latency.processing", 0.95);

        double totalRequests = safeCounterCount("fastcast.requests.total");

        // ── JVM / CPU ───────────────────────────────────────────────────
        double heapUsed = safeGaugeValue("jvm.memory.used", "area", "heap") / (1024 * 1024);
        double heapMax  = safeGaugeValue("jvm.memory.max",  "area", "heap") / (1024 * 1024);
        double cpuUsage = safeGaugeValue("process.cpu.usage") * 100.0;

        MetricsSummary summary = MetricsSummary.builder()
                .cacheHitCount(hits)
                .cacheMissCount(misses)
                .cacheHitRatio(round2(hitRatio))
                .cachedLatencyP50Ms(round2(cachedP50))
                .cachedLatencyP95Ms(round2(cachedP95))
                .cachedLatencyP99Ms(round2(cachedP99))
                .uncachedLatencyP50Ms(round2(uncachedP50))
                .uncachedLatencyP95Ms(round2(uncachedP95))
                .uncachedLatencyP99Ms(round2(uncachedP99))
                .latencyImprovementPercent(round2(improvement))
                .streamingStartupP50Ms(round2(startupP50))
                .streamingStartupP95Ms(round2(startupP95))
                .totalRequests(totalRequests)
                .uploadLatencyP95Ms(round2(uploadP95))
                .processingLatencyP95Ms(round2(processingP95))
                .jvmHeapUsedMb(round2(heapUsed))
                .jvmHeapMaxMb(round2(heapMax))
                .cpuUsagePercent(round2(cpuUsage))
                .build();

        return ResponseEntity.ok(ApiResponse.success(summary));
    }

    // ── Helpers ──────────────────────────────────────────────────────────

    private double safeCounterCount(String name) {
        try {
            Counter counter = meterRegistry.find(name).counter();
            return counter != null ? counter.count() : 0.0;
        } catch (Exception e) {
            return 0.0;
        }
    }

    private double safeTimerPercentileMs(String name, double percentile) {
        try {
            Timer timer = meterRegistry.find(name).timer();
            if (timer == null) return 0.0;
            // Micrometer stores percentiles under separate gauges after registration
            // Use mean as a reasonable fallback if percentile gauge not available
            return timer.percentile(percentile, TimeUnit.MILLISECONDS);
        } catch (Exception e) {
            return 0.0;
        }
    }

    private double safeGaugeValue(String name, String... tags) {
        try {
            if (tags.length >= 2) {
                return meterRegistry.find(name).tag(tags[0], tags[1]).gauge() != null
                        ? meterRegistry.find(name).tag(tags[0], tags[1]).gauge().value()
                        : 0.0;
            }
            return meterRegistry.find(name).gauge() != null
                    ? meterRegistry.find(name).gauge().value()
                    : 0.0;
        } catch (Exception e) {
            return 0.0;
        }
    }

    private double round2(double value) {
        return Math.round(value * 100.0) / 100.0;
    }
}
