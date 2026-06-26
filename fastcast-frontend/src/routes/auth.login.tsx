import { createFileRoute } from "@tanstack/react-router";
import { LoginForm } from "@/features/auth/LoginForm";

export const Route = createFileRoute("/auth/login")({
  head: () => ({ meta: [{ title: "Sign in — FastCast" }] }),
  component: LoginForm,
});