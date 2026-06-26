import { create } from "zustand";

interface PlayerState {
  quality: string; // 'auto' or label
  speed: number;
  volume: number;
  muted: boolean;
  setQuality: (q: string) => void;
  setSpeed: (s: number) => void;
  setVolume: (v: number) => void;
  setMuted: (m: boolean) => void;
}

export const usePlayerStore = create<PlayerState>((set) => ({
  quality: "auto",
  speed: 1,
  volume: 1,
  muted: false,
  setQuality: (quality) => set({ quality }),
  setSpeed: (speed) => set({ speed }),
  setVolume: (volume) => set({ volume, muted: volume === 0 }),
  setMuted: (muted) => set({ muted }),
}));