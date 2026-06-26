import { api, USE_MOCKS } from "@/api/client";
import { endpoints } from "@/api/endpoints";
import { mockDelay, mockDownloads } from "@/api/mock";
import type { DownloadItem } from "@/api/types";

export interface DownloadUrlResponse {
  videoId: string;
  title: string;
  quality: string;
  downloadUrl: string;
  expiresInMinutes: number;
}

export const downloadsService = {
  async list(): Promise<DownloadItem[]> {
    if (USE_MOCKS) return mockDelay(mockDownloads());
    const raw = await api.get(endpoints.downloads.history);
    const data = raw.data?.data ?? raw.data;
    return Array.isArray(data) ? data : [];
  },

  async byVideo(id: string): Promise<DownloadItem | null> {
    if (USE_MOCKS) return mockDelay(mockDownloads().find((d) => d.videoId === id) ?? null);
    try {
      const raw = await api.get(endpoints.downloads.byVideo(id));
      return raw.data?.data ?? raw.data ?? null;
    } catch {
      return null;
    }
  },

  async requestDownload(videoId: string, quality: string): Promise<DownloadUrlResponse> {
    if (USE_MOCKS) {
      return mockDelay({
        videoId,
        title: "Mock Video",
        quality,
        downloadUrl: "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8",
        expiresInMinutes: 60,
      }, 800);
    }
    const raw = await api.get(endpoints.downloads.byVideo(videoId), {
      params: { quality },
    });
    return raw.data?.data ?? raw.data;
  },
};