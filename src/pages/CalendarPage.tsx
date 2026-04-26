// Smart Calendar — polished month grid + side panel for upcoming events.
import { useEffect, useMemo, useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import {
  Calendar as CalIcon,
  Plus,
  ChevronLeft,
  ChevronRight,
  Trash2,
  Bell,
  Clock,
  Pencil,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
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
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type Editable = {
  id?: string;
  title: string;
  description: string;
  starts_at: string;
  ends_at: string;
  category: CalendarEvent["category"];
  reminder_minutes_before: number;
};

const CATS: Record<CalendarEvent["category"], { gradient: string; dot: string; label: string; emoji: string }> = {
  study: { gradient: "from-violet-500 to-purple-500", dot: "bg-violet-500", label: "Study", emoji: "📘" },
  exam: { gradient: "from-rose-500 to-pink-500", dot: "bg-rose-500", label: "Exam", emoji: "📝" },
  revision: { gradient: "from-amber-500 to-orange-500", dot: "bg-amber-500", label: "Revision", emoji: "🔁" },
  break: { gradient: "from-emerald-500 to-teal-500", dot: "bg-emerald-500", label: "Break", emoji: "☕" },
  other: { gradient: "from-sky-500 to-blue-500", dot: "bg-sky-500", label: "Other", emoji: "📌" },
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
  const [selected, setSelected] = useState<Date>(new Date());
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Editable | null>(null);
  const [notified, setNotified] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (typeof Notification !== "undefined" && Notification.permission === "default") {
      Notification.requestPermission().catch(() => {});
    }
  }, []);

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
              new Notification(`📚 ${e.title}`, {
                body: `Starts at ${new Date(e.starts_at).toLocaleTimeString()}`,
              });
            } catch {
              /* ignore */
            }
          }
          toast(`🔔 ${e.title}`, {
            description: `Starts at ${new Date(e.starts_at).toLocaleTimeString()}`,
          });
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
    // sort each day's events by time
    m.forEach((list) => list.sort((a, b) => a.starts_at.localeCompare(b.starts_at)));
    return m;
  }, [events]);

  const selectedEvents = useMemo(() => eventsByDay.get(fmt(selected)) || [], [eventsByDay, selected]);

  const upcoming = useMemo(() => {
    const now = Date.now();
    return events
      .filter((e) => new Date(e.starts_at).getTime() >= now - 60 * 60 * 1000)
      .sort((a, b) => a.starts_at.localeCompare(b.starts_at))
      .slice(0, 8);
  }, [events]);

  const openNew = (date?: Date) => {
    const d = date || selected || new Date();
    const start = new Date(d);
    const ref = new Date();
    start.setHours(ref.getHours() + 1, 0, 0, 0);
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
    if (!editing || !editing.title.trim()) {
      toast.error("Title is required");
      return;
    }
    upsert.mutate(
      { ...editing, reminder_enabled: true },
      {
        onSuccess: () => {
          if (editing.id)
            setNotified((prev) => {
              const next = new Set(prev);
              next.delete(editing.id!);
              return next;
            });
          setOpen(false);
          setEditing(null);
          toast.success(editing.id ? "Event updated" : "Event added");
        },
        onError: (e: any) => toast.error(e.message),
      }
    );
  };

  const isSameDay = (a: Date, b: Date) => a.toDateString() === b.toDateString();

  return (
    <div className="space-y-6">
      <PageHeader
        icon={CalIcon}
        title="Smart Calendar"
        description="Plan study sessions, exams and revisions. Reminders ring with sound + notifications."
        gradient="from-orange-500 to-red-500"
        action={
          <Button onClick={() => openNew()} className="gradient-primary text-primary-foreground shadow-md">
            <Plus className="mr-2 h-4 w-4" /> New event
          </Button>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        {/* Calendar */}
        <Card className="overflow-hidden border-border/50 shadow-soft">
          <CardContent className="p-4 sm:p-6">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold tracking-tight">
                  {cursor.toLocaleString(undefined, { month: "long" })}
                </div>
                <div className="text-sm text-muted-foreground">{cursor.getFullYear()}</div>
              </div>
              <div className="flex items-center gap-1.5">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-9 w-9 rounded-lg"
                  onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))}
                  aria-label="Previous month"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const t = new Date();
                    setCursor(t);
                    setSelected(t);
                  }}
                >
                  Today
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-9 w-9 rounded-lg"
                  onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))}
                  aria-label="Next month"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Weekday header */}
            <div className="mb-2 grid grid-cols-7 gap-1.5 text-center text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
                <div key={d} className="py-1.5">
                  {d}
                </div>
              ))}
            </div>

            {/* Day cells */}
            <div className="grid grid-cols-7 gap-1.5">
              {days.map((d, i) => {
                const inMonth = d.getMonth() === cursor.getMonth();
                const isToday = isSameDay(d, new Date());
                const isSelected = isSameDay(d, selected);
                const evs = eventsByDay.get(fmt(d)) || [];
                return (
                  <motion.button
                    key={i}
                    layout
                    whileHover={{ y: -1 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setSelected(d)}
                    onDoubleClick={() => openNew(d)}
                    className={cn(
                      "group relative flex min-h-[84px] flex-col rounded-xl border p-2 text-left transition-all sm:min-h-[104px]",
                      inMonth ? "bg-card hover:bg-accent/40" : "bg-muted/20 opacity-50",
                      isSelected
                        ? "border-primary ring-2 ring-primary/30 shadow-sm"
                        : isToday
                        ? "border-primary/60"
                        : "border-border/50"
                    )}
                  >
                    <div className="mb-1 flex items-center justify-between">
                      <span
                        className={cn(
                          "flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold",
                          isToday && "bg-primary text-primary-foreground shadow-sm",
                          !isToday && isSelected && "text-primary",
                          !isToday && !isSelected && "text-foreground"
                        )}
                      >
                        {d.getDate()}
                      </span>
                      {evs.length > 0 && (
                        <span className="text-[10px] font-medium text-muted-foreground">{evs.length}</span>
                      )}
                    </div>
                    <div className="space-y-1 overflow-hidden">
                      {evs.slice(0, 2).map((e) => (
                        <div
                          key={e.id}
                          onClick={(ev) => {
                            ev.stopPropagation();
                            openEdit(e);
                          }}
                          className={cn(
                            "truncate rounded-md bg-gradient-to-r px-1.5 py-0.5 text-[10px] font-medium text-white shadow-sm",
                            CATS[e.category].gradient
                          )}
                        >
                          {e.title}
                        </div>
                      ))}
                      {evs.length > 2 && (
                        <div className="px-1 text-[10px] font-medium text-muted-foreground">
                          +{evs.length - 2} more
                        </div>
                      )}
                    </div>
                  </motion.button>
                );
              })}
            </div>

            {/* Legend */}
            <div className="mt-5 flex flex-wrap items-center gap-3 border-t border-border/50 pt-4">
              {(Object.keys(CATS) as CalendarEvent["category"][]).map((k) => (
                <div key={k} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <span className={cn("h-2 w-2 rounded-full", CATS[k].dot)} />
                  {CATS[k].label}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Side panel */}
        <div className="space-y-4">
          {/* Selected day */}
          <Card className="border-border/50 shadow-soft">
            <CardContent className="p-4">
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    {isSameDay(selected, new Date()) ? "Today" : selected.toLocaleDateString([], { weekday: "long" })}
                  </div>
                  <div className="text-lg font-bold">
                    {selected.toLocaleDateString([], { month: "short", day: "numeric" })}
                  </div>
                </div>
                <Button size="sm" variant="outline" onClick={() => openNew(selected)}>
                  <Plus className="mr-1 h-3.5 w-3.5" /> Add
                </Button>
              </div>

              {selectedEvents.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-2 py-6 text-center">
                  <Sparkles className="h-6 w-6 text-muted-foreground/60" />
                  <p className="text-sm text-muted-foreground">Nothing planned. Add an event to get started.</p>
                </div>
              ) : (
                <ScrollArea className="max-h-[280px] pr-2">
                  <ul className="space-y-2">
                    <AnimatePresence initial={false}>
                      {selectedEvents.map((e) => (
                        <motion.li
                          key={e.id}
                          layout
                          initial={{ opacity: 0, y: 6 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -6 }}
                          className="group flex gap-2 rounded-lg border border-border/50 bg-card p-2.5 transition hover:border-primary/40"
                        >
                          <span className={cn("mt-1 h-2 w-2 shrink-0 rounded-full", CATS[e.category].dot)} />
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between gap-2">
                              <p className="truncate text-sm font-semibold">{e.title}</p>
                              <button
                                onClick={() => openEdit(e)}
                                className="opacity-0 transition group-hover:opacity-100"
                                aria-label="Edit"
                              >
                                <Pencil className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground" />
                              </button>
                            </div>
                            <div className="mt-0.5 flex items-center gap-2 text-[11px] text-muted-foreground">
                              <Clock className="h-3 w-3" />
                              {new Date(e.starts_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                              {" – "}
                              {new Date(e.ends_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                            </div>
                            {e.description && (
                              <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{e.description}</p>
                            )}
                          </div>
                        </motion.li>
                      ))}
                    </AnimatePresence>
                  </ul>
                </ScrollArea>
              )}
            </CardContent>
          </Card>

          {/* Upcoming */}
          <Card className="border-border/50 shadow-soft">
            <CardContent className="p-4">
              <div className="mb-3 flex items-center justify-between">
                <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Upcoming
                </div>
                <Badge variant="secondary" className="text-[10px]">
                  {upcoming.length}
                </Badge>
              </div>
              {upcoming.length === 0 ? (
                <p className="py-3 text-center text-sm text-muted-foreground">No upcoming events.</p>
              ) : (
                <ul className="space-y-1.5">
                  {upcoming.map((e) => {
                    const d = new Date(e.starts_at);
                    return (
                      <li key={e.id}>
                        <button
                          onClick={() => {
                            setSelected(d);
                            setCursor(new Date(d.getFullYear(), d.getMonth(), 1));
                          }}
                          className="flex w-full items-center gap-2 rounded-lg border border-transparent p-2 text-left transition hover:border-border hover:bg-accent/40"
                        >
                          <div
                            className={cn(
                              "flex h-9 w-9 shrink-0 flex-col items-center justify-center rounded-lg bg-gradient-to-br text-white shadow-sm",
                              CATS[e.category].gradient
                            )}
                          >
                            <span className="text-[8px] font-semibold uppercase leading-none">
                              {d.toLocaleString([], { month: "short" })}
                            </span>
                            <span className="text-sm font-bold leading-tight">{d.getDate()}</span>
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium">{e.title}</p>
                            <p className="text-[11px] text-muted-foreground">
                              {d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} ·{" "}
                              {CATS[e.category].emoji} {CATS[e.category].label}
                            </p>
                          </div>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Edit dialog */}
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
                <Input
                  value={editing.title}
                  onChange={(e) => setEditing({ ...editing, title: e.target.value })}
                  placeholder="e.g. Math revision"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Description</Label>
                <Textarea
                  rows={2}
                  value={editing.description}
                  onChange={(e) => setEditing({ ...editing, description: e.target.value })}
                  placeholder="Optional notes"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Starts</Label>
                  <Input
                    type="datetime-local"
                    value={editing.starts_at.slice(0, 16)}
                    onChange={(e) =>
                      setEditing({ ...editing, starts_at: new Date(e.target.value).toISOString() })
                    }
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Ends</Label>
                  <Input
                    type="datetime-local"
                    value={editing.ends_at.slice(0, 16)}
                    onChange={(e) =>
                      setEditing({ ...editing, ends_at: new Date(e.target.value).toISOString() })
                    }
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Category</Label>
                  <Select
                    value={editing.category}
                    onValueChange={(v: CalendarEvent["category"]) =>
                      setEditing({ ...editing, category: v })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {(Object.keys(CATS) as CalendarEvent["category"][]).map((k) => (
                        <SelectItem key={k} value={k}>
                          {CATS[k].emoji} {CATS[k].label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="flex items-center gap-1">
                    <Bell className="h-3 w-3" /> Reminder (min before)
                  </Label>
                  <Input
                    type="number"
                    min={0}
                    value={editing.reminder_minutes_before}
                    onChange={(e) =>
                      setEditing({ ...editing, reminder_minutes_before: Number(e.target.value) || 0 })
                    }
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
                      toast.success("Event deleted");
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
              <Button
                onClick={save}
                className="gradient-primary text-primary-foreground"
                disabled={upsert.isPending}
              >
                Save
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
