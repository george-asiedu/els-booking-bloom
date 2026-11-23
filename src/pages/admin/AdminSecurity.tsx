import { AdminLayout } from "@/components/admin/AdminLayout";
import { DashboardHeading } from "@/components/dashboard/KpiTile";
import { SecurityPanel } from "@/components/security/SecurityPanel";
import { useStudio } from "@/hooks/useStudio";

const AdminSecurity = () => {
  const { name, features } = useStudio();
  const booking = features.booking !== false;
  return (
    <AdminLayout>
      <DashboardHeading title="Security & alerts" subtitle="Protect your sign-in and choose where you hear about new activity." />
      <SecurityPanel
        client="studio"
        label={name}
        notificationsText={
          booking
            ? "New bookings and reschedule requests as they come in, plus billing reminders, on this device."
            : "Billing reminders and account updates on this device."
        }
      />
    </AdminLayout>
  );
};

export default AdminSecurity;
