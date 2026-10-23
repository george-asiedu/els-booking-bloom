import { AdminLayout } from "@/components/admin/AdminLayout";
import { UserDirectory, type DirectorySource } from "@/components/users/UserDirectory";
import { studioUsersApi } from "@/lib/api";

// Read-only: changing or deleting accounts is for the super admin.
const source: DirectorySource = {
  key: "studio-users",
  list: (q) => studioUsersApi.list(q),
  detail: (id) => studioUsersApi.detail(id),
};

/** The studio's customers (and admins), with their bookings and spend. */
const AdminCustomers = () => (
  <AdminLayout>
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Customers</h1>
        <p className="text-muted-foreground">
          Everyone with an account at your studio. Open someone to see their bookings, orders
          and loyalty points.
        </p>
      </div>
      <UserDirectory source={source} showStudio={false} noun="customers" />
    </div>
  </AdminLayout>
);

export default AdminCustomers;
