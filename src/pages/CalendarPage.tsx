// Smart Calendar — Supabase-backed events with reminders.
import { useEffect, useMemo, useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Calendar as CalIcon, Plus, ChevronLeft, ChevronRight, Trash2, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useCalendarEvents, useCalendarMutations, type CalendarEvent } from "@/lib/store";
import { motion } from "framer-motion";
import { toast } from "sonner";

type Editable = {
  id?: string;
  title: string;
  description: string;
  starts_at: string;
  ends_at: string;
  category: CalendarEvent["category"];
  reminder_minutes_before: number;
};

const CATS: Record<CalendarEvent["category"], string> = {
  study: "from-violet-500 to-purple-500",
  exam: "from-red-500 to-pink-500",
  revision: "from-amber-500 to-orange-500",
  break: "from-emerald-500 to-teal-500",
  other: "from-sky-500 to-blue-500",
};

function startOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}
function endOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0);
}
function fmt(d: Date) {
  return d.toISOString().slice(0, 10);
}

function playBeep() {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = "sine";
    o.frequency.value = 880;
    o.connect(g);
    g.connect(ctx.destination);
    g.gain.setValueAtTime(0.0001, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.3, ctx.currentTime + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.6);
    o.start();
    o.stop(ctx.currentTime + 0.6);
  } catch {
    /* ignore */
  }
}

export default function CalendarPage() {
  const { data: events = [] } = useCalendarEvents();
  const { upsert, remove } = useCalendarMutations();
  const [cursor, setCursor] = useState(new Date());
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Editable | null>(null);
  const [notified, setNotified] = useState<Set<string>>(new Set());

  // Notification permission
  useEffect(() => {
    if (typeof Notification !== "undefined" && Notification.permission === "default") {
      Notification.requestPermission().catch(() => {});
    }
  }, []);

  // Reminder loop (in-memory notified tracking; resets per session)
  useEffect(() => {
    const tick = () => {
      const now = Date.now();
      events.forEach((e) => {
        if (notified.has(e.id)) return;
        const start = new Date(e.starts_at).getTime();
        const lead = (e.reminder_minutes_before ?? 10) * 60 * 1000;
        if (start - lead <= now && start > now - 60 * 1000) {
          if (typeof Notification !== "undefined" && Notification.permission === "granted") {
            try {
              new Notification(`📚 ${e.title}`, { body: `Starts at ${new Date(e.starts_at).toLocaleTimeString()}` });
            } catch {
              /* ignore */
            }
          }
          toast(`🔔 ${e.title}`, { description: `Starts at ${new Date(e.starts_at).toLocaleTimeString()}` });
          playBeep();
          setNotified((prev) => new Set(prev).add(e.id));
        }
      });
    };
    tick();
    const id = setInterval(tick, 30000);
    return () => clearInterval(id);
  }, [events, notified]);

  const days = useMemo(() => {
    const start = startOfMonth(cursor);
    const end = endOfMonth(cursor);
    const out: Date[] = [];
    const startWeekday = start.getDay();
    for (let i = startWeekday; i > 0; i--) {
      const d = new Date(start);
      d.setDate(d.getDate() - i);
      out.push(d);
    }
    for (let i = 0; i < end.getDate(); i++) {
      const d = new Date(start);
      d.setDate(d.getDate() + i);
      out.push(d);
    }
    while (out.length % 7 !== 0) {
      const d = new Date(out[out.length - 1]);
      d.setDate(d.getDate() + 1);
      out.push(d);
    }
    return out;
  }, [cursor]);

  const eventsByDay = useMemo(() => {
    const m = new Map<string, CalendarEvent[]>();
    events.forEach((e) => {
      const k = fmt(new Date(e.starts_at));
      m.set(k, [...(m.get(k) || []), e]);
    });
    return m;
  }, [events]);

  const openNew = (date?: Date) => {
    const d = date || new Date();
    const start = new Date(d);
    start.setHours(9, 0, 0, 0);
    const end = new Date(start);
    end.setHours(start.getHours() + 1);
    setEditing({
      title: "",
      description: "",
      starts_at: start.toISOString(),
      ends_at: end.toISOString(),
      category: "study",
      reminder_minutes_before: 10,
    });
    setOpen(true);
  };

  const openEdit = (e: CalendarEvent) => {
    setEditing({
      id: e.id,
      title: e.title,
      description: e.description || "",
      starts_at: e.starts_at,
      ends_at: e.ends_at,
      category: e.category,
      reminder_minutes_before: e.reminder_minutes_before ?? 10,
    });
    setOpen(true);
  };

  const save = () => {
    if (!editing || !editing.title.trim()) return;
    upsert.mutate(
      { ...editing, reminder_enabled: true },
      {
        onSuccess: () => {
          if (editing.id) setNotified((prev) => {
            const next = new Set(prev);
            next.delete(editing.id!);
            return next;
          });
          setOpen(false);
          setEditing(null);
        },
        onError: (e: any) => toast.error(e.message),
      }
    );
  };

  return (
    <div className="space-y-6">
      <PageHeader
        icon={CalIcon}
        title="Smart Calendar"
        description="Plan study, exams and revisions. Reminders ring with sound + notifications."
        gradient="from-orange-500 to-red-500"
        action={
          <Button onClick={() => openNew()} className="gradient-primary text-primary-foreground shadow-md">
            <Plus className="mr-2 h-4 w-4" /> New event
          </Button>
        }
      />

      <Card className="border-border/50 shadow-soft">
        <CardContent className="p-4 sm:p-5">
          <div className="mb-4 flex items-center justify-between">
            <div className="text-lg font-semibold">
              {cursor.toLocaleString(undefined, { month: "long", year: "numeric" })}
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8 rounded-lg"
                onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={() => setCursor(new Date())}>
                Today
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8 rounded-lg"
                onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
              <div key={d} className="py-1">{d}</div>
            ))}
          </div>
          <div className="mt-1 grid grid-cols-7 gap-1">
            {days.map((d, i) => {
              const inMonth = d.getMonth() === cursor.getMonth();
              const isToday = d.toDateString() === new Date().toDateString();
              const evs = eventsByDay.get(fmt(d)) || [];
              return (
                <motion.button
                  key={i}
                  layout
                  whileHover={{ scale: 1.02 }}
                  onClick={() => openNew(d)}
                  className={`group min-h-[78px] rounded-xl border p-1.5 text-left transition-all sm:min-h-[96px] ${
                    inMonth ? "border-border/50 bg-card" : "border-transparent bg-muted/20 opacity-60"
                  } ${isToday ? "border-primary ring-1 ring-primary/30" : ""}`}
                >
                  <div className={`text-xs font-semibold ${isToday ? "text-primary" : ""}`}>{d.getDate()}</div>
                  <div className="mt-1 space-y-0.5">
                    {evs.slice(0, 3).map((e) => (
                      <div
                        key={e.id}
                        onClick={(ev) => {
                          ev.stopPropagation();
                          openEdit(e);
                        }}
                        className={`truncate rounded-md bg-gradient-to-r ${CATS[e.category]} px-1.5 py-0.5 text-[10px] font-medium text-white`}
                      >
                        {e.title}
                      </div>
                    ))}
                    {evs.length > 3 && <div className="text-[10px] text-muted-foreground">+{evs.length - 3} more</div>}
                  </div>
                </motion.button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing?.id ? "Edit event" : "New event"}</DialogTitle>
            <DialogDescription>Schedule your study session, exam or revision.</DialogDescription>
          </DialogHeader>
          {editing && (
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label>Title</Label>
                <Input value={editing.title} onChange={(e) => setEditing({ ...editing, title: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>Description</Label>
                <Textarea
                  rows={2}
                  value={editing.description}
                  onChange={(e) => setEditing({ ...editing, description: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Starts</Label>
                  <Input
                    type="datetime-local"
                    value={editing.starts_at.slice(0, 16)}
                    onChange={(e) => setEditing({ ...editing, starts_at: new Date(e.target.value).toISOString() })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Ends</Label>
                  <Input
                    type="datetime-local"
                    value={editing.ends_at.slice(0, 16)}
                    onChange={(e) => setEditing({ ...editing, ends_at: new Date(e.target.value).toISOString() })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Category</Label>
                  <Select
                    value={editing.category}
                    onValueChange={(v: CalendarEvent["category"]) => setEditing({ ...editing, category: v })}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="study">📘 Study</SelectItem>
                      <SelectItem value="exam">📝 Exam</SelectItem>
                      <SelectItem value="revision">🔁 Revision</SelectItem>
                      <SelectItem value="break">☕ Break</SelectItem>
                      <SelectItem value="other">📌 Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="flex items-center gap-1"><Bell className="h-3 w-3" /> Reminder (min before)</Label>
                  <Input
                    type="number"
                    min={0}
                    value={editing.reminder_minutes_before}
                    onChange={(e) => setEditing({ ...editing, reminder_minutes_before: Number(e.target.value) || 0 })}
                  />
                </div>
              </div>
            </div>
          )}
          <DialogFooter className="flex-row sm:justify-between">
            {editing?.id ? (
              <Button
                variant="outline"
                className="text-destructive hover:bg-destructive/10"
                onClick={() => {
                  remove.mutate(editing.id!, {
                    onSuccess: () => {
                      setOpen(false);
                      setEditing(null);
                    },
                  });
                }}
              >
                <Trash2 className="mr-2 h-4 w-4" /> Delete
              </Button>
            ) : (
              <span />
            )}
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button onClick={save} className="gradient-primary text-primary-foreground" disabled={upsert.isPending}>
                Save
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
