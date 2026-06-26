import { Link } from "@tanstack/react-router";
import { Play, Clock } from "lucide-react";
import { motion } from "motion/react";
import type { Video } from "@/api/types";
import { StatusBadge } from "./StatusBadge";
import { formatDuration, formatRelativeTime, formatNumber } from "@/utils/format";

export function VideoCard({ video, index = 0 }: { video: Video; index?: number }) {
  const disabled = video.status !== "READY";
  const content = (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.03, ease: [0.22, 1, 0.36, 1] }}
      className="glass-card-hover group relative overflow-hidden rounded-xl"
    >
      <div className="relative aspect-video overflow-hidden bg-black/40">
        <img
          src={video.thumbnailUrl}
          alt={video.title}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/0 to-black/0" />
        <div className="absolute top-3 left-3"><StatusBadge status={video.status} /></div>
        <div className="absolute bottom-3 right-3 inline-flex items-center gap-1 rounded-md bg-black/70 px-1.5 py-0.5 text-[11px] font-mono backdrop-blur">
          <Clock className="h-3 w-3" />
          {formatDuration(video.durationSeconds)}
        </div>
        {!disabled && (
          <div className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity group-hover:opacity-100">
            <div className="rounded-full bg-primary/90 p-3 shadow-glow-primary">
              <Play className="h-5 w-5 fill-white text-white" />
            </div>
          </div>
        )}
      </div>
      <div className="p-4">
        <h3 className="line-clamp-2 text-[14px] font-medium leading-snug">{video.title}</h3>
        <div className="mt-2 flex items-center justify-between text-[11px] text-muted-foreground">
          <span className="truncate">{video.uploaderName}</span>
          <span className="font-mono">
            {formatNumber(video.views)} views · {formatRelativeTime(video.createdAt)}
          </span>
        </div>
      </div>
    </motion.div>
  );
  if (disabled) return content;
  return (
    <Link to="/watch/$id" params={{ id: video.id }} className="block">
      {content}
    </Link>
  );
}