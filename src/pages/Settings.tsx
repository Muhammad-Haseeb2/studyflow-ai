// Settings page — theme + clock density (Appearance section).
import { motion } from "framer-motion";
import { Moon, Sun, Monitor, Clock } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { useTheme } from "@/components/ThemeProvider";
import { useClockDensity, type ClockDensity } from "@/hooks/useClockDensity";
import { cn } from "@/lib/utils";

const themeOptions = [
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
  { value: "system", label: "System", icon: Monitor },
] as const;

export default function Settings() {
  const { theme, setTheme } = useTheme();
  const { density, setDensity } = useClockDensity();

  const now = new Date();
  const timeStr = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  const dateStr = now.toLocaleDateString([], { weekday: "short", month: "short", day: "numeric" });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground">Customize your Studyflow experience.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Appearance</CardTitle>
          <CardDescription>Theme and header clock styling.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
          {/* Theme */}
          <section className="space-y-3">
            <Label className="text-sm font-semibold">Theme</Label>
            <RadioGroup
              value={theme}
              onValueChange={(v) => setTheme(v as typeof theme)}
              className="grid grid-cols-1 gap-3 sm:grid-cols-3"
            >
              {themeOptions.map((opt) => {
                const Icon = opt.icon;
                const active = theme === opt.value;
                return (
                  <Label
                    key={opt.value}
                    htmlFor={`theme-${opt.value}`}
                    className={cn(
                      "flex cursor-pointer items-center gap-3 rounded-xl border-2 p-4 transition-all",
                      active ? "border-primary bg-primary/5 shadow-sm" : "border-border hover:border-primary/40"
                    )}
                  >
                    <RadioGroupItem id={`theme-${opt.value}`} value={opt.value} className="sr-only" />
                    <div
                      className={cn(
                        "flex h-9 w-9 items-center justify-center rounded-lg",
                        active ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                      )}
                    >
                      <Icon className="h-4 w-4" />
                    </div>
                    <span className="font-medium">{opt.label}</span>
                  </Label>
                );
              })}
            </RadioGroup>
          </section>

          {/* Clock density */}
          <section className="space-y-3">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <Label className="text-sm font-semibold">Header clock</Label>
            </div>
            <p className="text-xs text-muted-foreground">
              Choose how the time and date appear in the top bar.
            </p>
            <RadioGroup
              value={density}
              onValueChange={(v) => setDensity(v as ClockDensity)}
              className="grid grid-cols-1 gap-3 sm:grid-cols-2"
            >
              {(["compact", "roomy"] as ClockDensity[]).map((mode) => {
                const active = density === mode;
                return (
                  <Label
                    key={mode}
                    htmlFor={`density-${mode}`}
                    className={cn(
                      "flex cursor-pointer flex-col gap-3 rounded-xl border-2 p-4 transition-all",
                      active ? "border-primary bg-primary/5 shadow-sm" : "border-border hover:border-primary/40"
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium capitalize">{mode}</span>
                      <RadioGroupItem id={`density-${mode}`} value={mode} />
                    </div>
                    {/* Live preview */}
                    <motion.div
                      layout
                      transition={{ type: "spring", stiffness: 300, damping: 28 }}
                      className={cn(
                        "flex items-center gap-2 self-start rounded-full border border-border/50 bg-muted/40 text-foreground",
                        mode === "compact" ? "px-2.5 py-0.5 text-[11px]" : "px-4 py-1.5 text-sm"
                      )}
                    >
                      <span className="font-mono font-semibold tabular-nums">{timeStr}</span>
                      <span className={cn("w-px bg-border", mode === "compact" ? "h-2.5" : "h-3.5")} />
                      <span className="text-muted-foreground">{dateStr}</span>
                    </motion.div>
                    <p className="text-xs text-muted-foreground">
                      {mode === "compact" ? "Smaller pill, leaves more room for the page title." : "Larger, easier to read at a glance."}
                    </p>
                  </Label>
                );
              })}
            </RadioGroup>
          </section>
        </CardContent>
      </Card>
    </div>
  );
}
