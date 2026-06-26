import { type LucideIcon } from "lucide-react";
import { motion } from "motion/react";
import { AnimatedCounter } from "./AnimatedCounter";
import { cn } from "@/lib/utils";

interface StatCardProps {
  icon: LucideIcon;
  label: string;
  value: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  trend?: { value: number; positive: boolean };
  accent?: "primary" | "accent" | "success" | "warning";
  delay?: number;
}

const accents: Record<NonNullable<StatCardProps["accent"]>, string> = {
  primary: "text-primary",
  accent: "text-accent",
  success: "text-success",
  warning: "text-warning",
};

export function StatCard({ icon: Icon, label, value, decimals, prefix, suffix, trend, accent = "primary", delay = 0 }: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay, ease: [0.22, 1, 0.36, 1] }}
      className="glass-card relative overflow-hidden rounded-xl p-5"
    >
      <div className="flex items-center justify-between">
        <span className="text-[12px] font-medium uppercase tracking-wider text-muted-foreground">{label}</span>
        <div className={cn("rounded-md p-1.5 bg-white/[0.03]", accents[accent])}>
          <Icon className="h-4 w-4" />
        </div>
      </div>
      <div className="mt-4 text-3xl font-semibold tracking-tight">
        <AnimatedCounter value={value} decimals={decimals} prefix={prefix} suffix={suffix} />
      </div>
      {trend && (
        <div className={cn("mt-1 text-xs font-medium", trend.positive ? "text-success" : "text-danger")}>
          {trend.positive ? "▲" : "▼"} {Math.abs(trend.value)}% vs last 24h
        </div>
      )}
      <div className="pointer-events-none absolute -right-12 -top-12 h-32 w-32 rounded-full bg-[image:var(--gradient-primary)] opacity-[0.07] blur-2xl" />
    </motion.div>
  );
}