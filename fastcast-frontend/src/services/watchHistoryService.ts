import { api, shouldUseMocks } from "@/api/client";
import { endpoints } from "@/api/endpoints";
import { mockDelay, mockWatchHistory } from "@/api/mock";
import type { WatchHistoryItem } from "@/api/types";

export const watchHistoryService = {
  async list(): Promise<WatchHistoryItem[]> {
    if (await shouldUseMocks()) return mockDelay(mockWatchHistory());
    const raw = await api.get(endpoints.watchHistory.list);
    const data = raw.data?.data ?? raw.data;
    return Array.isArray(data) ? data : [];
  },

  async forVideo(id: string): Promise<WatchHistoryItem | null> {
    if (await shouldUseMocks()) return mockDelay(mockWatchHistory().find((w) => w.videoId === id) ?? null);
    try {
      const raw = await api.get(endpoints.watchHistory.byVideo(id));
      return raw.data?.data ?? raw.data ?? null;
    } catch {
      return null;
    }
  },

  async saveProgress(videoId: string, seconds: number): Promise<void> {
    if (await shouldUseMocks()) return;
    await api.post(endpoints.watchHistory.progress, {
      videoId,
      progressSeconds: Math.floor(seconds),
      completed: false,
    });
  },
};