import { api, USE_MOCKS } from "@/api/client";
import { endpoints } from "@/api/endpoints";

export const uploadService = {
  async upload(
    file: File,
    onProgress: (pct: number) => void,
    meta?: { title?: string; description?: string },
  ): Promise<{ id: string }> {
    if (USE_MOCKS) {
      return new Promise((resolve) => {
        let pct = 0;
        const t = setInterval(() => {
          pct = Math.min(100, pct + 5 + Math.random() * 8);
          onProgress(pct);
          if (pct >= 100) {
            clearInterval(t);
            setTimeout(() => resolve({ id: `vid_${Date.now()}` }), 300);
          }
        }, 150);
      });
    }

    const form = new FormData();
    form.append("file", file);
    form.append("title", meta?.title ?? file.name.replace(/\.[^.]+$/, ""));
    if (meta?.description) form.append("description", meta.description);

    // Do NOT set Content-Type manually — browser must set multipart boundary
    const raw = await api.post(endpoints.upload, form, {
      onUploadProgress: (e) => {
        if (e.total) onProgress((e.loaded / e.total) * 100);
      },
    });

    const d = raw.data?.data ?? raw.data;
    return { id: d.videoId ?? d.id ?? d };
  },
};