import { useState, type FormEvent } from "react";
import { Link, useNavigate, useSearch } from "@tanstack/react-router";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { z } from "zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/store/authStore";

const schema = z.object({
  email: z.string().trim().email("Enter a valid email"),
  password: z.string().min(6, "Min 6 characters"),
});

export function LoginForm() {
  const login = useAuthStore((s) => s.login);
  const loading = useAuthStore((s) => s.loading);
  const navigate = useNavigate();
  const search = useSearch({ strict: false }) as { redirect?: string };
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const parsed = schema.safeParse({ email, password });
    if (!parsed.success) {
      const errs: Record<string, string> = {};
      parsed.error.issues.forEach((i) => (errs[i.path[0] as string] = i.message));
      setErrors(errs);
      return;
    }
    setErrors({});
    try {
      await login(email, password);
      toast.success("Welcome back");
      navigate({ to: search.redirect ?? "/" });
    } catch {
      toast.error("Invalid credentials");
    }
  };

  return (
    <div>
      <h1 className="text-xl font-semibold tracking-tight">Sign in to FastCast</h1>
      <p className="mt-1 text-sm text-muted-foreground">Stream, upload, and observe — at infrastructure speed.</p>
      <form onSubmit={submit} className="mt-6 space-y-4" noValidate>
        <Field label="Email" error={errors.email}>
          <input
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@company.dev"
            className="auth-input"
          />
        </Field>
        <Field label="Password" error={errors.password}>
          <div className="relative">
            <input
              type={showPw ? "text" : "password"}
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="auth-input pr-10"
            />
            <button type="button" onClick={() => setShowPw((v) => !v)} className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-muted-foreground hover:text-foreground" aria-label="Toggle password">
              {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </Field>
        <div className="flex items-center justify-between text-[12px]">
          <label className="inline-flex items-center gap-2 text-muted-foreground">
            <input type="checkbox" defaultChecked className="h-3.5 w-3.5 rounded border-border bg-white/[0.04]" />
            Remember session
          </label>
          <button type="button" className="text-muted-foreground hover:text-foreground">Forgot password?</button>
        </div>
        <Button type="submit" disabled={loading} variant="hero" className="w-full">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Sign in"}
        </Button>
      </form>
      <p className="mt-6 text-center text-sm text-muted-foreground">
        New to FastCast?{" "}
        <Link to="/auth/register" className="text-foreground hover:text-primary font-medium">
          Create an account
        </Link>
      </p>
      <style>{`.auth-input{display:block;width:100%;height:38px;border-radius:8px;border:1px solid var(--border);background:rgba(255,255,255,0.03);padding:0 12px;font-size:13px;outline:none;transition:all .15s}.auth-input:focus{border-color:var(--primary);box-shadow:0 0 0 3px rgba(124,92,255,.18)}`}</style>
    </div>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-[12px] font-medium text-muted-foreground">{label}</label>
      {children}
      {error && <div className="text-[11px] text-danger">{error}</div>}
    </div>
  );
}