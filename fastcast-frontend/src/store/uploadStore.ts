import { create } from "zustand";
import type { ProcessingStage } from "@/api/types";

const initialStages: ProcessingStage[] = [
  {
    key: "UPLOADED",
    label: "Video Uploaded",
    status: "pending",
  },
  {
    key: "KAFKA_QUEUED",
    label: "Kafka Processing",
    status: "pending",
  },
  {
    key: "THUMBNAIL",
    label: "Generating Thumbnail",
    status: "pending",
  },
  {
    key: "TRANSCODING",
    label: "FFmpeg Transcoding",
    status: "pending",
  },
  {
    key: "HLS",
    label: "Generating HLS",
    status: "pending",
  },
  {
    key: "S3_UPLOAD",
    label: "Uploading to AWS S3",
    status: "pending",
  },
  {
    key: "COMPLETED",
    label: "Ready to Stream",
    status: "pending",
  },
];

interface UploadState {
  file: File | null;
  progress: number;
  uploading: boolean;
  videoId: string | null;
  stages: ProcessingStage[];

  setFile: (f: File | null) => void;
  setProgress: (p: number) => void;
  setUploading: (b: boolean) => void;
  setVideoId: (id: string | null) => void;
  advanceStage: (key: ProcessingStage["key"]) => void;
  reset: () => void;
  simulatePipeline: () => void;
}

export const useUploadStore = create<UploadState>((set) => ({
  file: null,
  progress: 0,
  uploading: false,
  videoId: null,
  stages: initialStages,

  setFile: (file) =>
    set({
      file,
    }),

  setProgress: (progress) =>
    set({
      progress,
    }),

  setUploading: (uploading) =>
    set({
      uploading,
    }),

  setVideoId: (videoId) =>
    set({
      videoId,
    }),

  advanceStage: (key) =>
    set((state) => ({
      stages: state.stages.map((stage) =>
        stage.key === key
          ? {
              ...stage,
              status: "done",
              at: new Date().toISOString(),
            }
          : stage
      ),
    })),

  reset: () =>
    set({
      file: null,
      progress: 0,
      uploading: false,
      videoId: null,
      stages: initialStages.map((stage) => ({
        ...stage,
        status: "pending",
      })),
    }),

  simulatePipeline: () => {
    const order: ProcessingStage["key"][] = [
      "UPLOADED",
      "KAFKA_QUEUED",
      "THUMBNAIL",
      "TRANSCODING",
      "HLS",
      "S3_UPLOAD",
      "COMPLETED",
    ];

    set((state) => ({
      stages: state.stages.map((stage) =>
        stage.key === "UPLOADED"
          ? {
              ...stage,
              status: "done",
              at: new Date().toISOString(),
            }
          : stage
      ),
    }));

    let index = 1;

    set((state) => ({
      stages: state.stages.map((stage) =>
        stage.key === order[index]
          ? {
              ...stage,
              status: "active",
            }
          : stage
      ),
    }));

    const tick = () => {
      if (index >= order.length) return;

      const current = order[index];

      set((state) => ({
        stages: state.stages.map((stage) =>
          stage.key === current
            ? {
                ...stage,
                status: "done",
                at: new Date().toISOString(),
              }
            : stage
        ),
      }));

      index++;

      if (index < order.length) {
        const next = order[index];

        set((state) => ({
          stages: state.stages.map((stage) =>
            stage.key === next
              ? {
                  ...stage,
                  status: "active",
                }
              : stage
          ),
        }));

        setTimeout(tick, 1200 + Math.random() * 700);
      }
    };

    setTimeout(tick, 800);
  },
}));