import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Bell, BellOff, Loader2, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Panel } from "@/components/dashboard/KpiTile";
import { useToast } from "@/hooks/use-toast";
import { API_URL, studioStore } from "@/lib/apiClient";
import { keyBytes, platform, swRegistration } from "@/lib/pwa";
import { openInstallGuide } from "./InstallApp";
import { securityRequest, type PushConfig, type SecurityClient } from "./securityApi";

type State = "loading" | "unsupported" | "install-first" | "blocked" | "off" | "on";

/**
 * Where the service worker re-sends a rotated subscription (it can't read the
 * app's settings itself). Kept in the worker's cache.
 */
const rememberEndpoint = async (client: SecurityClient) => {
  const slug = studioStore.getSlug();
  const saved = JSON.stringify({
    url: `${API_URL}${client === "platform" ? "/platform" : ""}/push/subscriptions`,
    headers: { "X-Zuri-Client": "web", ...(slug && client === "studio" ? { "X-Studio-Slug": slug } : {}) },
  });
  const cache = await caches.open("zuri-v1-meta");
  await cache.put("/push-endpoint", new Response(saved));
};

/** Push notifications on this device: bookings, orders and payments as they happen. */
export const NotificationsCard = ({ client, description }: { client: SecurityClient; description: string }) => {
  const qc = useQueryClient();
  const { toast } = useToast();
  const base = "/push";
  const key = ["push-config", client];
  const cfg = useQuery({ queryKey: key, queryFn: () => securityRequest<PushConfig>(client, base) });
  const [state, setState] = useState<State>("loading");

  const refresh = async () => {
    const p = platform();
    if (p.ios && !p.standalone) return setState("install-first");
    if (!("PushManager" in window) || !("Notification" in window) || !("serviceWorker" in navigator)) return setState("unsupported");
    if (Notification.permission === "denied") return setState("blocked");
    const reg = await swRegistration();
    const sub = await reg?.pushManager.getSubscription();
    setState(sub ? "on" : "off");
  };
  useEffect(() => {
    void refresh();
  }, []);

  const fail = (e: unknown) => toast({ variant: "destructive", title: e instanceof Error ? e.message : "Something went wrong" });

  const enable = useMutation({
    mutationFn: async () => {
      const publicKey = cfg.data?.publicKey;
      if (!publicKey) throw new Error("Notifications aren't set up on the server yet.");
      const reg = await swRegistration();
      if (!reg) throw new Error("Notifications work on the live site or the installed app, not in local development.");
      const permission = await Notification.requestPermission();
      if (permission !== "granted")
        throw new Error(permission === "denied" ? "Notifications are blocked. Allow them in your browser or phone settings." : "Permission wasn't given.");
      const sub =
        (await reg.pushManager.getSubscription()) ??
        (await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: keyBytes(publicKey) }));
      await securityRequest(client, `${base}/subscriptions`, "POST", sub.toJSON());
      await rememberEndpoint(client).catch(() => undefined);
    },
    onSuccess: async () => {
      toast({ title: "Notifications are on for this device" });
      await refresh();
      void qc.invalidateQueries({ queryKey: key });
    },
    onError: async (e) => {
      fail(e);
      await refresh();
    },
  });
  const disable = useMutation({
    mutationFn: async () => {
      const sub = await (await swRegistration())?.pushManager.getSubscription();
      if (sub) {
        await securityRequest(client, `${base}/subscriptions`, "DELETE", { endpoint: sub.endpoint });
        await sub.unsubscribe();
      }
    },
    onSuccess: async () => {
      toast({ title: "Notifications are off for this device" });
      await refresh();
      void qc.invalidateQueries({ queryKey: key });
    },
    onError: fail,
  });
  const test = useMutation({
    mutationFn: () => securityRequest(client, `${base}/test`, "POST"),
    onSuccess: () => toast({ title: "Test sent", description: "It should arrive in a few seconds." }),
    onError: fail,
  });

  const c = cfg.data;
  return (
    <Panel>
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Bell className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="font-semibold text-foreground">Notifications</h2>
            {state === "on" && (
              <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:text-emerald-400">
                On for this device
              </span>
            )}
          </div>
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        </div>
      </div>

      <div className="mt-4 text-sm">
        {cfg.isLoading || state === "loading" ? (
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        ) : c && !c.publicKey ? (
          <p className="rounded-lg bg-muted p-3 text-muted-foreground">Notifications aren't set up on the server yet.</p>
        ) : state === "install-first" ? (
          <div className="space-y-2 rounded-lg bg-muted p-3">
            <p>On iPhone and iPad, notifications only work in the installed app.</p>
            <Button size="sm" variant="outline" onClick={openInstallGuide}>
              How to install
            </Button>
            <p className="text-xs text-muted-foreground">Then open the app from your Home Screen and turn notifications on here.</p>
          </div>
        ) : state === "unsupported" ? (
          <p className="rounded-lg bg-muted p-3 text-muted-foreground">
            This browser doesn't support notifications. Try Chrome, Edge, Firefox or Safari, or install the app.
          </p>
        ) : state === "blocked" ? (
          <p className="rounded-lg bg-muted p-3">
            Notifications are blocked for this site. Allow them in your browser's site settings (or Settings → Notifications on your phone), then reload.
          </p>
        ) : state === "on" ? (
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="outline" disabled={test.isPending} onClick={() => test.mutate()}>
              <Send className="mr-2 h-4 w-4" /> Send a test
            </Button>
            <Button size="sm" variant="ghost" disabled={disable.isPending} onClick={() => disable.mutate()}>
              <BellOff className="mr-2 h-4 w-4" /> Turn off on this device
            </Button>
          </div>
        ) : (
          <Button disabled={!c || enable.isPending} onClick={() => enable.mutate()}>
            {enable.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Bell className="mr-2 h-4 w-4" />}
            Turn on notifications
          </Button>
        )}
      </div>
    </Panel>
  );
};
