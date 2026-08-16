import { tokenStore, studioStore, AuthUser } from "./apiClient";
import { platformApi } from "./platformApi";

/**
 * Drop the super admin into a studio's admin dashboard. Mints an owner token on
 * the server, writes the normal storefront/admin session + the active studio
 * slug, then does a full navigation to /admin so the AuthProvider re-reads the
 * session from localStorage. The separate platform session is untouched, so the
 * super admin stays signed in to /platform.
 */
export async function enterStudioAsAdmin(studioId: string): Promise<void> {
  const res = await platformApi.impersonate(studioId);
  tokenStore.setToken(res.token.accessToken);
  tokenStore.setUser({
    id: res.user.id,
    email: res.user.email,
    role: "ADMIN",
  } as AuthUser);
  studioStore.setSlug(res.studio.slug);
  window.location.href = "/admin";
}
