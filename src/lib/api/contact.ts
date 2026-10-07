import { apiRequest } from "../apiClient";
import { Envelope } from "./core";

// ---------------- Contact info ----------------

export interface ContactInfoDTO {
  phone: string | null;
  whatsapp: string | null;
  email: string | null;
  instagram: string | null;
  tiktok: string | null;
  facebook: string | null;
  address: string | null;
  showPhone: boolean;
  showWhatsapp: boolean;
  showEmail: boolean;
  showInstagram: boolean;
  showTiktok: boolean;
  showFacebook: boolean;
  showAddress: boolean;
}

export const contactInfoApi = {
  async get(): Promise<ContactInfoDTO> {
    const res = await apiRequest<Envelope<ContactInfoDTO>>("/contact-info");
    return res.data;
  },

  async update(input: Partial<ContactInfoDTO>): Promise<ContactInfoDTO> {
    const res = await apiRequest<Envelope<ContactInfoDTO>>("/contact-info", {
      method: "PUT",
      auth: true,
      body: input,
    });
    return res.data;
  },
};
