// Backwards-compatible re-export. Real implementation lives in useAppPrefs.
import { AppPrefsProvider, useAppPrefs, type ClockDensity } from "./useAppPrefs";

export type { ClockDensity };
export const ClockDensityProvider = AppPrefsProvider;

export function useClockDensity() {
  const { density, setDensity } = useAppPrefs();
  return { density, setDensity };
}
