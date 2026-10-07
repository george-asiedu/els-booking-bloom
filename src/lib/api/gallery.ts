import { apiRequest } from "../apiClient";
import { CursorPage, Envelope, cursorPage, cursorQuery, uploadStudioMedia } from "./core";
import { ServiceCategory } from "./models";

// ---------------- Gallery ----------------

export interface GalleryImageDTO {
  id: string;
  title: string;
  category: ServiceCategory;
  image_url: string;
  external_video: boolean;
  media_type: "image" | "video";
  active: boolean;
  created_at: string;
}

interface RawGalleryImage {
  id: string;
  title: string | null;
  category: string;
  imageUrl: string;
  mediaType?: "IMAGE" | "VIDEO";
  active: boolean;
  createdAt: string;
}

const normalizeGalleryImage = (g: RawGalleryImage): GalleryImageDTO => ({
  id: g.id,
  title: g.title ?? "",
  category: g.category,
  image_url: g.imageUrl,
  media_type: g.mediaType === "VIDEO" ? "video" : "image",
  external_video: g.mediaType === "VIDEO" && /(?:youtube\.com|youtu\.be|tiktok\.com)/i.test(g.imageUrl),
  active: g.active,
  created_at: g.createdAt,
});

export const galleryApi = {
  async listActive(): Promise<GalleryImageDTO[]> {
    const res = await apiRequest<Envelope<RawGalleryImage[]>>(`/gallery?${cursorQuery(undefined, 100)}`);
    return res.data.map(normalizeGalleryImage);
  },
  async listActivePage(cursor?: string | null, limit = 24): Promise<CursorPage<GalleryImageDTO>> {
    const res = await apiRequest<Envelope<RawGalleryImage[]>>(`/gallery?${cursorQuery(cursor, limit)}`);
    return { ...cursorPage(res), items: res.data.map(normalizeGalleryImage) };
  },

  async listAll(): Promise<GalleryImageDTO[]> {
    const res = await apiRequest<Envelope<RawGalleryImage[]>>(`/gallery/all?${cursorQuery(undefined, 100)}`, {
      auth: true,
    });
    return res.data.map(normalizeGalleryImage);
  },
  async listAllPage(cursor?: string | null, limit = 24): Promise<CursorPage<GalleryImageDTO>> {
    const res = await apiRequest<Envelope<RawGalleryImage[]>>(`/gallery/all?${cursorQuery(cursor, limit)}`, { auth: true });
    return { ...cursorPage(res), items: res.data.map(normalizeGalleryImage) };
  },

  async upload(
    file: File,
    title: string,
    category: string,
  ): Promise<GalleryImageDTO> {
    const imageUrl = await uploadStudioMedia(file, "gallery");
    const res = await apiRequest<Envelope<RawGalleryImage>>("/gallery", {
      method: "POST",
      auth: true,
      body: { imageUrl, title, category },
    });
    return normalizeGalleryImage(res.data);
  },

  async addVideoLink(url: string, title: string, category: string): Promise<GalleryImageDTO> {
    const res = await apiRequest<Envelope<RawGalleryImage>>("/gallery", {
      method: "POST", auth: true, body: { externalUrl: url, title, category },
    });
    return normalizeGalleryImage(res.data);
  },

  async remove(id: string): Promise<void> {
    await apiRequest<Envelope<null>>(`/gallery/${id}`, {
      method: "DELETE",
      auth: true,
    });
  },
};
