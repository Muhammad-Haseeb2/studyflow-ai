// Cloud-backed data hooks using Supabase + React Query.
// Replaces the previous localStorage-only store while preserving similar shapes.
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { v4 as uuid } from "uuid";

export const newId = () => uuid();

// ============= TYPES =============
export type StudySession = {
  id: string;
  user_id: string;
  duration_sec: number;
  mode: "pomodoro" | "normal";
  label: string | null;
  started_at: string;
  created_at: string;
};

export type Goal = {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  target_minutes_per_day: number;
  status: "active" | "inactive" | "completed";
  progress: number;
  created_at: string;
  updated_at: string;
};

export type Note = {
  id: string;
  user_id: string;
  title: string;
  content: string;
  created_at: string;
  updated_at: string;
};

export type CalendarEvent = {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  starts_at: string;
  ends_at: string;
  category: "study" | "exam" | "revision" | "break" | "other";
  reminder_minutes_before: number | null;
  reminder_enabled: boolean;
  created_at: string;
  updated_at: string;
};

export type QuizResult = {
  id: string;
  user_id: string;
  topic: string;
  score: number;
  total: number;
  correct: number;
  weak_concepts: string[];
  created_at: string;
};

export type Flashcard = {
  id: string;
  user_id: string;
  deck_title: string;
  question: string;
  answer: string;
  created_at: string;
};

// Deck = grouped flashcards (UI shape)
export type FlashcardDeck = {
  title: string;
  cards: { id: string; question: string; answer: string }[];
  createdAt: string;
};

// ============= STUDY SESSIONS =============
export function useStudySessions() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["study_sessions", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("study_sessions")
        .select("*")
        .order("started_at", { ascending: false })
        .limit(500);
      if (error) throw error;
      return (data || []) as StudySession[];
    },
  });
}

export function useAddStudySession() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (s: Omit<StudySession, "id" | "user_id" | "created_at">) => {
      if (!user) throw new Error("Not authenticated");
      const { error } = await supabase.from("study_sessions").insert({ ...s, user_id: user.id });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["study_sessions"] }),
  });
}

// ============= GOALS =============
export function useGoals() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["goals", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("goals")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []) as Goal[];
    },
  });
}

export function useGoalMutations() {
  const qc = useQueryClient();
  const { user } = useAuth();
  const invalidate = () => qc.invalidateQueries({ queryKey: ["goals"] });
  return {
    create: useMutation({
      mutationFn: async (g: { title: string; description?: string; target_minutes_per_day: number }) => {
        if (!user) throw new Error("Not authenticated");
        const { error } = await supabase.from("goals").insert({ ...g, user_id: user.id });
        if (error) throw error;
      },
      onSuccess: invalidate,
    }),
    update: useMutation({
      mutationFn: async ({ id, ...patch }: { id: string } & Partial<Goal>) => {
        const { error } = await supabase.from("goals").update(patch).eq("id", id);
        if (error) throw error;
      },
      onSuccess: invalidate,
    }),
    remove: useMutation({
      mutationFn: async (id: string) => {
        const { error } = await supabase.from("goals").delete().eq("id", id);
        if (error) throw error;
      },
      onSuccess: invalidate,
    }),
  };
}

// ============= NOTES =============
export function useNotes() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["notes", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("notes")
        .select("*")
        .order("updated_at", { ascending: false });
      if (error) throw error;
      return (data || []) as Note[];
    },
  });
}

export function useNoteMutations() {
  const qc = useQueryClient();
  const { user } = useAuth();
  const invalidate = () => qc.invalidateQueries({ queryKey: ["notes"] });
  return {
    create: useMutation({
      mutationFn: async (n: { title: string; content: string }) => {
        if (!user) throw new Error("Not authenticated");
        const { data, error } = await supabase
          .from("notes")
          .insert({ ...n, user_id: user.id })
          .select()
          .single();
        if (error) throw error;
        return data as Note;
      },
      onSuccess: invalidate,
    }),
    update: useMutation({
      mutationFn: async ({ id, ...patch }: { id: string; title?: string; content?: string }) => {
        const { error } = await supabase.from("notes").update(patch).eq("id", id);
        if (error) throw error;
      },
      onSuccess: invalidate,
    }),
    remove: useMutation({
      mutationFn: async (id: string) => {
        const { error } = await supabase.from("notes").delete().eq("id", id);
        if (error) throw error;
      },
      onSuccess: invalidate,
    }),
  };
}

// ============= CALENDAR =============
export function useCalendarEvents() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["calendar_events", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("calendar_events")
        .select("*")
        .order("starts_at", { ascending: true });
      if (error) throw error;
      return (data || []) as CalendarEvent[];
    },
  });
}

export function useCalendarMutations() {
  const qc = useQueryClient();
  const { user } = useAuth();
  const invalidate = () => qc.invalidateQueries({ queryKey: ["calendar_events"] });
  return {
    upsert: useMutation({
      mutationFn: async (e: Partial<CalendarEvent> & { title: string; starts_at: string; ends_at: string; category: CalendarEvent["category"] }) => {
        if (!user) throw new Error("Not authenticated");
        if (e.id) {
          const { id, user_id: _u, created_at: _c, updated_at: _up, ...patch } = e;
          const { error } = await supabase.from("calendar_events").update(patch).eq("id", id);
          if (error) throw error;
        } else {
          const { error } = await supabase.from("calendar_events").insert({ ...e, user_id: user.id });
          if (error) throw error;
        }
      },
      onSuccess: invalidate,
    }),
    remove: useMutation({
      mutationFn: async (id: string) => {
        const { error } = await supabase.from("calendar_events").delete().eq("id", id);
        if (error) throw error;
      },
      onSuccess: invalidate,
    }),
  };
}

// ============= QUIZ RESULTS =============
export function useQuizResults() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["quiz_results", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("quiz_results")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return ((data || []) as any[]).map((r) => ({
        ...r,
        weak_concepts: Array.isArray(r.weak_concepts) ? r.weak_concepts : [],
      })) as QuizResult[];
    },
  });
}

export function useAddQuizResult() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (r: { topic: string; score: number; total: number; correct: number; weak_concepts: string[] }) => {
      if (!user) throw new Error("Not authenticated");
      const { error } = await supabase.from("quiz_results").insert({ ...r, user_id: user.id });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["quiz_results"] }),
  });
}

// ============= FLASHCARDS =============
export function useFlashcards() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["flashcards", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("flashcards")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []) as Flashcard[];
    },
  });
}

export function useFlashcardDecks() {
  const { data: cards = [], isLoading } = useFlashcards();
  const decks = new Map<string, FlashcardDeck>();
  cards.forEach((c) => {
    const key = c.deck_title;
    if (!decks.has(key)) decks.set(key, { title: key, cards: [], createdAt: c.created_at });
    decks.get(key)!.cards.push({ id: c.id, question: c.question, answer: c.answer });
  });
  return { decks: Array.from(decks.values()), isLoading };
}

export function useFlashcardMutations() {
  const qc = useQueryClient();
  const { user } = useAuth();
  const invalidate = () => qc.invalidateQueries({ queryKey: ["flashcards"] });
  return {
    saveDeck: useMutation({
      mutationFn: async ({ title, cards }: { title: string; cards: { question: string; answer: string }[] }) => {
        if (!user) throw new Error("Not authenticated");
        const rows = cards.map((c) => ({ ...c, deck_title: title, user_id: user.id }));
        const { error } = await supabase.from("flashcards").insert(rows);
        if (error) throw error;
      },
      onSuccess: invalidate,
    }),
    removeDeck: useMutation({
      mutationFn: async (title: string) => {
        if (!user) throw new Error("Not authenticated");
        const { error } = await supabase.from("flashcards").delete().eq("user_id", user.id).eq("deck_title", title);
        if (error) throw error;
      },
      onSuccess: invalidate,
    }),
  };
}

// ============= AGGREGATIONS =============
export function totalMinutesToday(sessions: StudySession[]) {
  const today = new Date().toDateString();
  return Math.round(
    sessions
      .filter((s) => new Date(s.started_at).toDateString() === today)
      .reduce((acc, s) => acc + s.duration_sec, 0) / 60
  );
}

export function computeStreak(sessions: StudySession[]) {
  const days = new Set(sessions.map((s) => new Date(s.started_at).toDateString()));
  let streak = 0;
  const d = new Date();
  while (days.has(d.toDateString())) {
    streak++;
    d.setDate(d.getDate() - 1);
  }
  return streak;
}

export function weeklyData(sessions: StudySession[]) {
  const out: { day: string; minutes: number; date: string }[] = [];
  const labels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toDateString();
    const minutes = Math.round(
      sessions
        .filter((s) => new Date(s.started_at).toDateString() === key)
        .reduce((a, s) => a + s.duration_sec, 0) / 60
    );
    out.push({ day: labels[d.getDay()], minutes, date: d.toISOString() });
  }
  return out;
}

export type Achievement = { id: string; title: string; description: string; earned: boolean; emoji: string };

export function computeAchievements(sessions: StudySession[]): Achievement[] {
  const streak = computeStreak(sessions);
  const totalMinutes = Math.round(sessions.reduce((a, s) => a + s.duration_sec, 0) / 60);
  const sessionCount = sessions.length;
  return [
    { id: "first-step", title: "First Step", description: "Complete your first study session", earned: sessionCount >= 1, emoji: "🌱" },
    { id: "streak-3", title: "On a Roll", description: "3-day study streak", earned: streak >= 3, emoji: "🔥" },
    { id: "streak-7", title: "Week Warrior", description: "7-day study streak", earned: streak >= 7, emoji: "⚡" },
    { id: "streak-30", title: "Unstoppable", description: "30-day study streak", earned: streak >= 30, emoji: "🏆" },
    { id: "hour-club", title: "Hour Club", description: "Study for 60 minutes total", earned: totalMinutes >= 60, emoji: "⏱️" },
    { id: "ten-hours", title: "Marathoner", description: "10 hours total studied", earned: totalMinutes >= 600, emoji: "🎯" },
    { id: "century", title: "Century", description: "100 sessions completed", earned: sessionCount >= 100, emoji: "💎" },
  ];
}
