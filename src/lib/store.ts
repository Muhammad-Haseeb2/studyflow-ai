// Persistent app data: study sessions, goals, notes, calendar events, quiz results, flashcard decks.
import { v4 as uuid } from "uuid";
import { useLocalStorage } from "@/hooks/useLocalStorage";

export type StudySession = {
  id: string;
  startedAt: string; // ISO
  durationSec: number;
  mode: "pomodoro" | "normal";
  label?: string;
};

export type Goal = {
  id: string;
  title: string;
  targetMinutesPerDay: number;
  active: boolean;
  createdAt: string;
};

export type Note = {
  id: string;
  title: string;
  content: string; // markdown
  updatedAt: string;
};

export type CalendarEvent = {
  id: string;
  title: string;
  description?: string;
  startsAt: string; // ISO
  endsAt: string; // ISO
  category: "study" | "exam" | "revision" | "break" | "other";
  reminderMinutesBefore?: number;
  notified?: boolean;
};

export type QuizResult = {
  id: string;
  topic: string;
  takenAt: string;
  score: number; // 0-100
  total: number;
  correct: number;
  weakConcepts: string[];
};

export type FlashcardDeck = {
  id: string;
  title: string;
  cards: { front: string; back: string }[];
  createdAt: string;
};

export const newId = () => uuid();

export function useStudySessions() {
  return useLocalStorage<StudySession[]>("studyflow.sessions", []);
}
export function useGoals() {
  return useLocalStorage<Goal[]>("studyflow.goals", []);
}
export function useNotes() {
  return useLocalStorage<Note[]>("studyflow.notes", []);
}
export function useCalendarEvents() {
  return useLocalStorage<CalendarEvent[]>("studyflow.events", []);
}
export function useQuizResults() {
  return useLocalStorage<QuizResult[]>("studyflow.quizzes", []);
}
export function useFlashcardDecks() {
  return useLocalStorage<FlashcardDeck[]>("studyflow.decks", []);
}

// Aggregated computations
export function totalMinutesToday(sessions: StudySession[]) {
  const today = new Date().toDateString();
  return Math.round(
    sessions
      .filter((s) => new Date(s.startedAt).toDateString() === today)
      .reduce((acc, s) => acc + s.durationSec, 0) / 60
  );
}

export function computeStreak(sessions: StudySession[]) {
  const days = new Set(sessions.map((s) => new Date(s.startedAt).toDateString()));
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
        .filter((s) => new Date(s.startedAt).toDateString() === key)
        .reduce((a, s) => a + s.durationSec, 0) / 60
    );
    out.push({ day: labels[d.getDay()], minutes, date: d.toISOString() });
  }
  return out;
}

export type Achievement = { id: string; title: string; description: string; earned: boolean; emoji: string };

export function computeAchievements(sessions: StudySession[]): Achievement[] {
  const streak = computeStreak(sessions);
  const totalMinutes = Math.round(sessions.reduce((a, s) => a + s.durationSec, 0) / 60);
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
