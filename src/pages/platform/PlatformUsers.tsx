import { PlatformLayout } from "./PlatformLayout";
import { UserDirectory, type DirectorySource } from "@/components/users/UserDirectory";
import { platformApi } from "@/lib/platformApi";

const source: DirectorySource = {
  key: "platform-users",
  list: (q) => platformApi.listUsers(q),
  detail: (id) => platformApi.getUser(id),
  update: (id, input) => platformApi.updateUser(id, input),
  remove: (id) => platformApi.deleteUser(id),
};

/** Every studio's admins; each opens to their details and their customers. */
const PlatformUsers = () => (
  <PlatformLayout>
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-2xl font-semibold">Users</h1>
        <p className="text-muted-foreground">
          The admins who run each studio. Open one to see their details and their studio's
          customers, and to edit or delete accounts.
        </p>
      </div>
      <UserDirectory source={source} showStudio fixedRole="ADMIN" showStudioCustomers noun="studio admins" />
    </div>
  </PlatformLayout>
);

export default PlatformUsers;
