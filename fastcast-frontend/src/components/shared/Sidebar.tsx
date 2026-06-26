import { Link, useRouterState } from "@tanstack/react-router";
import { Home, Search, Upload, History, Download, Activity, User } from "lucide-react";
import { Logo } from "./Logo";
import { cn } from "@/lib/utils";

interface NavItem {
  to: "/" | "/search" | "/upload" | "/history" | "/downloads" | "/metrics" | "/profile";
  label: string;
  icon: typeof Home;
  exact?: boolean;
}

const items: NavItem[] = [
  { to: "/", label: "Home", icon: Home, exact: true },
  { to: "/search", label: "Search", icon: Search },
  { to: "/upload", label: "Upload", icon: Upload },
  { to: "/history", label: "Watch History", icon: History },
  { to: "/downloads", label: "Downloads", icon: Download },
  { to: "/metrics", label: "Metrics", icon: Activity },
  { to: "/profile", label: "Profile", icon: User },
];

export function Sidebar() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return (
    <aside className="hidden lg:flex fixed inset-y-0 left-0 z-30 w-60 flex-col border-r border-border bg-sidebar/80 backdrop-blur-xl">
      <div className="flex h-14 items-center px-5 border-b border-sidebar-border">
        <Logo />
      </div>
      <nav className="flex-1 overflow-y-auto p-3">
        <div className="px-2 pb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Platform</div>
        <ul className="space-y-0.5">
          {items.map((it) => {
            const active = it.exact ? pathname === it.to : pathname.startsWith(it.to);
            return (
              <li key={it.to}>
                <Link
                  to={it.to}
                  className={cn(
                    "group flex items-center gap-3 rounded-md px-2.5 py-2 text-[13px] transition-colors",
                    active
                      ? "bg-white/[0.06] text-foreground"
                      : "text-muted-foreground hover:bg-white/[0.04] hover:text-foreground",
                  )}
                >
                  <it.icon className={cn("h-4 w-4 transition-colors", active && "text-primary")} />
                  <span className="font-medium">{it.label}</span>
                  {active && <span className="ml-auto h-1 w-1 rounded-full bg-primary shadow-glow-primary" />}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
      <div className="border-t border-sidebar-border p-4">
        <div className="glass rounded-lg p-3 text-[11px]">
          <div className="flex items-center gap-2 font-medium">
            <span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse" />
            All systems operational
          </div>
          <div className="mt-1 text-muted-foreground">5 region edge active</div>
        </div>
      </div>
    </aside>
  );
}