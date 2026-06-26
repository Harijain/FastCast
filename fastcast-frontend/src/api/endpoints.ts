export const endpoints = {
  auth: {
    login:    "/auth/login",
    register: "/auth/register",
    me:       "/auth/me",
    refresh:  "/auth/refresh",
  },
  videos: {
    list:   "/videos",
    search: "/videos/search",
    byId:   (id: string) => `/videos/${id}`,
  },
  streaming: {
    master:   (id: string) => `/stream/${id}/master.m3u8`,
    info:     (id: string) => `/stream/${id}/info`,
    progress: (id: string) => `/stream/${id}/progress`,
  },
  upload: "/videos/upload",
  watchHistory: {
    list:     "/history",
    byVideo:  (id: string) => `/history/${id}`,
    progress: "/history/progress",
  },
  downloads: {
    history: "/download/history",
    byVideo: (id: string) => `/download/${id}`,
  },
  metrics: {
    summary: "/metrics/summary",
  },
} as const;