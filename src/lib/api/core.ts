import { apiRequest } from "../apiClient";

export interface Envelope<T> {
  message: string;
  data: T;
  pagination?: { limit: number; nextCursor: string | null; hasMore: boolean };
}

export interface CursorPage<T> {
  items: T[];
  nextCursor: string | null;
  hasMore: boolean;
  limit: number;
}

export const cursorQuery = (cursor?: string | null, limit = 25) => {
  const params = new URLSearchParams({ limit: String(limit) });
  if (cursor) params.set("cursor", cursor);
  return params.toString();
};

export const cursorPage = <T>(res: Envelope<T[]>): CursorPage<T> => ({
  items: res.data,
  nextCursor: res.pagination?.nextCursor ?? null,
  hasMore: res.pagination?.hasMore ?? false,
  limit: res.pagination?.limit ?? res.data.length,
});

export type MediaUploadCategory = "gallery" | "services" | "products" | "appointments" | "studio" | "profiles" | "reviews" | "misc";

/** Uploads media in 10 MiB chunks straight from the browser to private S3. */
export const uploadStudioMedia = async (file: File, category: MediaUploadCategory): Promise<string> => {
  const started = await apiRequest<Envelope<{
    key: string; uploadId: string; partSize: number;
    parts: { partNumber: number; url: string }[];
  }>>("/uploads/multipart/initiate", {
    method: "POST", auth: true,
    body: { category, fileName: file.name, contentType: file.type || "application/octet-stream", size: file.size },
  });
  const upload = started.data;
  try {
    const parts: { ETag: string; PartNumber: number }[] = [];
    for (let i = 0; i < upload.parts.length; i += 3) {
      const uploaded = await Promise.all(upload.parts.slice(i, i + 3).map(async (part) => {
        const start = (part.partNumber - 1) * upload.partSize;
        const response = await fetch(part.url, {
          method: "PUT",
          headers: { "Content-Type": file.type || "application/octet-stream" },
          body: file.slice(start, Math.min(start + upload.partSize, file.size)),
        });
        if (!response.ok) throw new Error("A media chunk failed to upload");
        const etag = response.headers.get("ETag");
        if (!etag) throw new Error("S3 CORS must expose the ETag response header");
        return { ETag: etag, PartNumber: part.partNumber };
      }));
      parts.push(...uploaded);
    }
    const finished = await apiRequest<Envelope<{ url: string }>>("/uploads/multipart/complete", {
      method: "POST", auth: true, body: { key: upload.key, uploadId: upload.uploadId, parts },
    });
    return finished.data.url;
  } catch (error) {
    await apiRequest("/uploads/multipart/abort", {
      method: "POST", auth: true, body: { key: upload.key, uploadId: upload.uploadId },
    }).catch(() => undefined);
    throw error;
  }
};

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}
