import { Outlet, createFileRoute, redirect } from "@tanstack/react-router";
import { AuthLayout } from "@/layouts/AuthLayout";
import { tokenStorage } from "@/api/client";

export const Route = createFileRoute("/auth")({
  ssr: false,
  beforeLoad: () => {
    if (typeof window === "undefined") return;
    if (tokenStorage.get()) throw redirect({ to: "/" });
  },
  component: () => (
    <AuthLayout>
      <Outlet />
    </AuthLayout>
  ),
});