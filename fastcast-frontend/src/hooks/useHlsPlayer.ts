import { useEffect, useRef, useState } from "react";

export interface HlsLevel {
  index: number;
  height: number;
  bitrate: number;
  label: string;
}

export interface HlsPlayerState {
  ready: boolean;
  levels: HlsLevel[];
  currentLevel: number; // -1 = auto
  bufferAhead: number;
}

export function useHlsPlayer(videoRef: React.RefObject<HTMLVideoElement | null>, src: string | null) {
  const hlsRef = useRef<unknown>(null);
  const [state, setState] = useState<HlsPlayerState>({
    ready: false,
    levels: [],
    currentLevel: -1,
    bufferAhead: 0,
  });

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !src) return;
    let cancelled = false;
    let bufferTimer: ReturnType<typeof setInterval> | null = null;

    const cleanup = () => {
      cancelled = true;
      if (bufferTimer) clearInterval(bufferTimer);
      const hls = hlsRef.current as { destroy?: () => void } | null;
      if (hls?.destroy) hls.destroy();
      hlsRef.current = null;
    };

    const setupBufferTimer = () => {
      bufferTimer = setInterval(() => {
        try {
          if (!video.buffered.length) return;
          const end = video.buffered.end(video.buffered.length - 1);
          setState((s) => ({ ...s, bufferAhead: Math.max(0, end - video.currentTime) }));
        } catch {
          /* ignore */
        }
      }, 500);
    };

    (async () => {
      if (video.canPlayType("application/vnd.apple.mpegurl")) {
        video.src = src;
        setState((s) => ({ ...s, ready: true }));
        setupBufferTimer();
        return;
      }
      const { default: Hls } = await import("hls.js");
      if (cancelled) return;
      if (!Hls.isSupported()) {
        video.src = src;
        return;
      }
      const hls = new Hls({ enableWorker: true, lowLatencyMode: false });
      hlsRef.current = hls;
      hls.loadSource(src);
      hls.attachMedia(video);
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        const levels: HlsLevel[] = hls.levels.map((l, i) => ({
          index: i,
          height: l.height,
          bitrate: l.bitrate,
          label: l.height ? `${l.height}p` : `${Math.round(l.bitrate / 1000)}kbps`,
        }));
        setState((s) => ({ ...s, ready: true, levels, currentLevel: hls.currentLevel }));
      });
      hls.on(Hls.Events.LEVEL_SWITCHED, (_e, data) => {
        setState((s) => ({ ...s, currentLevel: data.level }));
      });
      setupBufferTimer();
    })();

    return cleanup;
  }, [src, videoRef]);

  const setLevel = (idx: number) => {
    const hls = hlsRef.current as { currentLevel: number } | null;
    if (hls) hls.currentLevel = idx;
    setState((s) => ({ ...s, currentLevel: idx }));
  };

  return { ...state, setLevel };
}