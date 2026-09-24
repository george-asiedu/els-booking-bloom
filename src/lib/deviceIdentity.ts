const DEVICE_ID_KEY = "els_device_id";
let inMemoryDeviceId: string | null = null;

/** Stable random browser-profile identifier used only for login alerts. */
export const getDeviceId = (): string => {
  try {
    const stored = localStorage.getItem(DEVICE_ID_KEY);
    if (stored && /^[a-f0-9-]{36}$/i.test(stored)) return stored;
    const created = crypto.randomUUID();
    localStorage.setItem(DEVICE_ID_KEY, created);
    return created;
  } catch {
    // Storage may be blocked in private/restricted contexts. Keep this page
    // session stable; a later visit may conservatively be treated as new.
    inMemoryDeviceId ??= crypto.randomUUID();
    return inMemoryDeviceId;
  }
};
