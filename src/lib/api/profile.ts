import { apiRequest, ApiError } from "../apiClient";
import { Envelope, uploadStudioMedia } from "./core";

// ---------------- Profile ----------------

export interface ProfileDTO {
  full_name: string | null;
  email: string | null;
  phone: string | null;
  avatar_url: string | null;
  location: string | null;
}

interface RawProfile {
  fullName: string | null;
  email: string | null;
  phone: string | null;
  avatar: string | null;
  location: string | null;
}

const mapProfile = (p: RawProfile): ProfileDTO => ({
  full_name: p.fullName,
  email: p.email,
  phone: p.phone,
  avatar_url: p.avatar,
  location: p.location,
});

export interface ProfileUpdateInput {
  fullName?: string;
  email?: string;
  phone?: string;
  location?: string;
  avatar?: File | null;
}

export const profileApi = {
  // Returns null when the user has no profile yet (server responds 404).
  async getMine(): Promise<ProfileDTO | null> {
    try {
      const res = await apiRequest<Envelope<RawProfile>>("/profile/me", {
        auth: true,
      });
      return mapProfile(res.data);
    } catch (error) {
      if (error instanceof ApiError && error.status === 404) return null;
      throw error;
    }
  },

  async update(input: ProfileUpdateInput): Promise<ProfileDTO> {
    const avatar = input.avatar ? await uploadStudioMedia(input.avatar, "profiles") : undefined;

    const res = await apiRequest<Envelope<RawProfile>>("/profile/me", {
      method: "POST",
      auth: true,
      body: { fullName: input.fullName, email: input.email, phone: input.phone, location: input.location, avatar },
    });
    return mapProfile(res.data);
  },

  async changePassword(
    currentPassword: string,
    newPassword: string,
  ): Promise<string> {
    const res = await apiRequest<{ message: string }>("/profile/me/password", {
      method: "POST",
      auth: true,
      body: { currentPassword, newPassword },
    });
    return res.message;
  },
};
