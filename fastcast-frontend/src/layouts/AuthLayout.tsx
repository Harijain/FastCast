import type { ReactNode } from "react";
import { Logo } from "@/components/shared/Logo";
import { ArchitectureDiagram } from "@/features/auth/ArchitectureDiagram";

export function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-background">
      {/* Left brand panel */}
      <div className="relative hidden lg:flex flex-col justify-between overflow-hidden border-r border-border p-10 bg-mesh">
        <div className="absolute inset-0 grid-bg opacity-50" />
        <div className="relative">
          <Logo />
        </div>
        <div className="relative max-w-md">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-2.5 py-0.5 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
            <span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse" />
            v1.0 · production
          </div>
          <h2 className="text-3xl font-semibold leading-tight tracking-tight">
            Distributed Video Streaming Platform
          </h2>
          <p className="mt-3 text-sm text-muted-foreground">
            Adaptive HLS streaming powered by Kafka pipelines, Redis caching, and cloud-native processing — built for engineering teams that ship at scale.
          </p>
          <div className="mt-8">
            <ArchitectureDiagram />
          </div>
        </div>
        <div className="relative text-[11px] text-muted-foreground/70 font-mono">
          Spring Boot · Kafka · Redis · PostgreSQL · S3 · FFmpeg · HLS · JWT · Flyway · Prometheus
        </div>
      </div>
      {/* Right form panel */}
      <div className="relative flex items-center justify-center p-6 sm:p-10">
        <div className="absolute inset-0 bg-mesh opacity-50 lg:hidden" />
        <div className="relative w-full max-w-md">
          <div className="lg:hidden mb-6"><Logo /></div>
          <div className="glass rounded-2xl p-7 shadow-glow-primary/0">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}