import { lazy, Suspense } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/ThemeProvider";
import { ClockDensityProvider } from "@/hooks/useClockDensity";
import { AppLayout } from "@/components/AppLayout";
import { AuthProvider } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AdminRoute } from "@/components/AdminRoute";
import NotFound from "./pages/NotFound.tsx";

const Auth = lazy(() => import("./pages/Auth"));
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
const Admin = lazy(() => import("./pages/Admin"));
const AssignmentMaker = lazy(() => import("./pages/AssignmentMaker"));
const Settings = lazy(() => import("./pages/Settings"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 30_000, refetchOnWindowFocus: false, retry: 1 },
  },
});

const Loader = () => (
  <div className="flex h-64 items-center justify-center text-sm text-muted-foreground">Loading…</div>
);

const Protected = ({ children }: { children: React.ReactNode }) => (
  <ProtectedRoute>
    <AppLayout>
      <Suspense fallback={<Loader />}>{children}</Suspense>
    </AppLayout>
  </ProtectedRoute>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <ClockDensityProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <Suspense fallback={<Loader />}>
              <Routes>
                <Route path="/auth" element={<Auth />} />
                <Route path="/reset-password" element={<ResetPassword />} />
                <Route path="/" element={<Protected><Dashboard /></Protected>} />
                <Route path="/chat" element={<Protected><ChatCoach /></Protected>} />
                <Route path="/quiz" element={<Protected><Quiz /></Protected>} />
                <Route path="/flashcards" element={<Protected><Flashcards /></Protected>} />
                <Route path="/mindmap" element={<Protected><MindMap /></Protected>} />
                <Route path="/voice" element={<Protected><Voice /></Protected>} />
                <Route path="/essay" element={<Protected><Essay /></Protected>} />
                <Route path="/translator" element={<Protected><Translator /></Protected>} />
                <Route path="/notes" element={<Protected><Notes /></Protected>} />
                <Route path="/calendar" element={<Protected><CalendarPage /></Protected>} />
                <Route path="/timer" element={<Protected><StudyTimer /></Protected>} />
                <Route path="/assignment" element={<Protected><AssignmentMaker /></Protected>} />
                <Route path="/settings" element={<Protected><Settings /></Protected>} />
                <Route
                  path="/admin"
                  element={
                    <AdminRoute>
                      <AppLayout>
                        <Suspense fallback={<Loader />}>
                          <Admin />
                        </Suspense>
                      </AppLayout>
                    </AdminRoute>
                  }
                />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
      </ClockDensityProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
