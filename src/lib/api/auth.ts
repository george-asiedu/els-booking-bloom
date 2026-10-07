import { apiRequest, tokenStore, AuthUser } from "../apiClient";
import { Envelope, TokenPair } from "./core";

// ---------------- Auth ----------------

export interface SignupPayload {
  email: string;
  password: string;
  fullName?: string;
  phone?: string;
  referralCode?: string;
}

const persistAuth = (data: { user: AuthUser; token: TokenPair }): AuthUser => {
  tokenStore.setToken(data.token.accessToken);
  tokenStore.setUser(data.user);
  return data.user;
};

export const authApi = {
  async login(email: string, password: string): Promise<AuthUser> {
    const res = await apiRequest<Envelope<{ user: AuthUser; token: TokenPair }>>(
      "/auth/login",
      { method: "POST", body: { email, password } },
    );
    return persistAuth(res.data);
  },

  async signup(payload: SignupPayload): Promise<AuthUser> {
    const res = await apiRequest<Envelope<{ user: AuthUser; token: TokenPair }>>(
      "/auth/signup",
      { method: "POST", body: payload },
    );
    return persistAuth(res.data);
  },

  async logout() {
    try {
      await apiRequest<{ message: string }>("/auth/logout", { method: "POST" });
    } catch {
      // Clear local credentials even when the network is unavailable.
    } finally {
      tokenStore.clear();
    }
  },

  async forgotPassword(email: string): Promise<string> {
    const res = await apiRequest<{ message: string }>(
      "/auth/forgot-password",
      { method: "POST", body: { email } },
    );
    return res.message;
  },

  async resetPassword(token: string, password: string): Promise<string> {
    const res = await apiRequest<{ message: string }>(
      `/auth/reset-password/${token}`,
      { method: "POST", body: { password } },
    );
    return res.message;
  },
};
