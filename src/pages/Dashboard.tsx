// Dashboard: stats, weekly graph, achievements, goals.
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/PageHeader";
import {
  computeAchievements,
  computeStreak,
  totalMinutesToday,
  useGoals,
  useStudySessions,
  weeklyData,
  newId,
  type Goal,
} from "@/lib/store";
import { LayoutDashboard, Flame, Clock, Target, Award, Plus, Trash2 } from "lucide-react";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid } from "recharts";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";

export default function Dashboard() {
  const [sessions] = useStudySessions();
  const [goals, setGoals] = useGoals();
  const minutesToday = totalMinutesToday(sessions);
  const streak = computeStreak(sessions);
  const totalMinutes = Math.round(sessions.reduce((a, s) => a + s.durationSec, 0) / 60);
  const data = weeklyData(sessions);
  const achievements = computeAchievements(sessions);

  const stats = [
    { label: "Today", value: `${minutesToday}m`, icon: Clock, gradient: "from-violet-500 to-purple-500" },
    { label: "Streak", value: `${streak}d`, icon: Flame, gradient: "from-orange-500 to-red-500" },
    { label: "Total time", value: `${Math.floor(totalMinutes / 60)}h ${totalMinutes % 60}m`, icon: Target, gradient: "from-emerald-500 to-teal-500" },
    { label: "Sessions", value: `${sessions.length}`, icon: Award, gradient: "from-pink-500 to-rose-500" },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        icon={LayoutDashboard}
        title="Welcome back 👋"
        description="Track your progress, build streaks and crush your study goals."
        gradient="from-violet-500 to-fuchsia-500"
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <Card className="overflow-hidden border-border/50 shadow-soft transition-all hover:shadow-elevated">
              <CardContent className="p-4">
                <div className={`mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${s.gradient} text-white shadow-md`}>
                  <s.icon className="h-5 w-5" />
                </div>
                <div className="text-2xl font-bold tracking-tight">{s.value}</div>
                <div className="text-xs text-muted-foreground">{s.label}</div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2 border-border/50 shadow-soft">
          <CardHeader>
            <CardTitle className="text-base">Weekly study activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data} margin={{ top: 5, right: 5, bottom: 0, left: -20 }}>
                  <defs>
                    <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.6} />
                      <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0.05} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="day" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip
                    contentStyle={{
                      background: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: 12,
                      fontSize: 12,
                    }}
                    formatter={(v: number) => [`${v} min`, "Studied"]}
                  />
                  <Area
                    type="monotone"
                    dataKey="minutes"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2.5}
                    fill="url(#g1)"
                    animationDuration={800}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50 shadow-soft">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Achievements</CardTitle>
            <span className="text-xs text-muted-foreground">
              {achievements.filter((a) => a.earned).length}/{achievements.length}
            </span>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {achievements.map((a) => (
                <div
                  key={a.id}
                  className={`flex items-center gap-3 rounded-xl border border-border/40 p-2.5 transition-all ${
                    a.earned ? "bg-gradient-to-r from-primary/5 to-accent/5" : "opacity-50"
                  }`}
                >
                  <div className="text-2xl">{a.emoji}</div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium">{a.title}</div>
                    <div className="truncate text-xs text-muted-foreground">{a.description}</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <GoalsSection goals={goals} setGoals={setGoals} minutesToday={minutesToday} />
    </div>
  );
}

function GoalsSection({
  goals,
  setGoals,
  minutesToday,
}: {
  goals: Goal[];
  setGoals: (g: Goal[]) => void;
  minutesToday: number;
}) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [target, setTarget] = useState(60);

  const add = () => {
    if (!title.trim()) return;
    setGoals([
      ...goals,
      {
        id: newId(),
        title: title.trim(),
        targetMinutesPerDay: target,
        active: true,
        createdAt: new Date().toISOString(),
      },
    ]);
    setTitle("");
    setTarget(60);
    setOpen(false);
  };

  return (
    <Card className="border-border/50 shadow-soft">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base">Your goals</CardTitle>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gradient-primary text-primary-foreground shadow-md">
              <Plus className="mr-1.5 h-4 w-4" /> New goal
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create goal</DialogTitle>
              <DialogDescription>Set a daily study target you'll track here.</DialogDescription>
            </DialogHeader>
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label>Goal title</Label>
                <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Master calculus" />
              </div>
              <div className="space-y-1.5">
                <Label>Target minutes per day</Label>
                <Input type="number" min={1} value={target} onChange={(e) => setTarget(Number(e.target.value) || 0)} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button onClick={add} className="gradient-primary text-primary-foreground">
                Create
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {goals.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-8 text-center">
            <Target className="h-10 w-10 text-muted-foreground/50" />
            <p className="text-sm text-muted-foreground">No goals yet. Create your first one to start tracking.</p>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {goals.map((g) => {
              const pct = Math.min(100, Math.round((minutesToday / g.targetMinutesPerDay) * 100));
              return (
                <motion.div
                  key={g.id}
                  layout
                  initial={{ opacity: 0, scale: 0.97 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className={`group rounded-xl border border-border/50 bg-card p-4 transition-all ${g.active ? "" : "opacity-60"}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="truncate font-medium">{g.title}</div>
                      <div className="text-xs text-muted-foreground">
                        {minutesToday}/{g.targetMinutesPerDay} min today
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Switch
                        checked={g.active}
                        onCheckedChange={(v) => setGoals(goals.map((x) => (x.id === g.id ? { ...x, active: v } : x)))}
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        onClick={() => setGoals(goals.filter((x) => x.id !== g.id))}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <Progress value={pct} className="mt-3 h-2" />
                  <div className="mt-1 text-right text-xs font-medium text-primary">{pct}%</div>
                </motion.div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
