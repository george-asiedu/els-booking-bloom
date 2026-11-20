import { useEffect, useState } from "react";
import { setAppBadge } from "@/lib/appBadge";
import { useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { Bell, CheckCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { securityRequest, type SecurityClient } from "./securityApi";

interface InboxItem {
  id: string;
  title: string;
  body: string;
  url: string;
  readAt: string | null;
  createdAt: string;
}

/**
 * The bell in the dashboard header: everything sent as a push, kept here
 * whether or not push is on. Unread ones show a count; opening an item goes
 * where its push would have gone.
 */
export const NotificationBell = ({ client }: { client: SecurityClient }) => {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const key = ["inbox", client];
  const { data } = useQuery({
    queryKey: key,
    queryFn: () => securityRequest<{ data: InboxItem[]; unread: number }>(client, "/inbox"),
    refetchInterval: 60_000,
    refetchOnWindowFocus: true,
  });
  const read = useMutation({
    mutationFn: (ids?: string[]) => securityRequest(client, "/inbox/read", "POST", ids ? { ids } : {}),
    onSuccess: () => qc.invalidateQueries({ queryKey: key }),
  });

  const items = data?.data ?? [];
  const unread = data?.unread ?? 0;
  // Keep the number on the installed app's icon in step with the bell.
  useEffect(() => {
    if (data) setAppBadge(data.unread);
  }, [data]);

  const openItem = (n: InboxItem) => {
    if (!n.readAt) read.mutate([n.id]);
    setOpen(false);
    navigate(n.url);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative" aria-label={unread ? `Notifications, ${unread} unread` : "Notifications"}>
          <Bell className="h-5 w-5" />
          {unread > 0 && (
            <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-semibold tabular-nums text-white">
              {unread > 9 ? "9+" : unread}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[22rem] max-w-[calc(100vw-2rem)] p-0">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <p className="text-sm font-semibold">Notifications</p>
          {unread > 0 && (
            <button
              type="button"
              onClick={() => read.mutate(undefined)}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
            >
              <CheckCheck className="h-3.5 w-3.5" /> Mark all as read
            </button>
          )}
        </div>
        {items.length === 0 ? (
          <div className="flex flex-col items-center px-6 py-10 text-center text-muted-foreground">
            <Bell className="mb-2 h-8 w-8" />
            <p className="text-sm">No notifications yet</p>
            <p className="mt-1 text-xs">Bookings, orders and reminders will appear here.</p>
          </div>
        ) : (
          <ul className="max-h-[26rem] divide-y divide-border overflow-y-auto">
            {items.map((n) => (
              <li key={n.id}>
                <button
                  type="button"
                  onClick={() => openItem(n)}
                  className={cn("flex w-full gap-3 px-4 py-3 text-left transition-colors hover:bg-accent", !n.readAt && "bg-primary/5")}
                >
                  <span className={cn("mt-1.5 h-2 w-2 shrink-0 rounded-full", n.readAt ? "bg-transparent" : "bg-primary")} aria-hidden />
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-medium">{n.title}</span>
                    <span className="mt-0.5 block text-sm text-muted-foreground">{n.body}</span>
                    <span className="mt-1 block text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                    </span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </PopoverContent>
    </Popover>
  );
};
