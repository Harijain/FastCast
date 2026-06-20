import { create } from "zustand";

const usePlayerStore = create((set) => ({

    currentVideo: null,

    playing: false,

    currentTime: 0,

    duration: 0,

    quality: "720p",

    volume: 1,

    fullscreen: false,

    setVideo: (video) =>

        set({

            currentVideo: video

        }),

    setPlaying: (playing) =>

        set({

            playing

        }),

    setCurrentTime: (time) =>

        set({

            currentTime: time

        }),

    setDuration: (duration) =>

        set({

            duration

        }),

    setQuality: (quality) =>

        set({

            quality

        }),

    setVolume: (volume) =>

        set({

            volume

        }),

    setFullscreen: (fullscreen) =>

        set({

            fullscreen

        })

}));

export default usePlayerStore;