import { api, shouldUseMocks, tokenStorage } from "@/api/client";
import { endpoints } from "@/api/endpoints";
import { mockAuth, mockDelay } from "@/api/mock";
import type { AuthResponse, AuthUser } from "@/api/types";

function unwrapAuthResponse(rawData: any): AuthResponse {
  const d = rawData?.data ?? rawData;
  return {
    token: d.token,
    refreshToken: d.refreshToken ?? "",
    user: {
      id: d.id ?? d.userId ?? "",
      name: d.name ?? "",
      email: d.email ?? "",
      role: d.role ?? "USER",
      createdAt: d.createdAt ?? new Date().toISOString(),
    },
  };
}

export const authService = {
  async login(email: string, password: string): Promise<AuthResponse> {
    if (await shouldUseMocks()) {
      const res = await mockDelay(mockAuth(email), 600);
      tokenStorage.set(res.token, res.refreshToken);
      return res;
    }

    const raw = await api.post(endpoints.auth.login, { email, password });
    const res = unwrapAuthResponse(raw.data);
    tokenStorage.set(res.token, res.refreshToken);
    return res;
  },

  async register(name: string, email: string, password: string): Promise<AuthResponse> {
    if (await shouldUseMocks()) {
      const res = await mockDelay(
        { ...mockAuth(email), user: { ...mockAuth(email).user, name } },
        600,
      );
      tokenStorage.set(res.token, res.refreshToken);
      return res;
    }

    const raw = await api.post(endpoints.auth.register, { name, email, password });
    const res = unwrapAuthResponse(raw.data);
    tokenStorage.set(res.token, res.refreshToken);
    return res;
  },

  async me(): Promise<AuthUser> {
    if (await shouldUseMocks()) return mockDelay(mockAuth("you@fastcast.dev").user, 200);

    const raw = await api.get(endpoints.auth.me);
    const d = raw.data?.data ?? raw.data;

    return {
      id: d.id,
      name: d.name,
      email: d.email,
      role: d.role ?? "USER",
      createdAt: d.createdAt ?? new Date().toISOString(),
    };
  },

  logout() {
    tokenStorage.clear();
  },
};