import { useStudio } from "@/hooks/useStudio";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { UserDirectory, type DirectorySource } from "@/components/users/UserDirectory";
import { studioUsersApi } from "@/lib/api";
import { apiRequest } from "@/lib/apiClient";

// Read-only: changing or deleting accounts is for the super admin.
const source: DirectorySource = {
  key: "studio-users",
  list: (q) => studioUsersApi.list(q),
  detail: (id) => studioUsersApi.detail(id),
  saveNotes: (id, notes) => apiRequest(`/studio/users/${id}/notes`, { method: "PUT", auth: true, body: { notes } }),
};

/** Everyone with an account at the studio: customers and admins. */
const AdminCustomers = () => {
  const { features } = useStudio();
  // A store has no bookings; a studio without a shop has no orders.
  const hasBookings = features?.booking !== false;
  const hasOrders = Boolean(features?.commerce);
  const seen = [hasBookings && "bookings", hasOrders && "orders", "loyalty points"].filter(Boolean).join(", ").replace(/, ([^,]*)$/, " and $1");
  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Users</h1>
          <p className="text-muted-foreground">
            Your customers, the admins who run your {hasBookings ? "studio" : "store"} and your staff. Open someone to see their {seen}.
          </p>
        </div>
        <UserDirectory source={source} showStudio={false} noun="users" features={{ booking: hasBookings, commerce: hasOrders }} />
      </div>
    </AdminLayout>
  );
};

export default AdminCustomers;
