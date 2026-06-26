export type VideoStatus = "PROCESSING" | "READY" | "FAILED" | "QUEUED";

export interface Video {
  id: string;
  title: string;
  description?: string;
  uploaderId?: string;
  uploaderName: string;
  thumbnailUrl?: string;
  durationSeconds: number;
  sizeBytes?: number;
  fileSizeBytes?: number;
  status: VideoStatus;
  createdAt: string;
  updatedAt?: string;
  views: number;
  qualities: string[];
  genre?: string;
  isPublic?: boolean;
  originalFilename?: string;
}

export interface StreamingInfo {
  videoId: string;
  title: string;
  masterPlaylistUrl: string;
  durationSeconds: number;
  qualities: string[];
  resumeAtSeconds: number;
  cacheHit: boolean;
  // normalized for watch page quality selector
  availableQualities: { label: string; bandwidth: number; height: number }[];
}

export interface WatchHistoryItem {
  id: string;
  userId: string;
  videoId: string;
  videoTitle: string;
  thumbnailUrl?: string;
  progressSeconds: number;
  durationSeconds: number;
  completed: boolean;
  progressPercent: number;
  watchedAt: string;
  updatedAt: string;
  lastWatchedAt: string;
}

export interface DownloadItem {
  id: string;
  videoId: string;
  videoTitle: string;
  thumbnailUrl?: string;
  fileSizeBytes?: number;
  quality: string;
  downloadUrl?: string;
  downloadedAt: string;
}

export interface MetricsSummary {
  // Backend fields
  cacheHitCount: number;
  cacheMissCount: number;
  cacheHitRatio: number;
  cachedLatencyP50Ms: number;
  cachedLatencyP95Ms: number;
  cachedLatencyP99Ms: number;
  uncachedLatencyP50Ms: number;
  uncachedLatencyP95Ms: number;
  uncachedLatencyP99Ms: number;
  latencyImprovementPercent: number;
  streamingStartupP50Ms: number;
  streamingStartupP95Ms: number;
  totalRequests: number;
  uploadLatencyP95Ms: number;
  processingLatencyP95Ms: number;
  jvmHeapUsedMb: number;
  jvmHeapMaxMb: number;
  cpuUsagePercent: number;
  // Frontend-friendly aliases (also returned by backend)
  avgProcessingLatencyMs: number;
  streamingThroughputMbps: number;
  activeStreams: number;
  kafkaEventsPerSec: number;
  systemHealth: "HEALTHY" | "DEGRADED" | "DOWN";
  // Time-series (empty until backend implements them)
  latencySeries: { t: string; value: number }[];
  throughputSeries: { t: string; value: number }[];
  cacheSeries: { t: string; hit: number; miss: number }[];
  recentEvents: { id: string; type: string; topic: string; at: string }[];
}

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: "USER" | "ADMIN";
  createdAt?: string;
  stats?: {
    videosUploaded: number;
    videosWatched: number;
    downloads: number;
    watchTimeSeconds: number;
  };
}

export interface AuthResponse {
  token: string;
  refreshToken: string;
  user: AuthUser;
}

export interface ProcessingStage {
  key: "UPLOADED" | "KAFKA_QUEUED" | "TRANSCODING" | "HLS" | "S3_UPLOAD" | "THUMBNAIL" | "COMPLETED";
  label: string;
  status: "pending" | "active" | "done" | "failed";
  at?: string;
}