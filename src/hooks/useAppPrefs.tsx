// App-wide preferences: clock density, time format (12h/24h), timezone, notifications.
// Persisted to localStorage with cross-tab + in-tab sync.
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";

export type ClockDensity = "compact" | "roomy";
export type TimeFormat = "12h" | "24h";

export interface AppPrefs {
  density: ClockDensity;
  timeFormat: TimeFormat;
  /** IANA timezone, e.g. "Asia/Karachi". "auto" = use the browser's. */
  timezone: string;
  notificationsEnabled: boolean;
}

const STORAGE_KEY = "studyflow.appPrefs";
const EVENT = "studyflow:appPrefs";

const browserTz = () => {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  } catch {
    return "UTC";
  }
};

const DEFAULTS = (): AppPrefs => ({
  density: "compact",
  timeFormat: "12h",
  timezone: browserTz(),
  notificationsEnabled: false,
});

function read(): AppPrefs {
  if (typeof window === "undefined") return DEFAULTS();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<AppPrefs>;
      return { ...DEFAULTS(), ...parsed };
    }
    // Legacy migration from old clockDensity key
    const legacy = localStorage.getItem("studyflow.clockDensity");
    if (legacy === "roomy" || legacy === "compact") {
      return { ...DEFAULTS(), density: legacy };
    }
  } catch {
    /* ignore */
  }
  return DEFAULTS();
}

interface Ctx extends AppPrefs {
  setDensity: (d: ClockDensity) => void;
  setTimeFormat: (f: TimeFormat) => void;
  setTimezone: (tz: string) => void;
  setNotificationsEnabled: (v: boolean) => Promise<void> | void;
  resetToBrowserTimezone: () => void;
}

const AppPrefsContext = createContext<Ctx | null>(null);

export function AppPrefsProvider({ children }: { children: ReactNode }) {
  const [prefs, setPrefs] = useState<AppPrefs>(read);

  useEffect(() => {
    const onChange = () => setPrefs(read());
    window.addEventListener("storage", onChange);
    window.addEventListener(EVENT, onChange);
    return () => {
      window.removeEventListener("storage", onChange);
      window.removeEventListener(EVENT, onChange);
    };
  }, []);

  const persist = useCallback((next: AppPrefs) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    setPrefs(next);
    window.dispatchEvent(new Event(EVENT));
  }, []);

  const setDensity = (density: ClockDensity) => persist({ ...read(), density });
  const setTimeFormat = (timeFormat: TimeFormat) => persist({ ...read(), timeFormat });
  const setTimezone = (timezone: string) => persist({ ...read(), timezone: timezone || browserTz() });
  const resetToBrowserTimezone = () => persist({ ...read(), timezone: browserTz() });

  const setNotificationsEnabled = async (v: boolean) => {
    if (v && typeof Notification !== "undefined") {
      try {
        if (Notification.permission === "default") {
          const r = await Notification.requestPermission();
          if (r !== "granted") {
            persist({ ...read(), notificationsEnabled: false });
            return;
          }
        } else if (Notification.permission === "denied") {
          persist({ ...read(), notificationsEnabled: false });
          throw new Error("Notifications are blocked in your browser settings.");
        }
      } catch (err) {
        persist({ ...read(), notificationsEnabled: false });
        throw err;
      }
    }
    persist({ ...read(), notificationsEnabled: v });
  };

  return (
    <AppPrefsContext.Provider
      value={{
        ...prefs,
        setDensity,
        setTimeFormat,
        setTimezone,
        setNotificationsEnabled,
        resetToBrowserTimezone,
      }}
    >
      {children}
    </AppPrefsContext.Provider>
  );
}

export function useAppPrefs() {
  const ctx = useContext(AppPrefsContext);
  if (!ctx) throw new Error("useAppPrefs must be used inside AppPrefsProvider");
  return ctx;
}

/**
 * Format a Date according to the user's saved time + timezone preferences.
 */
export function formatTime(date: Date, prefs: Pick<AppPrefs, "timeFormat" | "timezone">) {
  return date.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    hour12: prefs.timeFormat === "12h",
    timeZone: prefs.timezone || undefined,
  });
}

export function formatDate(date: Date, prefs: Pick<AppPrefs, "timezone">) {
  return date.toLocaleDateString([], {
    weekday: "short",
    month: "short",
    day: "numeric",
    timeZone: prefs.timezone || undefined,
  });
}

/** A handful of common IANA zones. Users can pick "auto" to follow the browser. */
export const COMMON_TIMEZONES = [
  "UTC",
  "America/Los_Angeles",
  "America/Denver",
  "America/Chicago",
  "America/New_York",
  "America/Sao_Paulo",
  "Europe/London",
  "Europe/Berlin",
  "Europe/Istanbul",
  "Africa/Cairo",
  "Asia/Dubai",
  "Asia/Karachi",
  "Asia/Kolkata",
  "Asia/Dhaka",
  "Asia/Bangkok",
  "Asia/Singapore",
  "Asia/Shanghai",
  "Asia/Tokyo",
  "Australia/Sydney",
  "Pacific/Auckland",
];
