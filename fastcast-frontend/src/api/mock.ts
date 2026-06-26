import type { AuthResponse, DownloadItem, MetricsSummary, StreamingInfo, Video, WatchHistoryItem } from "@/api/types";

export function mockDelay<T>(value: T, ms = 400): Promise<T> {
  return new Promise((res) => setTimeout(() => res(value), ms));
}

export const mockVideos: Video[] = Array.from({ length: 18 }, (_, i) => ({
  id: `vid-${i + 1}`,
  title: [
    "Building a Distributed Streaming System from Scratch",
    "Redis Caching Deep Dive: HIT Ratios and Eviction Policies",
    "HLS Protocol Explained: Chunks, Playlists, and ABR",
    "Kafka for Video Processing: Producer-Consumer Patterns",
    "Spring Boot Performance Tuning: 10x Throughput in Production",
    "FFmpeg Mastery: Multi-bitrate Transcoding Pipelines",
    "AWS S3 Presigned URLs: Secure Video Delivery at Scale",
    "Load Testing with k6: Simulating 500 Concurrent Streams",
    "PostgreSQL for High-throughput Applications",
    "React Query v5: Server State Done Right",
    "JVM Tuning for Low-latency Services",
    "Adaptive Bitrate Streaming: The Full Stack",
    "Docker Compose for Local Dev: All Services in One Command",
    "Micrometer Metrics: From Counters to Histograms",
    "hls.js Deep Dive: Custom Loader and ABR Controllers",
    "WebSockets vs SSE for Real-time Dashboards",
    "CDN Integration: CloudFront in Front of S3",
    "Zero-downtime Deployments with Spring Boot",
  ][i],
  description:
    "A deep technical walkthrough covering architecture decisions, performance trade-offs, and real-world implementation details.",
  uploaderName: ["FastCast Team", "Hari", "System Architect", "Backend Lead"][i % 4],
  uploaderId: `user-${(i % 4) + 1}`,
  thumbnailUrl: `https://picsum.photos/seed/fc${i + 1}/640/360`,
  durationSeconds: 300 + i * 120,
  sizeBytes: 50_000_000 + i * 10_000_000,
  fileSizeBytes: 50_000_000 + i * 10_000_000,
  status: i < 14 ? "READY" : i === 14 ? "PROCESSING" : i === 15 ? "QUEUED" : "FAILED",
  createdAt: new Date(Date.now() - i * 86_400_000 * 2).toISOString(),
  updatedAt: new Date(Date.now() - i * 43_200_000).toISOString(),
  views: Math.floor(Math.random() * 5000) + 100,
  qualities: i < 14 ? ["720p", "480p", "240p"] : [],
  genre: ["TECHNOLOGY", "EDUCATION", "TECHNOLOGY", "SCIENCE"][i % 4],
  isPublic: true,
}));

export function mockStreamingInfo(id: string): StreamingInfo {
  const qualities = ["720p", "480p", "240p"];
  return {
    videoId: id,
    title: mockVideos.find((v) => v.id === id)?.title ?? "FastCast Stream",
    masterPlaylistUrl: `https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8`,
    durationSeconds: 600,
    qualities,
    resumeAtSeconds: 0,
    cacheHit: Math.random() > 0.4,
    availableQualities: qualities.map((q) => ({
      label: q,
      bandwidth: q === "720p" ? 2928000 : q === "480p" ? 1528000 : 464000,
      height: parseInt(q, 10),
    })),
  };
}

export function mockWatchHistory(): WatchHistoryItem[] {
  return mockVideos.slice(0, 8).map((v, i) => ({
    id: `hist-${i + 1}`,
    userId: "user-1",
    videoId: v.id,
    videoTitle: v.title,
    thumbnailUrl: v.thumbnailUrl,
    progressSeconds: Math.floor(v.durationSeconds * (0.1 + i * 0.1)),
    durationSeconds: v.durationSeconds,
    completed: i < 2,
    progressPercent: Math.min(100, Math.floor((0.1 + i * 0.1) * 100)),
    watchedAt: new Date(Date.now() - i * 3_600_000 * 6).toISOString(),
    updatedAt: new Date(Date.now() - i * 3_600_000 * 6).toISOString(),
    lastWatchedAt: new Date(Date.now() - i * 3_600_000 * 6).toISOString(),
  }));
}

export function mockDownloads(): DownloadItem[] {
  return mockVideos.slice(0, 4).map((v, i) => ({
    id: `dl-${i + 1}`,
    videoId: v.id,
    videoTitle: v.title,
    quality: ["720p", "480p", "720p", "240p"][i],
    status: i === 1 ? "PENDING" : i === 3 ? "FAILED" : "READY",
    sizeBytes: v.sizeBytes,
    downloadUrl: i !== 3 ? `https://example.com/download/vid-${i + 1}.mp4` : undefined,
    createdAt: new Date(Date.now() - i * 86_400_000).toISOString(),
  }));
}

export function mockAuth(email: string): AuthResponse {
  return {
    token: "mock-jwt-token-" + Date.now(),
    refreshToken: "mock-refresh-token-" + Date.now(),
    user: {
      id: "user-1",
      name: email.split("@")[0].replace(/[._]/g, " "),
      email,
      role: "USER",
      createdAt: new Date(Date.now() - 30 * 86_400_000).toISOString(),
      stats: {
        videosUploaded: 3,
        videosWatched: 24,
        downloads: 7,
        watchTimeSeconds: 14400,
      },
    },
  };
}

export function mockMetrics(): MetricsSummary {
  const now = Date.now();
  return {
    cacheHitCount: 1842,
    cacheMissCount: 318,
    cacheHitRatio: 85.3,
    cachedLatencyP50Ms: 12.4,
    cachedLatencyP95Ms: 28.7,
    cachedLatencyP99Ms: 45.2,
    uncachedLatencyP50Ms: 134.8,
    uncachedLatencyP95Ms: 287.3,
    uncachedLatencyP99Ms: 412.6,
    latencyImprovementPercent: 90.8,
    streamingStartupP50Ms: 186.4,
    streamingStartupP95Ms: 342.1,
    totalRequests: 2160,
    uploadLatencyP95Ms: 2840.5,
    processingLatencyP95Ms: 45200.0,
    jvmHeapUsedMb: 312.4,
    jvmHeapMaxMb: 512.0,
    cpuUsagePercent: 24.7,
    avgProcessingLatencyMs: 45200.0,
    streamingThroughputMbps: 186.4,
    activeStreams: 0,
    kafkaEventsPerSec: 0,
    systemHealth: "HEALTHY",
    latencySeries: Array.from({ length: 24 }, (_, i) => ({
      t: new Date(now - (23 - i) * 3_600_000).toISOString(),
      value: 80 + Math.random() * 80,
    })),
    throughputSeries: Array.from({ length: 24 }, (_, i) => ({
      t: new Date(now - (23 - i) * 3_600_000).toISOString(),
      value: 100 + Math.random() * 200,
    })),
    cacheSeries: Array.from({ length: 24 }, (_, i) => ({
      t: new Date(now - (23 - i) * 3_600_000).toISOString(),
      hit: 60 + Math.floor(Math.random() * 30),
      miss: 5 + Math.floor(Math.random() * 15),
    })),
    recentEvents: [
      { id: "e1", type: "VIDEO_PROCESSING_STARTED", topic: "video.processing", at: new Date(now - 120_000).toISOString() },
      { id: "e2", type: "HLS_CONVERSION_COMPLETE", topic: "video.processing", at: new Date(now - 90_000).toISOString() },
      { id: "e3", type: "S3_UPLOAD_COMPLETE", topic: "video.storage", at: new Date(now - 60_000).toISOString() },
      { id: "e4", type: "VIDEO_STATUS_READY", topic: "video.status", at: new Date(now - 30_000).toISOString() },
    ],
  };
}