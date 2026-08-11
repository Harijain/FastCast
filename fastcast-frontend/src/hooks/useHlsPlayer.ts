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

    if (!video || !src) {
      return;
    }

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
          if (!video.buffered.length) {
            return;
          }

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

    const setupHls = async () => {
      try {
        /*
         * Safari / browsers with native HLS support
         */
        if (video.canPlayType("application/vnd.apple.mpegurl")) {
          video.src = src;
          video.load();

          if (cancelled) {
            return;
          }

          setState((s) => ({
            ...s,
            ready: true,
          }));

          setupBufferTimer();
          return;
        }

        /*
         * Chrome / Edge / Firefox
         * Use HLS.js because Chromium browsers don't
         * provide native HLS playback.
         */
        const { default: Hls } = await import("hls.js");

        if (cancelled) {
          return;
        }

        if (!Hls.isSupported()) {
          console.error("HLS is not supported by this browser.");

          setState((s) => ({
            ...s,
            ready: false,
          }));

          return;
        }

        const hls = new Hls({
          enableWorker: true,
          lowLatencyMode: false,
        });

        hlsRef.current = hls;

        /*
         * Load the master .m3u8 playlist.
         */
        hls.loadSource(src);

        /*
         * Attach HLS.js to the HTML video element.
         */
        hls.attachMedia(video);

        /*
         * Manifest successfully loaded.
         */
        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          if (cancelled) {
            return;
          }

          const levels: HlsLevel[] = hls.levels.map((level, index) => ({
            index,
            height: level.height,
            bitrate: level.bitrate,
            label: level.height
              ? `${level.height}p`
              : `${Math.round(level.bitrate / 1000)}kbps`,
          }));

          setState((s) => ({
            ...s,
            ready: true,
            levels,
            currentLevel: hls.currentLevel,
          }));

          console.log("HLS manifest loaded successfully.");
          console.log("Available levels:", levels);
        });

        /*
         * Quality level changed.
         */
        hls.on(Hls.Events.LEVEL_SWITCHED, (_event, data) => {
          setState((s) => ({
            ...s,
            currentLevel: data.level,
          }));
        });

        /*
         * Important: handle HLS errors.
         */
        hls.on(Hls.Events.ERROR, (_event, data) => {
          console.error("HLS error:", data);

          if (!data.fatal) {
            return;
          }

          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              console.error(
                "Fatal HLS network error. Attempting recovery..."
              );

              hls.startLoad();
              break;

            case Hls.ErrorTypes.MEDIA_ERROR:
              console.error(
                "Fatal HLS media error. Attempting recovery..."
              );

              hls.recoverMediaError();
              break;

            default:
              console.error(
                "Fatal unrecoverable HLS error. Destroying player."
              );

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

    /*
     * Reset player state when source changes.
     */
    setState({
      ready: false,
      levels: [],
      currentLevel: -1,
      bufferAhead: 0,
    });

    setupHls();

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
