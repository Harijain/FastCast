import { api, shouldUseMocks } from "@/api/client";
import { endpoints } from "@/api/endpoints";
import { mockDelay, mockStreamingInfo, mockVideos } from "@/api/mock";
import type { StreamingInfo, Video } from "@/api/types";

function unwrapList<T>(raw: any): T[] {
  const d = raw?.data;
  if (!d) return [];
  if (Array.isArray(d.data)) return d.data;
  if (Array.isArray(d.data?.content)) return d.data.content;
  if (Array.isArray(d)) return d;
  return [];
}

function unwrapOne<T>(raw: any): T {
  const d = raw?.data;
  if (d && "data" in d && "success" in d) return d.data as T;
  return d as T;
}

function normalizeStreamingInfo(d: any): StreamingInfo {
  const qualities: string[] = d.qualities ?? ["720p", "480p", "240p"];
  return {
    videoId: d.videoId,
    title: d.title ?? "",
    masterPlaylistUrl: d.masterPlaylistUrl,
    durationSeconds: d.durationSeconds ?? 0,
    qualities,
    resumeAtSeconds: d.resumeAtSeconds ?? 0,
    cacheHit: d.cacheHit ?? false,
    availableQualities: qualities.map((q: string) => ({
      label: q,
      bandwidth: q === "720p" ? 2928000 : q === "480p" ? 1528000 : 464000,
      height: parseInt(q, 10),
    })),
  };
}

export const videoService = {
  async list(params?: { page?: number; pageSize?: number; status?: string }): Promise<Video[]> {
    if (await shouldUseMocks()) {
      let list = mockVideos;
      if (params?.status && params.status !== "ALL")
        list = list.filter((v) => v.status === params.status);
      const page = params?.page ?? 0;
      const size = params?.pageSize ?? 12;
      return mockDelay(list.slice(page * size, page * size + size));
    }
    const raw = await api.get(endpoints.videos.list, { params });
    return unwrapList<Video>(raw);
  },

  async search(q: string, status?: string): Promise<Video[]> {
    if (await shouldUseMocks()) {
      const list = mockVideos.filter(
        (v) =>
          (!q || v.title.toLowerCase().includes(q.toLowerCase())) &&
          (!status || status === "ALL" || v.status === status),
      );
      return mockDelay(list);
    }
    const raw = await api.get(endpoints.videos.search, { params: { q, status } });
    return unwrapList<Video>(raw);
  },

  async byId(id: string): Promise<Video> {
    if (await shouldUseMocks()) {
      const v = mockVideos.find((m) => m.id === id) ?? mockVideos[0];
      return mockDelay(v);
    }
    const raw = await api.get(endpoints.videos.byId(id));
    return unwrapOne<Video>(raw);
  },

  async streamingInfo(id: string): Promise<StreamingInfo> {
    if (await shouldUseMocks()) return mockDelay(mockStreamingInfo(id));
    const raw = await api.get(endpoints.streaming.info(id));
    const d = raw.data?.data ?? raw.data;
    return normalizeStreamingInfo(d);
  },

  masterUrl(id: string): string {
  const base = import.meta.env.VITE_API_BASE_URL;

  if (!base) {
    throw new Error("VITE_API_BASE_URL is not configured");
  }

  return `${base}/stream/${id}/master.m3u8`;
},

  async reportProgress(id: string, seconds: number): Promise<void> {
    if (await shouldUseMocks()) return;
    await api.post(endpoints.streaming.progress(id), null, {
      params: {
        progressSeconds: Math.floor(seconds),
        completed: false,
      },
    });
  },
};
