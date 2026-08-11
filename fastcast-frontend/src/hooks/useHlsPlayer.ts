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

export function useHlsPlayer(
  videoRef: React.RefObject<HTMLVideoElement | null>,
  src: string | null
) {
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

      if (bufferTimer) {
        clearInterval(bufferTimer);
        bufferTimer = null;
      }

      const hls = hlsRef.current as { destroy?: () => void } | null;

      if (hls?.destroy) {
        hls.destroy();
      }

      hlsRef.current = null;

      video.pause();
      video.removeAttribute("src");
      video.load();
    };

    const setupBufferTimer = () => {
      bufferTimer = setInterval(() => {
        try {
          if (!video.buffered.length) return;

          const end = video.buffered.end(video.buffered.length - 1);

          setState((s) => ({
            ...s,
            bufferAhead: Math.max(0, end - video.currentTime),
          }));
        } catch {
          // Ignore buffering errors
        }
      }, 500);
    };

    const initializePlayer = async () => {
      try {
        /*
         * IMPORTANT:
         * Try HLS.js FIRST.
         *
         * This ensures Chrome/Edge use HLS.js instead of
         * incorrectly relying on native HLS detection.
         */
        const { default: Hls } = await import("hls.js");

        if (cancelled) return;

        if (Hls.isSupported()) {
          console.log("Using HLS.js");

          const hls = new Hls({
            enableWorker: true,
            lowLatencyMode: false,
          });

          hlsRef.current = hls;

          hls.loadSource(src);
          hls.attachMedia(video);

          hls.on(Hls.Events.MANIFEST_PARSED, () => {
            if (cancelled) return;

            const levels: HlsLevel[] = hls.levels.map((level, index) => ({
              index,
              height: level.height,
              bitrate: level.bitrate,
              label: level.height
                ? `${level.height}p`
                : `${Math.round(level.bitrate / 1000)}kbps`,
            }));

            console.log("HLS manifest loaded:", levels);

            setState((s) => ({
              ...s,
              ready: true,
              levels,
              currentLevel: hls.currentLevel,
            }));
          });

          hls.on(Hls.Events.LEVEL_SWITCHED, (_event, data) => {
            setState((s) => ({
              ...s,
              currentLevel: data.level,
            }));
          });

          hls.on(Hls.Events.ERROR, (_event, data) => {
            console.error("HLS error:", data);

            if (!data.fatal) return;

            switch (data.type) {
              case Hls.ErrorTypes.NETWORK_ERROR:
                console.error("HLS network error — retrying...");
                hls.startLoad();
                break;

              case Hls.ErrorTypes.MEDIA_ERROR:
                console.error("HLS media error — recovering...");
                hls.recoverMediaError();
                break;

              default:
                console.error("Fatal HLS error");
                hls.destroy();
                hlsRef.current = null;

                setState((s) => ({
                  ...s,
                  ready: false,
                }));

                break;
            }
          });

          setupBufferTimer();
          return;
        }

        /*
         * HLS.js isn't supported.
         *
         * Fall back to native HLS, which is what Safari uses.
         */
        if (video.canPlayType("application/vnd.apple.mpegurl")) {
          console.log("Using native HLS");

          video.src = src;
          video.load();

          if (cancelled) return;

          setState((s) => ({
            ...s,
            ready: true,
          }));

          setupBufferTimer();
          return;
        }

        console.error("HLS is not supported by this browser.");
      } catch (error) {
        console.error("Failed to initialize HLS player:", error);

        if (!cancelled) {
          setState((s) => ({
            ...s,
            ready: false,
          }));
        }
      }
    };

    setState({
      ready: false,
      levels: [],
      currentLevel: -1,
      bufferAhead: 0,
    });

    initializePlayer();

    return cleanup;
  }, [src, videoRef]);

  const setLevel = (idx: number) => {
    const hls = hlsRef.current as {
      currentLevel: number;
    } | null;

    if (hls) {
      hls.currentLevel = idx;
    }

    setState((s) => ({
      ...s,
      currentLevel: idx,
    }));
  };

  return {
    ...state,
    setLevel,
  };
}
