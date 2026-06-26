import { Check, Loader2 } from "lucide-react";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";
import type { ProcessingStage } from "@/api/types";

export function ProcessingPipeline({ stages }: { stages: ProcessingStage[] }) {
  return (
    <div className="glass-card rounded-xl p-6">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-semibold">Processing pipeline</h3>
        <div className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">Kafka → FFmpeg → HLS → S3</div>
      </div>
      <ol className="relative space-y-4">
        {stages.map((stage, i) => {
          const next = stages[i + 1];
          return (
            <li key={stage.key} className="relative flex items-start gap-4">
              <div className="relative">
                <div
                  className={cn(
                    "z-10 grid h-8 w-8 place-items-center rounded-full border transition-all",
                    stage.status === "done" && "border-success/40 bg-success/10 text-success",
                    stage.status === "active" && "border-primary/40 bg-primary/10 text-primary animate-pulse-glow",
                    stage.status === "pending" && "border-white/10 bg-white/[0.02] text-muted-foreground",
                    stage.status === "failed" && "border-danger/40 bg-danger/10 text-danger",
                  )}
                >
                  {stage.status === "done" ? (
                    <Check className="h-4 w-4" />
                  ) : stage.status === "active" ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <span className="text-[11px] font-mono">{i + 1}</span>
                  )}
                </div>
                {next && (
                  <div className="absolute left-1/2 top-8 h-8 w-px -translate-x-1/2 bg-white/10 overflow-hidden">
                    {stage.status === "done" && (
                      <motion.div className="absolute inset-x-0 top-0 bg-[image:var(--gradient-primary)]" initial={{ height: 0 }} animate={{ height: "100%" }} transition={{ duration: 0.6 }} />
                    )}
                  </div>
                )}
              </div>
              <div className="pb-4 flex-1">
                <div className="text-sm font-medium">{stage.label}</div>
                <div className="text-[11px] font-mono text-muted-foreground">
                  {stage.status === "done" && stage.at ? new Date(stage.at).toLocaleTimeString() : stage.status === "active" ? "in progress…" : "queued"}
                </div>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}