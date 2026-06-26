import { Outlet, createFileRoute, redirect } from "@tanstack/react-router";
import { AppLayout } from "@/layouts/AppLayout";
import { tokenStorage } from "@/api/client";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: ({ location }) => {
    if (typeof window === "undefined") return;
    if (!tokenStorage.get()) {
      throw redirect({ to: "/auth/login", search: { redirect: location.href } as never });
    }
  },
  component: () => (
    <AppLayout>
      <Outlet />
    </AppLayout>
  ),
});