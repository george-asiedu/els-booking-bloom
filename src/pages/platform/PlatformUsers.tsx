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

/** Every studio's customers and admins, with edit and delete. */
const PlatformUsers = () => (
  <PlatformLayout>
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-2xl font-semibold">Users</h1>
        <p className="text-muted-foreground">
          Customers and studio admins across every studio. Open someone to see their details,
          edit them, or delete their account.
        </p>
      </div>
      <UserDirectory source={source} showStudio noun="users" />
    </div>
  </PlatformLayout>
);

export default PlatformUsers;
