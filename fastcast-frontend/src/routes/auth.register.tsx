import { createFileRoute } from "@tanstack/react-router";
import { RegisterForm } from "@/features/auth/RegisterForm";

export const Route = createFileRoute("/auth/register")({
  head: () => ({ meta: [{ title: "Create account — FastCast" }] }),
  component: RegisterForm,
});