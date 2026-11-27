import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Pencil, Plus, Trash2, UserRound, Users } from "lucide-react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { DashboardHeading } from "@/components/dashboard/KpiTile";
import { TabEmpty } from "@/components/dashboard/StatusTabs";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { servicesApi, staffApi, type StaffDTO } from "@/lib/api";
import { cn } from "@/lib/utils";

interface Form {
  name: string;
  role: string;
  email: string;
  serviceIds: string[];
  active: boolean;
}
const empty: Form = { name: "", role: "", email: "", serviceIds: [], active: true };

/** Stylists and chairs: who customers can book, and which services each does. */
const AdminStaff = () => {
  const qc = useQueryClient();
  const { toast } = useToast();
  const { data: staff = [], isLoading } = useQuery({ queryKey: ["admin-staff"], queryFn: () => staffApi.listAll() });
  const { data: services = [] } = useQuery({ queryKey: ["admin-services"], queryFn: () => servicesApi.listAll() });

  const [editing, setEditing] = useState<StaffDTO | null>(null);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<Form>(empty);
  const [photo, setPhoto] = useState<File | null>(null);
  const [removing, setRemoving] = useState<StaffDTO | null>(null);

  const refresh = () => {
    qc.invalidateQueries({ queryKey: ["admin-staff"] });
    qc.invalidateQueries({ queryKey: ["public-staff"] });
  };
  const fail = (e: unknown) => toast({ variant: "destructive", title: e instanceof Error ? e.message : "Something went wrong" });

  const save = useMutation({
    mutationFn: () => {
      const input = { name: form.name.trim(), role: form.role.trim() || null, email: form.email.trim() || null, serviceIds: form.serviceIds, active: form.active, photo };
      return editing ? staffApi.update(editing.id, input) : staffApi.create(input);
    },
    onSuccess: () => {
      toast({ title: editing ? "Saved" : "Staff member added" });
      setOpen(false);
      refresh();
    },
    onError: fail,
  });
  const toggle = useMutation({
    mutationFn: (s: StaffDTO) => staffApi.update(s.id, { active: !s.active }),
    onSuccess: refresh,
    onError: fail,
  });
  const remove = useMutation({
    mutationFn: (s: StaffDTO) => staffApi.remove(s.id),
    onSuccess: () => {
      toast({ title: "Staff member removed" });
      setRemoving(null);
      refresh();
    },
    onError: fail,
  });

  const startNew = () => {
    setEditing(null);
    setForm(empty);
    setPhoto(null);
    setOpen(true);
  };
  const startEdit = (s: StaffDTO) => {
    setEditing(s);
    setForm({ name: s.name, role: s.role ?? "", email: s.email ?? "", serviceIds: s.serviceIds, active: s.active !== false });
    setPhoto(null);
    setOpen(true);
  };
  const serviceName = (id: string) => services.find((x) => x.id === id)?.name;

  return (
    <AdminLayout>
      <DashboardHeading
        title="Staff"
        subtitle="Customers can book a particular person, or anyone free. Two people can be booked at the same time."
        actions={
          <Button onClick={startNew}>
            <Plus className="mr-2 h-4 w-4" /> Add staff
          </Button>
        }
      />

      {isLoading ? (
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      ) : staff.length === 0 ? (
        <TabEmpty
          icon={<Users />}
          title="No staff yet"
          hint="While there's no one here, your studio takes one booking at a time. Add your stylists to take bookings side by side."
          action={
            <Button onClick={startNew}>
              <Plus className="mr-2 h-4 w-4" /> Add staff
            </Button>
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {staff.map((s) => (
            <div key={s.id} className={cn("rounded-2xl border border-border bg-card p-5", s.active === false && "opacity-60")}>
              <div className="flex items-start gap-4">
                <span className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-full bg-muted">
                  {s.photoUrl ? <img src={s.photoUrl} alt="" className="h-full w-full object-cover" /> : <UserRound className="h-6 w-6 text-muted-foreground" />}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold">{s.name}</p>
                  {s.role && <p className="truncate text-sm text-muted-foreground">{s.role}</p>}
                  <p className="mt-2 text-xs text-muted-foreground">
                    {s.serviceIds.length
                      ? s.serviceIds.map(serviceName).filter(Boolean).join(", ")
                      : "All services"}
                  </p>
                </div>
              </div>
              <div className="mt-4 flex items-center justify-between border-t border-border pt-3">
                <label className="flex items-center gap-2 text-sm">
                  <Switch checked={s.active !== false} onCheckedChange={() => toggle.mutate(s)} aria-label={`Take bookings for ${s.name}`} />
                  {s.active !== false ? "Taking bookings" : "Not taking bookings"}
                </label>
                <span className="flex gap-1">
                  <Button variant="ghost" size="icon" aria-label={`Edit ${s.name}`} onClick={() => startEdit(s)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" aria-label={`Remove ${s.name}`} onClick={() => setRemoving(s)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              save.mutate();
            }}
            className="space-y-4"
          >
            <DialogHeader>
              <DialogTitle>{editing ? "Edit staff member" : "Add staff member"}</DialogTitle>
              <DialogDescription>Their name and photo show on the booking page.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="staff-name">Name</Label>
                <Input id="staff-name" required maxLength={60} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="staff-role">Role (optional)</Label>
                <Input id="staff-role" maxLength={60} placeholder="e.g. Senior braider" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="staff-email">Email for booking alerts (optional)</Label>
              <Input id="staff-email" type="email" maxLength={120} placeholder="name@example.com" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              <p className="text-xs text-muted-foreground">They are emailed when a booking with them is about to start, and when it is due. Customers never see it. Leave it empty and your admins get the alert instead.</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="staff-photo">Photo (optional)</Label>
              <Input id="staff-photo" type="file" accept="image/*" onChange={(e) => setPhoto(e.target.files?.[0] ?? null)} />
            </div>
            <div className="space-y-2">
              <Label>Services they do</Label>
              <p className="text-xs text-muted-foreground">Leave all unticked if they do every service.</p>
              <div className="grid max-h-48 gap-2 overflow-y-auto rounded-lg border border-border p-3 sm:grid-cols-2">
                {services.map((svc) => (
                  <label key={svc.id} className="flex items-center gap-2 text-sm">
                    <Checkbox
                      checked={form.serviceIds.includes(svc.id)}
                      onCheckedChange={(on) =>
                        setForm({ ...form, serviceIds: on ? [...form.serviceIds, svc.id] : form.serviceIds.filter((x) => x !== svc.id) })
                      }
                    />
                    <span className="truncate">{svc.name}</span>
                  </label>
                ))}
              </div>
            </div>
            <label className="flex items-center gap-2 text-sm">
              <Switch checked={form.active} onCheckedChange={(v) => setForm({ ...form, active: v })} /> Taking bookings
            </label>
            <DialogFooter>
              <Button type="submit" disabled={save.isPending || !form.name.trim()}>
                {save.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {editing ? "Save" : "Add staff member"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={Boolean(removing)} onOpenChange={(o) => !o && setRemoving(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove {removing?.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              Their past and upcoming bookings stay, without a name attached. To stop new bookings but keep them listed, switch off "Taking bookings" instead.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep</AlertDialogCancel>
            <AlertDialogAction onClick={() => removing && remove.mutate(removing)}>Remove</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
};

export default AdminStaff;
