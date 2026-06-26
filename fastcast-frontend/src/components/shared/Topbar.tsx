import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { Bell, Search, LogOut, Menu } from "lucide-react";
import { useState, type FormEvent } from "react";
import { useAuthStore } from "@/store/authStore";
import { Logo } from "./Logo";
import { Button } from "@/components/ui/button";

export function Topbar() {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [q, setQ] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);

  const onSearch = (e: FormEvent) => {
    e.preventDefault();
    navigate({ to: "/search", search: { q } as never });
  };

  const initial = user?.name?.[0]?.toUpperCase() ?? "U";

  return (
    <header className="sticky top-0 z-20 h-14 border-b border-border bg-background/70 backdrop-blur-xl">
      <div className="flex h-full items-center gap-3 px-4 lg:px-6">
        <button
          className="lg:hidden -ml-1 rounded-md p-1.5 hover:bg-white/5"
          onClick={() => setMenuOpen((v) => !v)}
          aria-label="Toggle menu"
        >
          <Menu className="h-5 w-5" />
        </button>
        <div className="lg:hidden"><Logo mark /></div>
        <form onSubmit={onSearch} className="relative flex-1 max-w-lg">
          <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search videos, uploaders, topics..."
            className="h-9 w-full rounded-md border border-border bg-white/[0.03] pl-9 pr-3 text-sm placeholder:text-muted-foreground/70 focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <kbd className="hidden md:inline-flex absolute right-2 top-1/2 -translate-y-1/2 items-center gap-1 rounded border border-border bg-white/[0.04] px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
            ⌘K
          </kbd>
        </form>
        <div className="ml-auto flex items-center gap-2">
          <button className="relative rounded-md p-2 text-muted-foreground hover:bg-white/5 hover:text-foreground" aria-label="Notifications">
            <Bell className="h-4 w-4" />
            <span className="absolute top-1.5 right-1.5 h-1.5 w-1.5 rounded-full bg-accent" />
          </button>
          <Link
            to="/profile"
            className="flex items-center gap-2 rounded-md border border-border bg-white/[0.03] px-2 py-1 hover:bg-white/[0.06]"
          >
            <div className="grid h-6 w-6 place-items-center rounded-full bg-[image:var(--gradient-primary)] text-[11px] font-semibold">
              {initial}
            </div>
            <span className="hidden sm:inline text-xs font-medium">{user?.name ?? "Guest"}</span>
          </Link>
          <Button variant="ghost" size="sm" onClick={() => { logout(); navigate({ to: "/auth/login" }); }}>
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
      {menuOpen && (
        <MobileMenu pathname={pathname} onNavigate={() => setMenuOpen(false)} />
      )}
    </header>
  );
}

function MobileMenu({ pathname, onNavigate }: { pathname: string; onNavigate: () => void }) {
  const items = [
    { to: "/", label: "Home" },
    { to: "/search", label: "Search" },
    { to: "/upload", label: "Upload" },
    { to: "/history", label: "History" },
    { to: "/downloads", label: "Downloads" },
    { to: "/metrics", label: "Metrics" },
    { to: "/profile", label: "Profile" },
  ] as const;
  return (
    <div className="lg:hidden absolute inset-x-0 top-14 border-b border-border bg-background/95 backdrop-blur-xl p-2">
      <ul className="grid grid-cols-2 gap-1">
        {items.map((it) => (
          <li key={it.to}>
            <Link
              to={it.to}
              onClick={onNavigate}
              className={`block rounded-md px-3 py-2 text-sm ${pathname === it.to ? "bg-white/[0.06]" : "hover:bg-white/[0.04]"}`}
            >
              {it.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}