import { apiRequest, tokenStore, AuthUser } from "../apiClient";
import { Envelope } from "./core";

// ---------------- Auth ----------------

export interface SignupPayload {
  email: string;
  password: string;
  fullName?: string;
  phone?: string;
  referralCode?: string;
}

const persistAuth = (data: { user: AuthUser }): AuthUser => {
  tokenStore.setUser(data.user);
  return data.user;
};

export const authApi = {
  async login(email: string, password: string, totp?: string): Promise<AuthUser> {
    const res = await apiRequest<Envelope<{ user: AuthUser }>>(
      "/auth/login",
      { method: "POST", body: { email, password, ...(totp ? { totp } : {}) } },
    );
    return persistAuth(res.data);
  },

  async signup(payload: SignupPayload): Promise<AuthUser> {
    const res = await apiRequest<Envelope<{ user: AuthUser }>>(
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

  // Optional email confirmation, offered in the customer's account.
  async emailStatus(): Promise<boolean> {
    const res = await apiRequest<Envelope<{ verified: boolean }>>("/auth/email-status", { auth: true });
    return res.data.verified;
  },
  async sendEmailCode(): Promise<void> {
    await apiRequest("/auth/email-code", { method: "POST", auth: true });
  },
  async confirmEmailCode(code: string): Promise<void> {
    await apiRequest("/auth/email-code/confirm", { method: "POST", auth: true, body: { code } });
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
