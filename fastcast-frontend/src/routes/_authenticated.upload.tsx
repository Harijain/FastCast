import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Sparkles, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { useUploadStore } from "@/store/uploadStore";
import { uploadService } from "@/services/uploadService";

import { Dropzone } from "@/features/upload/Dropzone";
import { ProcessingPipeline } from "@/features/upload/ProcessingPipeline";

import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

export const Route = createFileRoute("/_authenticated/upload")({
  head: () => ({
    meta: [
      {
        title: "Upload — FastCast",
      },
    ],
  }),
  component: UploadPage,
});

function UploadPage() {
  const navigate = useNavigate();

  const {
    file,
    setFile,
    progress,
    setProgress,
    uploading,
    setUploading,
    videoId,
    setVideoId,
    stages,
    reset,
    simulatePipeline,
  } = useUploadStore();

  const done = stages.every((s) => s.status === "done");

  const start = async () => {
    if (!file) return;

    setUploading(true);

    try {
      const result = await uploadService.upload(
        file,
        setProgress,
      );

      setVideoId(result.id);

      toast.success(
        "Upload successful. FastCast is now generating thumbnails, adaptive HLS renditions and streaming assets."
      );

      simulatePipeline();
    } catch {
      toast.error("Upload failed");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <PageHeader
        eyebrow="Processing Pipeline"
        title="Upload a new video"
        description="Every upload flows through Kafka, automatic thumbnail generation, FFmpeg transcoding, adaptive HLS packaging and AWS S3 before becoming streamable."
        actions={
          videoId && done ? (
            <Button
              variant="hero"
              onClick={() =>
                navigate({
                  to: "/watch/$id",
                  params: {
                    id: videoId,
                  },
                })
              }
            >
              <Sparkles className="h-4 w-4" />
              Watch Video
            </Button>
          ) : null
        }
      />

      <div className="grid gap-6 lg:grid-cols-5">
        <div className="space-y-4 lg:col-span-3">

          <Dropzone
            file={file}
            onFile={(f) => {
              reset();
              setFile(f);
            }}
          />

          {file && !videoId && (
            <div className="glass-card rounded-xl p-5">
              {uploading ? (
                <div className="space-y-3">

                  <div className="flex items-center justify-between text-sm">

                    <div className="flex items-center gap-2 text-muted-foreground">

                      <Loader2 className="h-4 w-4 animate-spin" />

                      Uploading video...

                    </div>

                    <span className="font-mono">
                      {Math.round(progress)}%
                    </span>

                  </div>

                  <Progress value={progress} />

                </div>
              ) : (
                <div className="flex items-center justify-between">

                  <div className="text-sm text-muted-foreground">

                    Your video will automatically receive a thumbnail, be
                    transcoded into adaptive HLS, uploaded to AWS S3 and become
                    streamable worldwide.

                  </div>

                  <Button
                    variant="hero"
                    onClick={start}
                  >
                    Upload & Process
                  </Button>

                </div>
              )}
            </div>
          )}

        </div>

        <div className="lg:col-span-2">

          {videoId ? (
            <ProcessingPipeline stages={stages} />
          ) : (
            <PipelinePreview />
          )}

        </div>

      </div>

    </div>
  );
}
function PipelinePreview() {
  const stages = [
    {
      title: "Video Upload",
      description: "Securely uploaded to FastCast ingest service.",
    },
    {
      title: "Kafka Event",
      description: "A processing job is published for asynchronous execution.",
    },
    {
      title: "Thumbnail Generation",
      description: "FFmpeg captures a preview frame automatically.",
    },
    {
      title: "Adaptive Transcoding",
      description: "FFmpeg creates 720p, 480p and 240p renditions.",
    },
    {
      title: "HLS Packaging",
      description: "Master playlist and media segments are generated.",
    },
    {
      title: "AWS S3 Storage",
      description: "Streaming assets are uploaded and organized in S3.",
    },
    {
      title: "Ready to Stream",
      description: "Video becomes instantly playable worldwide.",
    },
  ];

  return (
    <div className="glass-card rounded-xl p-6">
      <h3 className="mb-2 text-lg font-semibold">
        Processing Pipeline
      </h3>

      <p className="mb-6 text-sm text-muted-foreground">
        Every uploaded video passes through a production-style distributed
        processing pipeline before becoming available for playback.
      </p>

      <div className="space-y-4">
        {stages.map((stage, index) => (
          <div
            key={stage.title}
            className="flex gap-4"
          >
            <div className="flex flex-col items-center">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-sm font-semibold text-white">
                {index + 1}
              </div>

              {index !== stages.length - 1 && (
                <div className="mt-1 h-8 w-px bg-border" />
              )}
            </div>

            <div className="pb-4">
              <h4 className="font-medium">
                {stage.title}
              </h4>

              <p className="text-sm text-muted-foreground">
                {stage.description}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}