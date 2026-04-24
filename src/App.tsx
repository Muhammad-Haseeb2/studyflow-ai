import { lazy, Suspense } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/ThemeProvider";
import { AppLayout } from "@/components/AppLayout";
import NotFound from "./pages/NotFound.tsx";

const Dashboard = lazy(() => import("./pages/Dashboard"));
const ChatCoach = lazy(() => import("./pages/ChatCoach"));
const Quiz = lazy(() => import("./pages/Quiz"));
const Flashcards = lazy(() => import("./pages/Flashcards"));
const MindMap = lazy(() => import("./pages/MindMap"));
const Voice = lazy(() => import("./pages/Voice"));
const Essay = lazy(() => import("./pages/Essay"));
const Translator = lazy(() => import("./pages/Translator"));
const Notes = lazy(() => import("./pages/Notes"));
const CalendarPage = lazy(() => import("./pages/CalendarPage"));
const StudyTimer = lazy(() => import("./pages/StudyTimer"));

const queryClient = new QueryClient();

const Loader = () => (
  <div className="flex h-64 items-center justify-center text-sm text-muted-foreground">Loading…</div>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AppLayout>
            <Suspense fallback={<Loader />}>
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/chat" element={<ChatCoach />} />
                <Route path="/quiz" element={<Quiz />} />
                <Route path="/flashcards" element={<Flashcards />} />
                <Route path="/mindmap" element={<MindMap />} />
                <Route path="/voice" element={<Voice />} />
                <Route path="/essay" element={<Essay />} />
                <Route path="/translator" element={<Translator />} />
                <Route path="/notes" element={<Notes />} />
                <Route path="/calendar" element={<CalendarPage />} />
                <Route path="/timer" element={<StudyTimer />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </AppLayout>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
