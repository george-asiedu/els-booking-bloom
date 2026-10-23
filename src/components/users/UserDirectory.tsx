import { useEffect, useId, useState } from "react";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format, parseISO } from "date-fns";
import { Crown, Loader2, Search, Trash2, UserRound } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { TablePagination } from "@/components/ui/table-pagination";
import { useToast } from "@/hooks/use-toast";
import { formatGHS } from "@/lib/currency";
import { cn } from "@/lib/utils";
import type { DirectoryPage, DirectoryQuery, DirectoryRole, DirectoryUserDetail } from "@/lib/api";

export interface DirectorySource {
  key: string; // query-cache namespace
  list: (q: DirectoryQuery) => Promise<DirectoryPage>;
  detail: (id: string) => Promise<DirectoryUserDetail>;
  // Super admin only.
  update?: (id: string, input: { fullName?: string | null; phone?: string | null; location?: string | null; email?: string }) => Promise<DirectoryUserDetail>;
  remove?: (id: string) => Promise<void>;
}

const PAGE_SIZE = 20;
const ROLE_FILTERS: { value: DirectoryRole | ""; label: string }[] = [
  { value: "", label: "All" },
  { value: "CUSTOMER", label: "Customers" },
  { value: "ADMIN", label: "Studio admins" },
];

const RoleBadge = ({ role, isOwner }: { role: DirectoryRole; isOwner: boolean }) =>
  role === "ADMIN" ? (
    <Badge variant="secondary" className="gap-1 font-medium">
      {isOwner && <Crown className="h-3 w-3" aria-hidden />}
      {isOwner ? "Owner" : "Admin"}
    </Badge>
  ) : (
    <Badge variant="outline" className="font-normal">
      Customer
    </Badge>
  );

const useDebounced = <T,>(value: T, ms = 300) => {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return v;
};

/**
 * A searchable, paged table of studio users with a details drawer. With
 * `source.update` / `source.remove` (super admin) the drawer can edit and
 * delete; without them (studio admin) it's read-only.
 */
export const UserDirectory = ({
  source,
  showStudio,
  noun = "users",
}: {
  source: DirectorySource;
  showStudio: boolean;
  noun?: string;
}) => {
  const [search, setSearch] = useState("");
  const [role, setRole] = useState<DirectoryRole | "">("");
  const [page, setPage] = useState(1);
  const [openId, setOpenId] = useState<string | null>(null);
  const q = useDebounced(search);

  useEffect(() => setPage(1), [q, role]);

  const { data, isLoading, isFetching } = useQuery({
    queryKey: [source.key, "list", q, role, page],
    queryFn: () => source.list({ search: q, role, page, pageSize: PAGE_SIZE }),
    placeholderData: keepPreviousData,
  });

  const cols = showStudio ? 6 : 5;

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name, email or phone"
            className="pl-9"
            aria-label={`Search ${noun}`}
          />
        </div>
        <div role="tablist" aria-label="Filter by role" className="inline-flex rounded-lg border bg-muted/40 p-1">
          {ROLE_FILTERS.map((f) => (
            <button
              key={f.label}
              role="tab"
              aria-selected={role === f.value}
              onClick={() => setRole(f.value)}
              className={cn(
                "rounded-md px-3 py-1.5 text-sm transition-colors",
                role === f.value ? "bg-background font-medium shadow-sm" : "text-muted-foreground hover:text-foreground",
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <Card className="overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              {showStudio && <TableHead>Studio</TableHead>}
              <TableHead>Role</TableHead>
              <TableHead className="text-right">Bookings</TableHead>
              <TableHead className="text-right">Total spent</TableHead>
              <TableHead>Joined</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className={cn(isFetching && !isLoading && "opacity-60 transition-opacity")}>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={cols} className="py-12 text-center">
                  <Loader2 className="mx-auto h-6 w-6 animate-spin text-primary" />
                </TableCell>
              </TableRow>
            ) : !data?.items.length ? (
              <TableRow>
                <TableCell colSpan={cols} className="py-12 text-center text-muted-foreground">
                  {q || role ? "No one matches that search." : `No ${noun} yet.`}
                </TableCell>
              </TableRow>
            ) : (
              data.items.map((u) => (
                <TableRow
                  key={u.id}
                  className="cursor-pointer"
                  onClick={() => setOpenId(u.id)}
                  onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && (e.preventDefault(), setOpenId(u.id))}
                  tabIndex={0}
                  aria-label={`Open ${u.fullName || u.email}`}
                >
                  <TableCell>
                    <p className="font-medium">{u.fullName || "No name"}</p>
                    <p className="text-xs text-muted-foreground">{u.email}</p>
                  </TableCell>
                  {showStudio && (
                    <TableCell>
                      {u.studio ? (
                        <>
                          <p>{u.studio.name}</p>
                          <p className="text-xs text-muted-foreground">/{u.studio.slug}</p>
                        </>
                      ) : (
                        "—"
                      )}
                    </TableCell>
                  )}
                  <TableCell>
                    <RoleBadge role={u.role} isOwner={u.isOwner} />
                  </TableCell>
                  <TableCell className="text-right tabular-nums">{u.bookings}</TableCell>
                  <TableCell className="text-right tabular-nums">{formatGHS(u.totalSpent)}</TableCell>
                  <TableCell className="whitespace-nowrap text-muted-foreground">
                    {format(parseISO(u.createdAt), "d MMM yyyy")}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        {data && (
          <TablePagination
            page={data.page}
            pageSize={data.pageSize}
            total={data.total}
            onPageChange={setPage}
            noun={noun}
          />
        )}
      </Card>

      <UserSheet source={source} id={openId} showStudio={showStudio} onClose={() => setOpenId(null)} />
    </div>
  );
};

// ---- the drawer --------------------------------------------------------------

const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className="flex justify-between gap-4 py-2 text-sm">
    <dt className="text-muted-foreground">{label}</dt>
    <dd className="min-w-0 text-right">{children}</dd>
  </div>
);

const UserSheet = ({
  source,
  id,
  showStudio,
  onClose,
}: {
  source: DirectorySource;
  id: string | null;
  showStudio: boolean;
  onClose: () => void;
}) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const editable = Boolean(source.update);
  const ids = useId();
  const [form, setForm] = useState({ fullName: "", phone: "", location: "", email: "" });
  const [confirmDelete, setConfirmDelete] = useState(false);

  const { data: user, isLoading } = useQuery({
    queryKey: [source.key, "detail", id],
    queryFn: () => source.detail(id!),
    enabled: Boolean(id),
  });

  useEffect(() => {
    if (user) {
      setForm({
        fullName: user.fullName ?? "",
        phone: user.phone ?? "",
        location: user.location ?? "",
        email: user.email,
      });
    }
  }, [user]);

  const save = useMutation({
    mutationFn: () => {
      const patch = {
        ...(form.fullName.trim() !== (user!.fullName ?? "") ? { fullName: form.fullName.trim() || null } : {}),
        ...(form.phone.trim() !== (user!.phone ?? "") ? { phone: form.phone.trim() || null } : {}),
        ...(form.location.trim() !== (user!.location ?? "") ? { location: form.location.trim() || null } : {}),
        ...(form.email.trim().toLowerCase() !== user!.email ? { email: form.email.trim() } : {}),
      };
      return source.update!(user!.id, patch);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [source.key] });
      toast({ title: "Changes saved" });
    },
    onError: (e) => toast({ variant: "destructive", title: "Couldn't save", description: e.message }),
  });

  const remove = useMutation({
    mutationFn: () => source.remove!(user!.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [source.key] });
      setConfirmDelete(false);
      onClose();
      toast({ title: "User deleted" });
    },
    onError: (e) => {
      setConfirmDelete(false);
      toast({ variant: "destructive", title: "Couldn't delete", description: e.message });
    },
  });

  const dirty =
    user &&
    (form.fullName.trim() !== (user.fullName ?? "") ||
      form.phone.trim() !== (user.phone ?? "") ||
      form.location.trim() !== (user.location ?? "") ||
      form.email.trim().toLowerCase() !== user.email);

  return (
    <>
      <Sheet open={Boolean(id)} onOpenChange={(o) => !o && onClose()}>
        <SheetContent side="right" className="flex w-full flex-col gap-0 p-0 sm:max-w-md">
          {isLoading || !user ? (
            <div className="flex flex-1 items-center justify-center">
              <SheetTitle className="sr-only">Loading user</SheetTitle>
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : (
            <>
              <SheetHeader className="border-b px-6 py-5 text-left">
                <div className="flex items-center gap-3">
                  {user.avatar ? (
                    <img src={user.avatar} alt="" className="h-12 w-12 rounded-full object-cover" />
                  ) : (
                    <span className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                      <UserRound className="h-6 w-6" aria-hidden />
                    </span>
                  )}
                  <div className="min-w-0">
                    <SheetTitle className="truncate">{user.fullName || "No name"}</SheetTitle>
                    <SheetDescription className="truncate">{user.email}</SheetDescription>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 pt-2">
                  <RoleBadge role={user.role} isOwner={user.isOwner} />
                  {showStudio && user.studio && <Badge variant="outline">{user.studio.name}</Badge>}
                </div>
              </SheetHeader>

              <div className="flex-1 space-y-6 overflow-y-auto px-6 py-5">
                {/* At a glance */}
                <div className="grid grid-cols-3 gap-3 text-center">
                  {[
                    ["Bookings", String(user.bookings)],
                    ["Orders", String(user.orders)],
                    ["Spent", formatGHS(user.totalSpent)],
                  ].map(([label, value]) => (
                    <div key={label} className="rounded-lg border bg-muted/30 px-2 py-3">
                      <p className="text-lg font-semibold tabular-nums">{value}</p>
                      <p className="text-xs text-muted-foreground">{label}</p>
                    </div>
                  ))}
                </div>

                {/* Details: editable for the super admin */}
                {editable ? (
                  <form
                    className="space-y-4"
                    onSubmit={(e) => {
                      e.preventDefault();
                      if (dirty) save.mutate();
                    }}
                  >
                    {(
                      [
                        ["fullName", "Name", "text"],
                        ["email", "Email", "email"],
                        ["phone", "Phone", "tel"],
                        ["location", "Location", "text"],
                      ] as const
                    ).map(([key, label, type]) => (
                      <div key={key} className="space-y-1.5">
                        <Label htmlFor={`${ids}-${key}`}>{label}</Label>
                        <Input
                          id={`${ids}-${key}`}
                          type={type}
                          value={form[key]}
                          onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                        />
                      </div>
                    ))}
                    <Button type="submit" disabled={!dirty || save.isPending} className="w-full">
                      {save.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Save changes
                    </Button>
                  </form>
                ) : (
                  <dl className="divide-y">
                    <Field label="Phone">{user.phone || "—"}</Field>
                    <Field label="Location">{user.location || "—"}</Field>
                  </dl>
                )}

                <dl className="divide-y">
                  <Field label="Joined">{format(parseISO(user.createdAt), "d MMM yyyy")}</Field>
                  {user.role === "CUSTOMER" && (
                    <>
                      <Field label="Loyalty points">
                        {user.loyaltyPoints.toLocaleString()} (earned {user.lifetimePoints.toLocaleString()})
                      </Field>
                      <Field label="Referral code">
                        {user.referralCode ? `${user.referralCode} · used ${user.referralUses}×` : "—"}
                      </Field>
                    </>
                  )}
                </dl>

                {user.recentAppointments.length > 0 && (
                  <section>
                    <h3 className="mb-2 text-sm font-semibold">Recent bookings</h3>
                    <ul className="divide-y rounded-md border text-sm">
                      {user.recentAppointments.map((a) => (
                        <li key={a.id} className="flex items-center justify-between gap-3 px-3 py-2">
                          <div className="min-w-0">
                            <p className="truncate font-medium">{a.service ?? "Appointment"}</p>
                            <p className="text-xs text-muted-foreground">
                              {format(parseISO(a.date), "d MMM yyyy")} · {a.time}
                            </p>
                          </div>
                          <Badge variant="outline" className="shrink-0 font-normal capitalize">
                            {a.status.toLowerCase().replace("_", " ")}
                          </Badge>
                        </li>
                      ))}
                    </ul>
                  </section>
                )}

                {user.recentOrders.length > 0 && (
                  <section>
                    <h3 className="mb-2 text-sm font-semibold">Recent orders</h3>
                    <ul className="divide-y rounded-md border text-sm">
                      {user.recentOrders.map((o) => (
                        <li key={o.id} className="flex items-center justify-between gap-3 px-3 py-2">
                          <div>
                            <p className="font-medium">{o.orderNumber}</p>
                            <p className="text-xs text-muted-foreground">
                              {format(parseISO(o.createdAt), "d MMM yyyy")}
                            </p>
                          </div>
                          <span className="tabular-nums">{formatGHS(o.total)}</span>
                        </li>
                      ))}
                    </ul>
                  </section>
                )}

                {!editable && (
                  <p className="rounded-md bg-muted/50 px-3 py-2.5 text-xs text-muted-foreground">
                    Customers manage their own details from their account. To change or remove an
                    account, contact Zuri Studios support.
                  </p>
                )}
              </div>

              {source.remove && (
                <SheetFooter className="border-t px-6 py-4">
                  <Button
                    variant="ghost"
                    className="w-full text-destructive hover:bg-destructive/10 hover:text-destructive"
                    disabled={user.isOwner}
                    title={user.isOwner ? "The studio's owner can't be deleted here" : undefined}
                    onClick={() => setConfirmDelete(true)}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    {user.isOwner ? "Owner accounts can't be deleted" : "Delete user"}
                  </Button>
                </SheetFooter>
              )}
            </>
          )}
        </SheetContent>
      </Sheet>

      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {user?.fullName || user?.email}?</AlertDialogTitle>
            <AlertDialogDescription>
              They'll be signed out and can no longer sign in. Their bookings and orders stay on
              the studio's records; their profile, reviews and loyalty points are removed. This
              can't be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                remove.mutate();
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {remove.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete user
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
