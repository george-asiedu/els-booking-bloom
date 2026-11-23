import { useEffect, useState, type ReactNode } from "react";
import { Download, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useStudio } from "@/hooks/useStudio";
import { studioStore } from "@/lib/apiClient";
import { PLATFORM } from "@/config/platform";
import { canPromptInstall, INSTALLABLE_EVENT, installApp, OPEN_INSTALL_EVENT, platform, type Platform } from "@/lib/pwa";

/** Open the install guide from anywhere (e.g. the notifications card). */
export const openInstallGuide = () => window.dispatchEvent(new Event(OPEN_INSTALL_EVENT));

/** The name the app installs under: the studio's on its site, else the platform's. */
const useAppName = () => {
  const { name } = useStudio();
  return studioStore.getSlug() ? name : PLATFORM.name;
};

const ShareIcon = () => (
  // The iOS Share glyph: a square with an arrow pointing up.
  <svg viewBox="0 0 24 24" className="inline h-5 w-5 align-[-4px] text-[#0a84ff]" fill="none" stroke="currentColor" strokeWidth={2} aria-label="Share">
    <path d="M12 3v12M8 7l4-4 4 4" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M7 11H6a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-6a2 2 0 0 0-2-2h-1" strokeLinecap="round" />
  </svg>
);

const Steps = ({ items }: { items: ReactNode[] }) => (
  <ol className="space-y-3 text-sm">
    {items.map((t, i) => (
      <li key={i} className="flex gap-3">
        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/15 text-xs font-semibold text-foreground">{i + 1}</span>
        <span className="pt-0.5">{t}</span>
      </li>
    ))}
  </ol>
);

/**
 * Step-by-step install help, mounted once for the whole app. iPhones and iPads
 * have no install prompt, only "Add to Home Screen" from Safari's Share menu.
 */
export const InstallGuide = () => {
  const appName = useAppName();
  const [open, setOpen] = useState(false);
  const [p, setP] = useState<Platform | null>(null);
  useEffect(() => {
    const onOpen = () => {
      setP(platform());
      setOpen(true);
    };
    window.addEventListener(OPEN_INSTALL_EVENT, onOpen);
    return () => window.removeEventListener(OPEN_INSTALL_EVENT, onOpen);
  }, []);
  if (!p) return null;

  const copy = () =>
    navigator.clipboard.writeText(window.location.origin).then(
      () => toast.success("Link copied. Paste it into Safari."),
      () => toast.error("Couldn't copy. Type the address into Safari instead."),
    );
  let body: ReactNode;
  if (p.standalone) body = <p className="text-sm">You're already using the installed app.</p>;
  else if (p.ios && (p.inApp || p.iosBrowser === "other"))
    body = (
      <div className="space-y-4">
        <p className="text-sm">This browser can't add apps to the Home Screen. Open this site in Safari instead:</p>
        <Steps items={["Copy the link below.", "Open Safari and paste it into the address bar.", <>Tap <ShareIcon />, then <b>Add to Home Screen</b>.</>]} />
        <Button onClick={copy}>Copy link</Button>
      </div>
    );
  else if (p.ios && p.iosBrowser === "chrome")
    body = (
      <Steps
        items={[
          <>Tap <ShareIcon /> in the address bar (top right).</>,
          <>Scroll down and tap <b>Add to Home Screen</b>.</>,
          <>Tap <b>Add</b>. {appName} appears on your Home Screen.</>,
        ]}
      />
    );
  else if (p.ios)
    body = (
      <Steps
        items={[
          <>Tap <ShareIcon /> at the bottom of Safari (on iPad: top right).</>,
          <>Scroll down the menu and tap <b>Add to Home Screen</b>.</>,
          <>Keep <b>Open as Web App</b> on (if shown), then tap <b>Add</b>.</>,
          <>Open {appName} from your Home Screen and sign in once.</>,
        ]}
      />
    );
  else
    body = (
      <Steps
        items={[
          <>Open the browser menu (<b>⋮</b> in Chrome), or the install icon in the address bar on a computer.</>,
          <>Tap <b>Install app</b> or <b>Add to Home screen</b>.</>,
          <>Confirm with <b>Install</b>.</>,
        ]}
      />
    );
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Install {appName}</DialogTitle>
          <DialogDescription>Add it to your Home Screen to open it like an app.</DialogDescription>
        </DialogHeader>
        {body}
      </DialogContent>
    </Dialog>
  );
};

const DISMISSED_KEY = "zuri-install-dismissed";

/** "Install the app" strip for dashboards. Hidden once installed or dismissed. */
export const InstallBanner = () => {
  const appName = useAppName();
  const [show, setShow] = useState(false);
  const [canPrompt, setCanPrompt] = useState(canPromptInstall());

  useEffect(() => {
    const p = platform();
    let dismissed = false;
    try {
      dismissed = localStorage.getItem(DISMISSED_KEY) === "1";
    } catch {
      /* private mode */
    }
    if (dismissed || p.standalone) return;
    if (p.ios || p.android || canPromptInstall()) setShow(true);
    const onInstallable = () => {
      setCanPrompt(true);
      setShow(true);
    };
    window.addEventListener(INSTALLABLE_EVENT, onInstallable);
    return () => window.removeEventListener(INSTALLABLE_EVENT, onInstallable);
  }, []);

  const dismiss = () => {
    setShow(false);
    try {
      localStorage.setItem(DISMISSED_KEY, "1");
    } catch {
      /* ignore */
    }
  };

  if (!show) return null;
  return (
    <div className="flex items-center gap-3 border-b border-border bg-primary/10 px-4 py-2.5 text-sm md:px-6">
      <Download className="h-5 w-5 shrink-0 text-foreground/70" />
      <p className="min-w-0 flex-1">Install {appName} on this device to open it like an app and get notifications.</p>
      <Button size="sm" onClick={() => void installApp(appName)}>
        {canPrompt ? "Install" : "How to install"}
      </Button>
      <button type="button" onClick={dismiss} className="rounded p-1 text-muted-foreground hover:bg-accent" aria-label="Dismiss">
        <X className="h-4 w-4" />
      </button>
    </div>
  );
};
