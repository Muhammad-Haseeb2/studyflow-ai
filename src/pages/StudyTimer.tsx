// Study Timer — Supabase-backed sessions, normal & Pomodoro.
import { useEffect, useRef, useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Timer as TimerIcon, Play, Pause, RotateCcw, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";
import { useStudySessions, useAddStudySession } from "@/lib/store";
import { toast } from "sonner";

type Mode = "normal" | "pomodoro";
type Phase = "focus" | "break";

const POMO_FOCUS = 25 * 60;
const POMO_BREAK = 5 * 60;

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

export default function StudyTimer() {
  const [mode, setMode] = useState<Mode>("pomodoro");
  const [phase, setPhase] = useState<Phase>("focus");
  const [running, setRunning] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const { data: sessions = [] } = useStudySessions();
  const addSession = useAddStudySession();
  const startedAtRef = useRef<number | null>(null);
  const phaseStartRef = useRef<number | null>(null);

  const target = mode === "pomodoro" ? (phase === "focus" ? POMO_FOCUS : POMO_BREAK) : 0;
  const remaining = mode === "pomodoro" ? Math.max(0, target - elapsed) : elapsed;

  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(id);
  }, [running]);

  // Pomodoro phase transitions
  useEffect(() => {
    if (mode !== "pomodoro" || !running) return;
    if (elapsed >= target) {
      beep();
      if (phase === "focus") {
        const dur = elapsed;
        if (dur >= 60) {
          addSession.mutate({
            started_at: new Date(Date.now() - dur * 1000).toISOString(),
            duration_sec: dur,
            mode: "pomodoro",
            label: "Focus",
          });
        }
        toast.success("Focus done — take a break ☕");
        setPhase("break");
      } else {
        toast("Break over — back to focus 🎯");
        setPhase("focus");
      }
      setElapsed(0);
      phaseStartRef.current = Date.now();
    }
  }, [elapsed, mode, phase, running, target]);

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
    if (mode === "normal" && elapsed >= 60) {
      addSession.mutate({
        started_at: new Date(Date.now() - elapsed * 1000).toISOString(),
        duration_sec: elapsed,
        mode: "normal",
        label: null,
      });
      toast.success(`Saved session: ${fmt(elapsed)}`);
    }
    reset();
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

      <Card className="border-border/50 shadow-soft">
        <CardContent className="flex flex-col items-center gap-6 p-8">
          {mode === "pomodoro" && (
            <div className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wider ${phase === "focus" ? "bg-primary/15 text-primary" : "bg-success/15 text-success"}`}>
              {phase === "focus" ? "Focus" : "Break"}
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

          <div className="flex items-center gap-2">
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
