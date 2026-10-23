import { apiRequest } from "../apiClient";
import { Envelope } from "./core";

// ---------------- Categories ----------------

export interface CategoryDTO {
  id: string;
  name: string;
  slug: string;
  active: boolean;
  order: number;
}

export const categoriesApi = {
  async listActive(): Promise<CategoryDTO[]> {
    const res = await apiRequest<Envelope<CategoryDTO[]>>("/categories");
    return res.data;
  },

  async listAll(): Promise<CategoryDTO[]> {
    const res = await apiRequest<Envelope<CategoryDTO[]>>("/categories/all", {
      auth: true,
    });
    return res.data;
  },

  async create(name: string): Promise<CategoryDTO> {
    const res = await apiRequest<Envelope<CategoryDTO>>("/categories", {
      method: "POST",
      auth: true,
      body: { name },
    });
    return res.data;
  },

  async update(
    id: string,
    input: { name?: string; active?: boolean; order?: number },
  ): Promise<CategoryDTO> {
    const res = await apiRequest<Envelope<CategoryDTO>>(`/categories/${id}`, {
      method: "PUT",
      auth: true,
      body: input,
    });
    return res.data;
  },

  async remove(id: string): Promise<void> {
    await apiRequest<Envelope<null>>(`/categories/${id}`, {
      method: "DELETE",
      auth: true,
    });
  },
};
