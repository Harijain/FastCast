import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { Search as SearchIcon, SlidersHorizontal } from "lucide-react";
import { videoService } from "@/services/videoService";
import { VideoCard } from "@/components/shared/VideoCard";
import { EmptyState } from "@/components/shared/EmptyState";
import { PageHeader } from "@/components/shared/PageHeader";
import { cn } from "@/lib/utils";

type SearchParams = { q?: string };

export const Route = createFileRoute("/_authenticated/search")({
  head: () => ({ meta: [{ title: "Search — FastCast" }] }),
  validateSearch: (s: Record<string, unknown>): SearchParams => ({ q: typeof s.q === "string" ? s.q : undefined }),
  component: SearchPage,
});

const FILTERS = ["ALL", "READY", "PROCESSING", "FAILED"] as const;

function SearchPage() {
  const { q: initialQ } = Route.useSearch();
  const [q, setQ] = useState(initialQ ?? "");
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("ALL");
  const [debounced, setDebounced] = useState(q);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(q), 300);
    return () => clearTimeout(t);
  }, [q]);

  const videos = useQuery({
    queryKey: ["search", debounced, filter],
    queryFn: () => videoService.search(debounced, filter),
  });

  return (
    <div>
      <PageHeader eyebrow="Discover" title="Search the catalog" description="Find videos across the FastCast network — across all status states and origins." />

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <SearchIcon className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search by title, uploader, topic..."
            className="h-10 w-full rounded-lg border border-border bg-white/[0.03] pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="h-4 w-4 text-muted-foreground" />
          {FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                "rounded-md border px-2.5 py-1 text-[11px] font-medium transition",
                filter === f ? "border-primary/40 bg-primary/10 text-primary" : "border-border bg-white/[0.02] text-muted-foreground hover:text-foreground",
              )}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {videos.isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="glass-card rounded-xl overflow-hidden">
              <div className="aspect-video animate-shimmer" />
              <div className="p-4 space-y-2"><div className="h-3 w-3/4 animate-shimmer rounded" /><div className="h-2 w-1/2 animate-shimmer rounded" /></div>
            </div>
          ))}
        </div>
      ) : videos.data?.length ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {videos.data.map((v, i) => <VideoCard key={v.id} video={v} index={i} />)}
        </div>
      ) : (
        <EmptyState icon={SearchIcon} title="No results" description="Try a different query or clear the filters." />
      )}
    </div>
  );
}