import { useEffect, useRef, useState } from "react";
import {
  Play, Pause, Volume2, VolumeX, Maximize, Minimize, PictureInPicture2, Settings, Gauge, Loader2,
} from "lucide-react";
import { useHlsPlayer } from "@/hooks/useHlsPlayer";
import { usePlayerStore } from "@/store/playerStore";
import { formatDuration } from "@/utils/format";
import { cn } from "@/lib/utils";

interface Props {
  src: string;
  poster?: string;
  startAt?: number;
  onProgress?: (s: number) => void;
}

export function VideoPlayer({ src, poster, startAt = 0, onProgress }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const { ready, levels, currentLevel, bufferAhead, setLevel } = useHlsPlayer(videoRef, src);
  const { speed, volume, muted, setSpeed, setVolume, setMuted } = usePlayerStore();
  const [playing, setPlaying] = useState(false);
  const [time, setTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showControls, setShowControls] = useState(true);
  const [menu, setMenu] = useState<null | "quality" | "speed">(null);
  const [isFs, setIsFs] = useState(false);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const progressTimer = useRef<number>(0);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    const onTime = () => {
      setTime(v.currentTime);
      if (onProgress && v.currentTime - progressTimer.current > 5) {
        progressTimer.current = v.currentTime;
        onProgress(v.currentTime);
      }
    };
    const onDur = () => setDuration(v.duration || 0);
    const onPlay = () => setPlaying(true);
    const onPause = () => setPlaying(false);
    v.addEventListener("timeupdate", onTime);
    v.addEventListener("durationchange", onDur);
    v.addEventListener("play", onPlay);
    v.addEventListener("pause", onPause);
    return () => {
      v.removeEventListener("timeupdate", onTime);
      v.removeEventListener("durationchange", onDur);
      v.removeEventListener("play", onPlay);
      v.removeEventListener("pause", onPause);
    };
  }, [onProgress]);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    v.volume = volume;
    v.muted = muted;
    v.playbackRate = speed;
  }, [volume, muted, speed, ready]);

  useEffect(() => {
    if (ready && startAt > 0 && videoRef.current) {
      videoRef.current.currentTime = startAt;
    }
  }, [ready, startAt]);

  useEffect(() => {
    const onFs = () => setIsFs(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", onFs);
    return () => document.removeEventListener("fullscreenchange", onFs);
  }, []);

  const togglePlay = () => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) v.play(); else v.pause();
  };

  const seek = (e: React.MouseEvent<HTMLDivElement>) => {
    const v = videoRef.current;
    if (!v || !duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const pct = (e.clientX - rect.left) / rect.width;
    v.currentTime = pct * duration;
  };

  const toggleFs = async () => {
    if (!containerRef.current) return;
    if (document.fullscreenElement) await document.exitFullscreen();
    else await containerRef.current.requestFullscreen();
  };

  const togglePip = async () => {
    const v = videoRef.current;
    if (!v) return;
    if (document.pictureInPictureElement) await document.exitPictureInPicture();
    else await v.requestPictureInPicture();
  };

  const onActivity = () => {
    setShowControls(true);
    if (hideTimer.current) clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => playing && setShowControls(false), 2500);
  };

  const bufferedPct = duration ? Math.min(100, ((time + bufferAhead) / duration) * 100) : 0;
  const playedPct = duration ? (time / duration) * 100 : 0;

  return (
    <div
      ref={containerRef}
      onMouseMove={onActivity}
      onMouseLeave={() => playing && setShowControls(false)}
      className="group relative aspect-video w-full overflow-hidden rounded-xl bg-black"
    >
      <video
        ref={videoRef}
        poster={poster}
        className="h-full w-full"
        playsInline
        onClick={togglePlay}
      />
      {!ready && (
        <div className="absolute inset-0 grid place-items-center bg-black/40">
          <Loader2 className="h-8 w-8 animate-spin text-white/70" />
        </div>
      )}
      {/* Center play button when paused */}
      {ready && !playing && (
        <button
          onClick={togglePlay}
          className="absolute inset-0 grid place-items-center bg-black/20 transition hover:bg-black/30"
          aria-label="Play"
        >
          <div className="rounded-full bg-primary/90 p-5 shadow-glow-primary">
            <Play className="h-7 w-7 fill-white text-white" />
          </div>
        </button>
      )}
      {/* Controls */}
      <div
        className={cn(
          "absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent p-4 transition-opacity duration-300",
          showControls || !playing ? "opacity-100" : "opacity-0",
        )}
      >
        {/* Seek bar */}
        <div className="relative mb-3 h-1.5 cursor-pointer rounded-full bg-white/10" onClick={seek}>
          <div className="absolute inset-y-0 left-0 rounded-full bg-white/20" style={{ width: `${bufferedPct}%` }} />
          <div className="absolute inset-y-0 left-0 rounded-full bg-[image:var(--gradient-primary)]" style={{ width: `${playedPct}%` }} />
          <div className="absolute top-1/2 -translate-y-1/2 h-3 w-3 -ml-1.5 rounded-full bg-white shadow-md opacity-0 group-hover:opacity-100 transition" style={{ left: `${playedPct}%` }} />
        </div>
        <div className="flex items-center gap-3 text-white">
          <button onClick={togglePlay} className="rounded p-1 hover:bg-white/10">
            {playing ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
          </button>
          <div className="flex items-center gap-2 group/vol">
            <button onClick={() => setMuted(!muted)} className="rounded p-1 hover:bg-white/10">
              {muted || volume === 0 ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
            </button>
            <input
              type="range"
              min={0} max={1} step={0.05}
              value={muted ? 0 : volume}
              onChange={(e) => setVolume(parseFloat(e.target.value))}
              className="w-0 group-hover/vol:w-20 transition-all duration-200 accent-primary"
            />
          </div>
          <div className="font-mono text-[12px] text-white/80">
            {formatDuration(time)} <span className="text-white/40">/ {formatDuration(duration)}</span>
          </div>
          <div className="ml-auto flex items-center gap-1 relative">
            {/* Speed */}
            <div className="relative">
              <button onClick={() => setMenu(menu === "speed" ? null : "speed")} className="rounded p-1 hover:bg-white/10" aria-label="Speed">
                <Gauge className="h-4 w-4" />
              </button>
              {menu === "speed" && (
                <div className="absolute bottom-full right-0 mb-2 w-28 rounded-md border border-white/10 bg-black/90 p-1 backdrop-blur">
                  {[0.5, 0.75, 1, 1.25, 1.5, 2].map((s) => (
                    <button key={s} onClick={() => { setSpeed(s); setMenu(null); }} className={cn("flex w-full items-center justify-between rounded px-2 py-1 text-xs hover:bg-white/10", speed === s && "text-primary")}>
                      <span>{s}x</span>{speed === s && <span>•</span>}
                    </button>
                  ))}
                </div>
              )}
            </div>
            {/* Quality */}
            <div className="relative">
              <button onClick={() => setMenu(menu === "quality" ? null : "quality")} className="rounded p-1 hover:bg-white/10" aria-label="Quality">
                <Settings className="h-4 w-4" />
              </button>
              {menu === "quality" && (
                <div className="absolute bottom-full right-0 mb-2 w-36 rounded-md border border-white/10 bg-black/90 p-1 backdrop-blur">
                  <button onClick={() => { setLevel(-1); setMenu(null); }} className={cn("flex w-full items-center justify-between rounded px-2 py-1 text-xs hover:bg-white/10", currentLevel === -1 && "text-primary")}>
                    Auto {currentLevel === -1 && <span>•</span>}
                  </button>
                  {levels.slice().reverse().map((l) => (
                    <button key={l.index} onClick={() => { setLevel(l.index); setMenu(null); }} className={cn("flex w-full items-center justify-between rounded px-2 py-1 text-xs hover:bg-white/10", currentLevel === l.index && "text-primary")}>
                      <span>{l.label}</span>
                      <span className="font-mono text-[10px] text-white/40">{Math.round(l.bitrate / 1000)}k</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <button onClick={togglePip} className="rounded p-1 hover:bg-white/10" aria-label="Picture in Picture">
              <PictureInPicture2 className="h-4 w-4" />
            </button>
            <button onClick={toggleFs} className="rounded p-1 hover:bg-white/10" aria-label="Fullscreen">
              {isFs ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}