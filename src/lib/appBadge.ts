// The number on the installed app's icon (home screen on iPhone and Android,
// the taskbar on desktop), like WhatsApp's. It follows the unread count in the
// notification bell. Not every browser supports it, so it never gets in the way.
type BadgeNav = Navigator & { setAppBadge?: (n?: number) => Promise<void>; clearAppBadge?: () => Promise<void> };

export const setAppBadge = (unread: number) => {
  const nav = navigator as BadgeNav;
  if (!nav.setAppBadge) return;
  void (unread > 0 ? nav.setAppBadge(unread) : nav.clearAppBadge?.())?.catch(() => undefined);
};

export const clearAppBadge = () => setAppBadge(0);
