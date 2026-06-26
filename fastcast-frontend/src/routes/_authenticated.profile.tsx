import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { Upload, Eye, Download as DownloadIcon, Clock, LogOut, Mail, Shield, Calendar } from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { PageHeader } from "@/components/shared/PageHeader";
import { StatCard } from "@/components/shared/StatCard";
import { Button } from "@/components/ui/button";
import { formatDuration, formatRelativeTime } from "@/utils/format";

export const Route = createFileRoute("/_authenticated/profile")({
  head: () => ({ meta: [{ title: "Profile — FastCast" }] }),
  component: ProfilePage,
});

function ProfilePage() {
  const user = useAuthStore((s) => s.user);
  const fetchMe = useAuthStore((s) => s.fetchMe);
  const logout = useAuthStore((s) => s.logout);
  const navigate = useNavigate();

  useEffect(() => { fetchMe(); }, [fetchMe]);

  const initial = user?.name?.[0]?.toUpperCase() ?? "U";
  const stats = user?.stats;

  const activity = [
    { label: "Uploaded \"HLS Adaptive Streaming at Scale\"", at: new Date(Date.now() - 3 * 3600_000).toISOString() },
    { label: "Downloaded \"Building a Custom HLS Player\" · 1080p", at: new Date(Date.now() - 8 * 3600_000).toISOString() },
    { label: "Watched \"Kafka-Backed Video Ingestion\"", at: new Date(Date.now() - 26 * 3600_000).toISOString() },
    { label: "Rotated refresh token", at: new Date(Date.now() - 3 * 86400_000).toISOString() },
  ];

  return (
    <div>
      <PageHeader
        eyebrow="Account"
        title="Profile"
        description="Your FastCast identity, activity, and platform usage."
        actions={
          <Button variant="glass" onClick={() => { logout(); navigate({ to: "/auth/login" }); }}>
            <LogOut className="h-4 w-4" /> Sign out
          </Button>
        }
      />

      <div className="glass-card mb-6 rounded-xl p-6">
        <div className="flex flex-col items-start gap-5 sm:flex-row sm:items-center">
          <div className="relative">
            <div className="grid h-16 w-16 place-items-center rounded-full bg-[image:var(--gradient-primary)] text-2xl font-semibold shadow-glow-primary">
              {initial}
            </div>
          </div>
          <div className="flex-1">
            <div className="text-xl font-semibold">{user?.name ?? "—"}</div>
            <div className="mt-1 flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5"><Mail className="h-3.5 w-3.5" />{user?.email}</span>
              <span className="flex items-center gap-1.5"><Shield className="h-3.5 w-3.5" />{user?.role}</span>
              {user?.createdAt && (
                <span className="flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5" />Joined {new Date(user.createdAt).toLocaleDateString()}</span>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={Upload} label="Videos uploaded" value={stats?.videosUploaded ?? 0} accent="primary" delay={0.05} />
        <StatCard icon={Eye} label="Videos watched" value={stats?.videosWatched ?? 0} accent="accent" delay={0.1} />
        <StatCard icon={DownloadIcon} label="Downloads" value={stats?.downloads ?? 0} accent="success" delay={0.15} />
        <StatCard icon={Clock} label="Watch time (h)" value={Math.round((stats?.watchTimeSeconds ?? 0) / 3600)} accent="warning" delay={0.2} />
      </div>

      <div className="mt-8">
        <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Recent activity</h3>
        <div className="glass-card rounded-xl">
          <ol className="divide-y divide-white/5">
            {activity.map((a, i) => (
              <li key={i} className="flex items-center gap-3 p-4">
                <div className="h-2 w-2 rounded-full bg-primary shadow-glow-primary" />
                <div className="flex-1 text-sm">{a.label}</div>
                <div className="font-mono text-[11px] text-muted-foreground">{formatRelativeTime(a.at)}</div>
              </li>
            ))}
          </ol>
        </div>
      </div>

      <p className="mt-6 text-[11px] font-mono text-muted-foreground">
        Total watch time: {formatDuration(stats?.watchTimeSeconds ?? 0)}
      </p>
    </div>
  );
}