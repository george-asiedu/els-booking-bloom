import { NotificationsCard } from "./NotificationsCard";
import { TwoFactorCard } from "./TwoFactorCard";
import type { SecurityClient } from "./securityApi";

/** Two-step sign-in and push notifications, side by side on wide screens. */
export const SecurityPanel = ({
  client,
  label,
  notificationsText,
}: {
  client: SecurityClient;
  label?: string;
  notificationsText: string;
}) => (
  <div className="grid gap-4 lg:grid-cols-2">
    <TwoFactorCard client={client} label={label} />
    <NotificationsCard client={client} description={notificationsText} />
  </div>
);
