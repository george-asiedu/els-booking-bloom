import { apiRequest } from "../apiClient";

// Studio users (customers and studio admins), as the super admin's Users tab
// and a studio admin's Customers page see them. The same shapes serve both;
// only the super admin can edit or delete (see platformApi).

export type DirectoryRole = "CUSTOMER" | "ADMIN";

export interface DirectoryUser {
  id: string;
  email: string;
  role: DirectoryRole;
  fullName: string | null;
  phone: string | null;
  studio: { id: string; name: string; slug: string } | null;
  isOwner: boolean;
  bookings: number;
  totalSpent: number;
  createdAt: string;
}

export interface DirectoryUserDetail extends Omit<DirectoryUser, "bookings"> {
  location: string | null;
  avatar: string | null;
  updatedAt: string;
  loyaltyPoints: number;
  lifetimePoints: number;
  referralCode: string | null;
  referralUses: number;
  bookings: number;
  orders: number;
  recentAppointments: {
    id: string;
    date: string;
    time: string;
    status: string;
    service: string | null;
    amount: number;
  }[];
  recentOrders: { id: string; orderNumber: string; total: number; status: string; createdAt: string }[];
}

export interface DirectoryPage {
  items: DirectoryUser[];
  page: number;
  pageSize: number;
  total: number;
}

export interface DirectoryQuery {
  search?: string;
  role?: DirectoryRole | "";
  studioId?: string;
  page?: number;
  pageSize?: number;
}

export const directoryQuery = (q: DirectoryQuery) => {
  const p = new URLSearchParams();
  if (q.search?.trim()) p.set("search", q.search.trim());
  if (q.role) p.set("role", q.role);
  if (q.studioId) p.set("studioId", q.studioId);
  p.set("page", String(q.page ?? 1));
  p.set("pageSize", String(q.pageSize ?? 20));
  return p.toString();
};

export interface RawDirectoryPage {
  data: DirectoryUser[];
  pagination: { page: number; pageSize: number; total: number; pages: number };
}

export const toDirectoryPage = (res: RawDirectoryPage): DirectoryPage => ({
  items: res.data,
  page: res.pagination.page,
  pageSize: res.pagination.pageSize,
  total: res.pagination.total,
});

/** A studio admin's read-only view of their own studio's users. */
export const studioUsersApi = {
  async list(q: DirectoryQuery): Promise<DirectoryPage> {
    const res = await apiRequest<RawDirectoryPage>(`/studio/users?${directoryQuery({ ...q, studioId: undefined })}`, {
      auth: true,
    });
    return toDirectoryPage(res);
  },
  async detail(id: string): Promise<DirectoryUserDetail> {
    const res = await apiRequest<{ data: DirectoryUserDetail }>(`/studio/users/${id}`, { auth: true });
    return res.data;
  },
};
