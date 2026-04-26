// Clock density preference — "compact" or "roomy". Persisted to localStorage with cross-tab/in-tab sync.
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type ClockDensity = "compact" | "roomy";

const STORAGE_KEY = "studyflow.clockDensity";
const EVENT = "studyflow:clockDensity";

interface Ctx {
  density: ClockDensity;
  setDensity: (d: ClockDensity) => void;
}

const ClockDensityContext = createContext<Ctx | null>(null);

function read(): ClockDensity {
  if (typeof window === "undefined") return "compact";
  const v = localStorage.getItem(STORAGE_KEY);
  return v === "roomy" ? "roomy" : "compact";
}

export function ClockDensityProvider({ children }: { children: ReactNode }) {
  const [density, setDensityState] = useState<ClockDensity>(read);

  useEffect(() => {
    const onChange = () => setDensityState(read());
    window.addEventListener("storage", onChange);
    window.addEventListener(EVENT, onChange);
    return () => {
      window.removeEventListener("storage", onChange);
      window.removeEventListener(EVENT, onChange);
    };
  }, []);

  const setDensity = (d: ClockDensity) => {
    localStorage.setItem(STORAGE_KEY, d);
    setDensityState(d);
    window.dispatchEvent(new Event(EVENT));
  };

  return <ClockDensityContext.Provider value={{ density, setDensity }}>{children}</ClockDensityContext.Provider>;
}

export function useClockDensity() {
  const ctx = useContext(ClockDensityContext);
  if (!ctx) throw new Error("useClockDensity must be used inside ClockDensityProvider");
  return ctx;
}
