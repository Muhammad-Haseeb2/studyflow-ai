// Study Timer — Supabase-backed sessions, normal & Pomodoro with manual focus duration.
import { useEffect, useRef, useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Timer as TimerIcon, Play, Pause, RotateCcw, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { motion } from "framer-motion";
import { useStudySessions, useAddStudySession } from "@/lib/store";
import { useAppPrefs } from "@/hooks/useAppPrefs";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type Mode = "normal" | "pomodoro";
type Phase = "focus" | "break";

const FOCUS_PRESETS_MIN = [15, 25, 30, 45, 60];
const DEFAULT_FOCUS_MIN = 30;
const DEFAULT_BREAK_MIN = 5;
const MIN_FOCUS = 1;
const MAX_FOCUS = 180;

function fmt(sec: number) {
  const m = Math.floor(sec / 60).toString().padStart(2, "0");
  const s = (sec % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

function beep() {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.frequency.value = 660;
    o.connect(g);
    g.connect(ctx.destination);
    g.gain.setValueAtTime(0.001, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.3, ctx.currentTime + 0.02);
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
    o.start();
    o.stop(ctx.currentTime + 0.5);
  } catch {
    /* ignore */
  }
}

function notify(title: string, body: string) {
  try {
    if (typeof Notification !== "undefined" && Notification.permission === "granted") {
      new Notification(title, { body, icon: "/favicon.ico" });
    }
  } catch {
    /* ignore */
  }
}

export default function StudyTimer() {
  const [mode, setMode] = useState<Mode>("pomodoro");
  const [phase, setPhase] = useState<Phase>("focus");
  const [running, setRunning] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [focusMin, setFocusMin] = useState<number>(DEFAULT_FOCUS_MIN);
  const [breakMin, setBreakMin] = useState<number>(DEFAULT_BREAK_MIN);
  const [customInput, setCustomInput] = useState<string>(String(DEFAULT_FOCUS_MIN));
  const { data: sessions = [] } = useStudySessions();
  const addSession = useAddStudySession();
  const { notificationsEnabled } = useAppPrefs();
  const startedAtRef = useRef<number | null>(null);
  const phaseStartRef = useRef<number | null>(null);

  const focusSec = focusMin * 60;
  const breakSec = breakMin * 60;
  const target = mode === "pomodoro" ? (phase === "focus" ? focusSec : breakSec) : 0;
  const remaining = mode === "pomodoro" ? Math.max(0, target - elapsed) : elapsed;

  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(id);
  }, [running]);

  // Pomodoro phase transitions — save focus sessions when they complete
  useEffect(() => {
    if (mode !== "pomodoro" || !running) return;
    if (elapsed >= target) {
      beep();
      if (phase === "focus") {
        const dur = elapsed;
        if (dur >= 10) {
          addSession.mutate(
            {
              started_at: new Date(Date.now() - dur * 1000).toISOString(),
              duration_sec: dur,
              mode: "pomodoro",
              label: "Focus",
            },
            {
              onSuccess: () => toast.success(`Focus saved: ${fmt(dur)}`),
              onError: (e: any) => toast.error(e.message || "Failed to save session"),
            }
          );
        }
        toast.success("Focus done — take a break ☕");
        if (notificationsEnabled) notify("Focus complete 🎯", `Great job! Time for a ${breakMin}-minute break.`);
        setPhase("break");
      } else {
        toast("Break over — back to focus 🎯");
        if (notificationsEnabled) notify("Break over ⏰", "Back to focus — let's go!");
        setPhase("focus");
      }
      setElapsed(0);
      phaseStartRef.current = Date.now();
    }
  }, [elapsed, mode, phase, running, target, focusMin, breakMin, notificationsEnabled, addSession]);

  const start = () => {
    if (!startedAtRef.current) startedAtRef.current = Date.now();
    if (!phaseStartRef.current) phaseStartRef.current = Date.now();
    setRunning(true);
  };

  const pause = () => setRunning(false);

  const reset = () => {
    setRunning(false);
    setElapsed(0);
    setPhase("focus");
    startedAtRef.current = null;
    phaseStartRef.current = null;
  };

  const stop = () => {
    setRunning(false);
    if (elapsed >= 10) {
      const dur = elapsed;
      addSession.mutate(
        {
          started_at: new Date(Date.now() - dur * 1000).toISOString(),
          duration_sec: dur,
          mode,
          label: mode === "pomodoro" ? (phase === "focus" ? "Focus" : "Break") : null,
        },
        {
          onSuccess: () => toast.success(`Saved session: ${fmt(dur)}`),
          onError: (e: any) => toast.error(e.message || "Failed to save session"),
        }
      );
    } else if (elapsed > 0) {
      toast("Session too short to save (min 10s)");
    }
    reset();
  };

  const applyFocusMinutes = (m: number) => {
    const clamped = Math.max(MIN_FOCUS, Math.min(MAX_FOCUS, Math.round(m)));
    setFocusMin(clamped);
    setCustomInput(String(clamped));
    if (mode === "pomodoro" && phase === "focus") {
      // resetting elapsed avoids landing past the new target
      setRunning(false);
      setElapsed(0);
    }
  };

  const applyCustom = () => {
    const n = parseInt(customInput, 10);
    if (Number.isNaN(n)) {
      setCustomInput(String(focusMin));
      return;
    }
    applyFocusMinutes(n);
  };

  const pct = mode === "pomodoro" ? (elapsed / target) * 100 : Math.min(100, (elapsed / 3600) * 100);
  const display = mode === "pomodoro" ? fmt(remaining) : fmt(elapsed);

  return (
    <div className="space-y-6">
      <PageHeader
        icon={TimerIcon}
        title="Study Timer"
        description="Use Pomodoro for focused sprints or run a free timer. Sessions sync to your dashboard."
        gradient="from-rose-500 to-pink-500"
        action={
          <div className="flex gap-1 rounded-xl bg-muted/60 p-1">
            {(["pomodoro", "normal"] as Mode[]).map((m) => (
              <button
                key={m}
                onClick={() => {
                  setMode(m);
                  reset();
                }}
                className={`relative rounded-lg px-3 py-1.5 text-xs font-medium capitalize transition-all ${
                  mode === m ? "text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {mode === m && (
                  <motion.div layoutId="timerPill" className="absolute inset-0 rounded-lg gradient-primary shadow-md" />
                )}
                <span className="relative z-10">{m}</span>
              </button>
            ))}
          </div>
        }
      />

      {/* Duration controls (Pomodoro only) */}
      {mode === "pomodoro" && (
        <Card className="border-border/50 shadow-soft">
          <CardContent className="space-y-4 p-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <Label className="text-sm font-semibold">Focus duration</Label>
                <p className="text-xs text-muted-foreground">Pick a preset or enter your own (1–{MAX_FOCUS} min).</p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Input
                  type="number"
                  min={MIN_FOCUS}
                  max={MAX_FOCUS}
                  value={customInput}
                  disabled={running}
                  onChange={(e) => setCustomInput(e.target.value)}
                  onBlur={applyCustom}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      applyCustom();
                    }
                  }}
                  className="w-24"
                  aria-label="Custom focus minutes"
                />
                <span className="text-xs text-muted-foreground">min</span>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {FOCUS_PRESETS_MIN.map((m) => {
                const active = focusMin === m;
                return (
                  <button
                    key={m}
                    type="button"
                    onClick={() => applyFocusMinutes(m)}
                    disabled={running}
                    className={cn(
                      "rounded-full border px-4 py-1.5 text-sm font-medium transition-all disabled:opacity-50",
                      active
                        ? "border-primary bg-primary text-primary-foreground shadow-sm"
                        : "border-border bg-background hover:border-primary/50 hover:bg-primary/5"
                    )}
                  >
                    {m} min
                  </button>
                );
              })}
            </div>

            <div className="flex items-center gap-3">
              <Label htmlFor="break-min" className="text-xs text-muted-foreground">
                Break length
              </Label>
              <Input
                id="break-min"
                type="number"
                min={1}
                max={60}
                value={breakMin}
                disabled={running}
                onChange={(e) => {
                  const n = parseInt(e.target.value, 10);
                  if (!Number.isNaN(n)) setBreakMin(Math.max(1, Math.min(60, n)));
                }}
                className="w-20"
              />
              <span className="text-xs text-muted-foreground">min</span>
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="border-border/50 shadow-soft">
        <CardContent className="flex flex-col items-center gap-6 p-8">
          {mode === "pomodoro" && (
            <div className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wider ${phase === "focus" ? "bg-primary/15 text-primary" : "bg-success/15 text-success"}`}>
              {phase === "focus" ? `Focus · ${focusMin}m` : `Break · ${breakMin}m`}
            </div>
          )}

          <div className="relative">
            <svg className="h-64 w-64 -rotate-90" viewBox="0 0 200 200">
              <circle cx="100" cy="100" r="88" stroke="hsl(var(--muted))" strokeWidth="10" fill="none" />
              <motion.circle
                cx="100"
                cy="100"
                r="88"
                stroke="url(#timerGrad)"
                strokeWidth="10"
                strokeLinecap="round"
                fill="none"
                strokeDasharray={2 * Math.PI * 88}
                animate={{ strokeDashoffset: 2 * Math.PI * 88 * (1 - Math.min(1, pct / 100)) }}
                transition={{ duration: 0.5 }}
              />
              <defs>
                <linearGradient id="timerGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="hsl(var(--primary))" />
                  <stop offset="100%" stopColor="hsl(var(--primary-glow))" />
                </linearGradient>
              </defs>
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <div className="font-mono text-5xl font-bold tabular-nums">{display}</div>
              <div className="mt-1 text-xs uppercase tracking-wider text-muted-foreground">
                {running ? "Running" : "Paused"}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2">
            {!running ? (
              <Button onClick={start} className="gradient-primary text-primary-foreground shadow-md" size="lg">
                <Play className="mr-2 h-4 w-4" /> Start
              </Button>
            ) : (
              <Button onClick={pause} variant="outline" size="lg">
                <Pause className="mr-2 h-4 w-4" /> Pause
              </Button>
            )}
            <Button onClick={reset} variant="outline" size="lg">
              <RotateCcw className="mr-2 h-4 w-4" /> Reset
            </Button>
            <Button onClick={stop} variant="outline" size="lg">
              <Square className="mr-2 h-4 w-4" /> Stop & save
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/50 shadow-soft">
        <CardContent className="p-5">
          <h3 className="mb-3 text-sm font-semibold">Recent sessions</h3>
          {sessions.length === 0 ? (
            <p className="text-sm text-muted-foreground">No sessions yet. Hit Start to begin.</p>
          ) : (
            <div className="space-y-1.5">
              {sessions.slice(0, 6).map((s) => (
                <div key={s.id} className="flex items-center justify-between rounded-lg border border-border/40 px-3 py-2 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="rounded-md bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                      {s.mode}
                    </span>
                    <span className="text-muted-foreground">{new Date(s.started_at).toLocaleString()}</span>
                  </div>
                  <span className="font-mono font-medium">{fmt(s.duration_sec)}</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
