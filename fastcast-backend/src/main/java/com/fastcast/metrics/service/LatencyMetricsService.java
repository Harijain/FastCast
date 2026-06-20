package com.fastcast.metrics.service;

import io.micrometer.core.instrument.*;
import lombok.Getter;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.concurrent.TimeUnit;

@Slf4j
@Service
public class LatencyMetricsService {

    private final Timer cachedResponseTimer;
    private final Timer uncachedResponseTimer;

    @Getter
    private final Timer streamingStartupTimer;

    private final Timer uploadTimer;
    private final Timer processingTimer;
    private final Counter totalRequestsCounter;

    public LatencyMetricsService(MeterRegistry registry) {

        this.cachedResponseTimer = Timer.builder("fastcast.latency.cached")
                .description("API response time with cache hit")
                .publishPercentiles(0.5, 0.95, 0.99)
                .publishPercentileHistogram(true)
                .minimumExpectedValue(Duration.ofMillis(1))
                .maximumExpectedValue(Duration.ofSeconds(10))
                .register(registry);

        this.uncachedResponseTimer = Timer.builder("fastcast.latency.uncached")
                .description("API response time without cache (DB fetch)")
                .publishPercentiles(0.5, 0.95, 0.99)
                .publishPercentileHistogram(true)
                .minimumExpectedValue(Duration.ofMillis(1))
                .maximumExpectedValue(Duration.ofSeconds(10))
                .register(registry);

        this.streamingStartupTimer = Timer.builder("fastcast.latency.streaming.startup")
                .description("Time to serve master.m3u8 - proxy for TTFF")
                .publishPercentiles(0.5, 0.95, 0.99)
                .publishPercentileHistogram(true)
                .minimumExpectedValue(Duration.ofMillis(1))
                .maximumExpectedValue(Duration.ofSeconds(5))
                .register(registry);

        this.uploadTimer = Timer.builder("fastcast.latency.upload")
                .description("Video upload latency to S3")
                .publishPercentiles(0.5, 0.95)
                .publishPercentileHistogram(true)
                .minimumExpectedValue(Duration.ofMillis(100))
                .maximumExpectedValue(Duration.ofMinutes(10))
                .register(registry);

        this.processingTimer = Timer.builder("fastcast.latency.processing")
                .description("End-to-end video processing time (FFmpeg + S3 upload)")
                .publishPercentiles(0.5, 0.95)
                .publishPercentileHistogram(true)
                .minimumExpectedValue(Duration.ofSeconds(1))
                .maximumExpectedValue(Duration.ofMinutes(30))
                .register(registry);

        this.totalRequestsCounter = Counter.builder("fastcast.requests.total")
                .description("Total API requests processed")
                .register(registry);
    }

    public void recordCachedLatency(long nanos) {
        cachedResponseTimer.record(nanos, TimeUnit.NANOSECONDS);
        totalRequestsCounter.increment();
        log.debug("Cached latency: {}ms", Duration.ofNanos(nanos).toMillis());
    }

    public void recordUncachedLatency(long nanos) {
        uncachedResponseTimer.record(nanos, TimeUnit.NANOSECONDS);
        totalRequestsCounter.increment();
        log.debug("Uncached latency: {}ms", Duration.ofNanos(nanos).toMillis());
    }

    public void recordUploadLatency(long nanos) {
        uploadTimer.record(nanos, TimeUnit.NANOSECONDS);
    }

    public void recordProcessingLatency(long nanos) {
        processingTimer.record(nanos, TimeUnit.NANOSECONDS);
    }

    public Timer.Sample startSample() {
        return Timer.start();
    }

    public void stopSampleAs(Timer.Sample sample, boolean cacheHit) {
        if (cacheHit) {
            sample.stop(cachedResponseTimer);
        } else {
            sample.stop(uncachedResponseTimer);
        }
        totalRequestsCounter.increment();
    }
}