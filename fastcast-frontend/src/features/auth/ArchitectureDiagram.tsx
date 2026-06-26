import { motion } from "motion/react";

const nodes = [
  { label: "Upload", color: "var(--primary)" },
  { label: "Kafka", color: "var(--accent)" },
  { label: "FFmpeg", color: "var(--primary)" },
  { label: "HLS", color: "var(--accent)" },
  { label: "S3", color: "var(--success)" },
];

export function ArchitectureDiagram() {
  return (
    <div className="glass rounded-xl p-5">
      <div className="mb-3 flex items-center justify-between">
        <div className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground">
          ingestion pipeline
        </div>
        <div className="flex items-center gap-1.5 text-[11px] text-success">
          <span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse" /> live
        </div>
      </div>
      <div className="relative">
        <div className="flex items-center justify-between gap-1">
          {nodes.map((n, i) => (
            <div key={n.label} className="flex flex-1 items-center">
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + i * 0.08 }}
                className="relative z-10 flex-1"
              >
                <div
                  className="rounded-md border border-white/10 bg-card px-2 py-2 text-center text-[11px] font-medium"
                  style={{ boxShadow: `0 0 24px ${n.color}40` }}
                >
                  {n.label}
                </div>
              </motion.div>
              {i < nodes.length - 1 && (
                <div className="relative h-px flex-shrink-0 w-4 bg-white/10">
                  <motion.div
                    className="absolute inset-y-0 left-0 w-1/3 bg-[image:var(--gradient-primary)]"
                    initial={{ x: "-100%" }}
                    animate={{ x: "300%" }}
                    transition={{ duration: 2, repeat: Infinity, delay: i * 0.3, ease: "linear" }}
                  />
                </div>
              )}
            </div>
          ))}
        </div>
        <div className="mt-4 grid grid-cols-3 gap-2 text-[10px] font-mono text-muted-foreground">
          <div className="rounded-md border border-white/5 bg-white/[0.02] px-2 py-1.5">
            <div className="text-foreground">avg ingest</div>
            <div className="text-primary">142ms</div>
          </div>
          <div className="rounded-md border border-white/5 bg-white/[0.02] px-2 py-1.5">
            <div className="text-foreground">cache hit</div>
            <div className="text-accent">93.1%</div>
          </div>
          <div className="rounded-md border border-white/5 bg-white/[0.02] px-2 py-1.5">
            <div className="text-foreground">active</div>
            <div className="text-success">1,284</div>
          </div>
        </div>
      </div>
    </div>
  );
}