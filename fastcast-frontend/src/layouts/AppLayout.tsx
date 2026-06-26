import type { ReactNode } from "react";
import { Sidebar } from "@/components/shared/Sidebar";
import { Topbar } from "@/components/shared/Topbar";

export function AppLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Sidebar />
      <div className="lg:pl-60">
        <Topbar />
        <main className="px-4 py-6 sm:px-6 lg:px-8 lg:py-8">{children}</main>
      </div>
    </div>
  );
}