import { cn } from "@/lib/utils";

export function Logo({ className, mark = false }: { className?: string; mark?: boolean }) {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <div className="relative">
        <div className="h-7 w-7 rounded-md bg-[image:var(--gradient-primary)] shadow-glow-primary flex items-center justify-center">
          <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4 text-white">
            <path d="M8 5v14l11-7z" fill="currentColor" />
          </svg>
        </div>
        <div className="absolute -inset-1 bg-[image:var(--gradient-primary)] opacity-30 blur-md rounded-md -z-10" />
      </div>
      {!mark && (
        <span className="font-semibold tracking-tight text-[15px]">
          Fast<span className="text-gradient">Cast</span>
        </span>
      )}
    </div>
  );
}