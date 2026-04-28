// Settings page — profile, theme, clock density, time/timezone prefs, notifications.
import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Moon, Sun, Monitor, Clock, Camera, Loader2, Trash2, Globe, Bell, BellOff, RotateCcw } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useTheme } from "@/components/ThemeProvider";
import {
  useAppPrefs,
  formatTime,
  formatDate,
  COMMON_TIMEZONES,
  type ClockDensity,
  type TimeFormat,
} from "@/hooks/useAppPrefs";
import { useProfile, useUpdateProfile, uploadAvatar } from "@/hooks/useProfile";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const themeOptions = [
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
  { value: "system", label: "System", icon: Monitor },
] as const;

const MAX_AVATAR_BYTES = 5 * 1024 * 1024;

const browserTz = (() => {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  } catch {
    return "UTC";
  }
})();

export default function Settings() {
  const { theme, setTheme } = useTheme();
  const prefs = useAppPrefs();
  const {
    density,
    setDensity,
    timeFormat,
    setTimeFormat,
    timezone,
    setTimezone,
    resetToBrowserTimezone,
    notificationsEnabled,
    setNotificationsEnabled,
  } = prefs;
  const { user } = useAuth();
  const { data: profile } = useProfile();
  const update = useUpdateProfile();
  const fileRef = useRef<HTMLInputElement>(null);
  const [displayName, setDisplayName] = useState("");
  const [uploading, setUploading] = useState(false);
  const [now, setNow] = useState(() => new Date());
  const [togglingNotif, setTogglingNotif] = useState(false);

  useEffect(() => {
    setDisplayName(profile?.display_name || "");
  }, [profile?.display_name]);

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const timeStr = formatTime(now, prefs);
  const dateStr = formatDate(now, prefs);

  // Build a sorted timezone list that always includes the browser one.
  const tzList = Array.from(new Set([browserTz, ...COMMON_TIMEZONES])).sort();

  const initials = (profile?.display_name || user?.email || "U")
    .split(/[\s@]/)
    .filter(Boolean)
    .map((s) => s[0]?.toUpperCase())
    .slice(0, 2)
    .join("");

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !user) return;
    if (!file.type.startsWith("image/")) return toast.error("Please choose an image file");
    if (file.size > MAX_AVATAR_BYTES) return toast.error("Image must be under 5MB");
    setUploading(true);
    try {
      const url = await uploadAvatar(user.id, file);
      await update.mutateAsync({ avatar_url: url });
      toast.success("Profile picture updated");
    } catch (err: any) {
      toast.error(err?.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const removeAvatar = async () => {
    if (!profile?.avatar_url) return;
    try {
      await update.mutateAsync({ avatar_url: null });
      toast.success("Profile picture removed");
    } catch (err: any) {
      toast.error(err?.message || "Couldn't remove picture");
    }
  };

  const saveName = async () => {
    if (!displayName.trim()) return toast.error("Name can't be empty");
    try {
      await update.mutateAsync({ display_name: displayName.trim() });
      toast.success("Name updated");
    } catch (err: any) {
      toast.error(err?.message || "Couldn't update name");
    }
  };

  const toggleNotifications = async (next: boolean) => {
    setTogglingNotif(true);
    try {
      await setNotificationsEnabled(next);
      if (next) toast.success("Notifications enabled");
      else toast("Notifications disabled");
    } catch (err: any) {
      toast.error(err?.message || "Couldn't update notifications");
    } finally {
      setTogglingNotif(false);
    }
  };

  const notificationStatus =
    typeof Notification !== "undefined" ? Notification.permission : "unsupported";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground">Customize your Studyflow experience.</p>
      </div>

      {/* Profile */}
      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
          <CardDescription>Your name and profile picture across the app.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="relative">
              <Avatar className="h-20 w-20 border-2 border-border shadow-soft">
                {profile?.avatar_url && <AvatarImage src={profile.avatar_url} alt="Profile" />}
                <AvatarFallback className="bg-gradient-to-br from-primary to-primary/60 text-primary-foreground text-xl">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
                aria-label="Upload profile picture"
                className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-md transition hover:bg-primary/90 disabled:opacity-60"
              >
                {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
              </button>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFile}
              />
            </div>
            <div className="flex-1 space-y-2">
              <p className="text-sm font-medium">{profile?.display_name || "Your name"}</p>
              <p className="text-xs text-muted-foreground">{user?.email}</p>
              <div className="flex flex-wrap gap-2">
                <Button size="sm" variant="outline" onClick={() => fileRef.current?.click()} disabled={uploading}>
                  <Camera className="mr-2 h-3.5 w-3.5" /> {profile?.avatar_url ? "Change picture" : "Upload picture"}
                </Button>
                {profile?.avatar_url && (
                  <Button size="sm" variant="ghost" className="text-destructive hover:bg-destructive/10" onClick={removeAvatar}>
                    <Trash2 className="mr-2 h-3.5 w-3.5" /> Remove
                  </Button>
                )}
              </div>
              <p className="text-[11px] text-muted-foreground">PNG, JPG or GIF. Max 5MB.</p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="display-name">Display name</Label>
            <div className="flex gap-2">
              <Input
                id="display-name"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                maxLength={100}
                placeholder="Your name"
              />
              <Button
                onClick={saveName}
                disabled={update.isPending || displayName === (profile?.display_name || "")}
              >
                Save
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Appearance */}
      <Card>
        <CardHeader>
          <CardTitle>Appearance</CardTitle>
          <CardDescription>Theme and header clock styling.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
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
                      {mode === "compact"
                        ? "Smaller pill, leaves more room for the page title."
                        : "Larger, easier to read at a glance."}
                    </p>
                  </Label>
                );
              })}
            </RadioGroup>
          </section>
        </CardContent>
      </Card>

      {/* Time & Region */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-4 w-4 text-muted-foreground" />
            Time & Region
          </CardTitle>
          <CardDescription>Used everywhere we display dates and times.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
          <section className="space-y-3">
            <Label className="text-sm font-semibold">Time format</Label>
            <RadioGroup
              value={timeFormat}
              onValueChange={(v) => setTimeFormat(v as TimeFormat)}
              className="grid grid-cols-2 gap-3"
            >
              {(["12h", "24h"] as TimeFormat[]).map((f) => {
                const active = timeFormat === f;
                const sample = formatTime(now, { timeFormat: f, timezone });
                return (
                  <Label
                    key={f}
                    htmlFor={`tf-${f}`}
                    className={cn(
                      "flex cursor-pointer flex-col items-start gap-1 rounded-xl border-2 p-4 transition-all",
                      active ? "border-primary bg-primary/5 shadow-sm" : "border-border hover:border-primary/40"
                    )}
                  >
                    <div className="flex w-full items-center justify-between">
                      <span className="font-medium">{f === "12h" ? "12-hour" : "24-hour"}</span>
                      <RadioGroupItem id={`tf-${f}`} value={f} />
                    </div>
                    <span className="font-mono text-2xl font-bold tabular-nums text-foreground">{sample}</span>
                    <span className="text-xs text-muted-foreground">
                      {f === "12h" ? "e.g. 2:30 PM" : "e.g. 14:30"}
                    </span>
                  </Label>
                );
              })}
            </RadioGroup>
          </section>

          <section className="space-y-3">
            <Label htmlFor="tz" className="text-sm font-semibold">Time zone</Label>
            <p className="text-xs text-muted-foreground">
              Auto-detected from your browser ({browserTz}). You can override it below.
            </p>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Select value={timezone} onValueChange={setTimezone}>
                <SelectTrigger id="tz" className="sm:max-w-xs">
                  <SelectValue placeholder="Pick a time zone" />
                </SelectTrigger>
                <SelectContent className="max-h-72">
                  {tzList.map((tz) => (
                    <SelectItem key={tz} value={tz}>
                      {tz} {tz === browserTz && <span className="ml-1 text-xs text-muted-foreground">(detected)</span>}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  resetToBrowserTimezone();
                  toast.success(`Reset to ${browserTz}`);
                }}
                disabled={timezone === browserTz}
              >
                <RotateCcw className="mr-2 h-3.5 w-3.5" /> Use detected
              </Button>
            </div>
          </section>
        </CardContent>
      </Card>

      {/* Notifications */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {notificationsEnabled ? (
              <Bell className="h-4 w-4 text-primary" />
            ) : (
              <BellOff className="h-4 w-4 text-muted-foreground" />
            )}
            Notifications
          </CardTitle>
          <CardDescription>Browser alerts for timer completions, calendar reminders, and study nudges.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between gap-4 rounded-xl border border-border/60 p-4">
            <div className="min-w-0">
              <p className="font-medium">Enable browser notifications</p>
              <p className="text-xs text-muted-foreground">
                {notificationStatus === "granted"
                  ? "Permission granted by your browser."
                  : notificationStatus === "denied"
                  ? "Blocked by your browser. Update site permissions to re-enable."
                  : notificationStatus === "unsupported"
                  ? "Your browser doesn't support notifications."
                  : "We'll ask for permission the first time you turn this on."}
              </p>
            </div>
            <Switch
              checked={notificationsEnabled}
              disabled={togglingNotif || notificationStatus === "unsupported" || notificationStatus === "denied"}
              onCheckedChange={toggleNotifications}
              aria-label="Enable notifications"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
