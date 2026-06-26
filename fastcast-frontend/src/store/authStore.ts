import { create } from "zustand";
import { persist } from "zustand/middleware";
import { authService } from "@/services/authService";
import type { AuthUser } from "@/api/types";

interface AuthState {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  hydrated: boolean;
  setUser: (u: AuthUser | null) => void;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  fetchMe: () => Promise<void>;
  setHydrated: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      loading: false,
      hydrated: false,
      setHydrated: () => set({ hydrated: true }),
      setUser: (u) => set({ user: u, isAuthenticated: !!u }),
      async login(email, password) {
        set({ loading: true });
        try {
          const res = await authService.login(email, password);
          set({ user: res.user, token: res.token, isAuthenticated: true });
        } finally {
          set({ loading: false });
        }
      },
      async register(name, email, password) {
        set({ loading: true });
        try {
          const res = await authService.register(name, email, password);
          set({ user: res.user, token: res.token, isAuthenticated: true });
        } finally {
          set({ loading: false });
        }
      },
      logout() {
        authService.logout();
        set({ user: null, token: null, isAuthenticated: false });
      },
      async fetchMe() {
        if (!get().isAuthenticated) return;
        try {
          const u = await authService.me();
          set({ user: u });
        } catch {
          /* ignore */
        }
      },
    }),
    {
      name: "fastcast.auth",
      partialize: (s) => ({ user: s.user, token: s.token, isAuthenticated: s.isAuthenticated }),
      onRehydrateStorage: () => (state) => {
        state?.setHydrated();
      },
    },
  ),
);