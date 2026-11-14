import { apiRequest } from "@/lib/apiClient";
import { platformRequest } from "@/lib/platformApi";

// Studio accounts (customers, studio admins) and the super admin have separate
// sessions, so the same settings call a different base. Paths are the same.
export type SecurityClient = "studio" | "platform";

type Method = "GET" | "POST" | "DELETE";

export const securityRequest = <T>(client: SecurityClient, path: string, method: Method = "GET", body?: unknown) =>
  client === "platform"
    ? platformRequest<T>(path, { method, body })
    : apiRequest<T>(path, { method, body, auth: true });

export interface TwoFactorStatus {
  enabled: boolean;
  recoveryCodesLeft: number;
}
export interface TwoFactorSetup {
  secret: string;
  otpauthUri: string;
  qrDataUrl: string;
}
export interface PushConfig {
  publicKey: string | null;
  devices: number;
}
