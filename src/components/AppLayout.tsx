// Studyflow app shell with collapsible sidebar, topbar (theme toggle), and animated route transitions.
import { NavLink, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "@/components/ThemeProvider";
import {
  LayoutDashboard,
  MessageSquare,
  Brain,
  Layers,
  Network,
  Mic,
  PenLine,
  Languages,
  NotebookPen,
  Calendar,
  Timer,
  Moon,
  Sun,
  Sparkles,
  Menu,
  X,
  Shield,
  GraduationCap,
} from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { LogOut, User as UserIcon } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard, color: "from-violet-500 to-fuchsia-500" },
  { to: "/chat", label: "AI Coach", icon: MessageSquare, color: "from-indigo-500 to-purple-500" },
  { to: "/quiz", label: "Quiz", icon: Brain, color: "from-pink-500 to-rose-500" },
  { to: "/flashcards", label: "Flashcards", icon: Layers, color: "from-amber-500 to-orange-500" },
  { to: "/mindmap", label: "Mind Map", icon: Network, color: "from-emerald-500 to-teal-500" },
  { to: "/voice", label: "Voice Mode", icon: Mic, color: "from-sky-500 to-cyan-500" },
  { to: "/essay", label: "Essay Writer", icon: PenLine, color: "from-blue-500 to-indigo-500" },
  { to: "/assignment", label: "Assignment Maker", icon: GraduationCap, color: "from-violet-500 to-purple-600" },
  { to: "/translator", label: "Translator", icon: Languages, color: "from-teal-500 to-emerald-500" },
  { to: "/notes", label: "Notes", icon: NotebookPen, color: "from-purple-500 to-pink-500" },
  { to: "/calendar", label: "Calendar", icon: Calendar, color: "from-orange-500 to-red-500" },
  { to: "/timer", label: "Study Timer", icon: Timer, color: "from-rose-500 to-pink-500" },
];

export function AppLayout({ children }: { children: ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [now, setNow] = useState(() => new Date());
  const { resolved, setTheme } = useTheme();
  const location = useLocation();
  const { user, signOut } = useAuth();
  const { isAdmin } = useIsAdmin();

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const nav = isAdmin
    ? [...NAV, { to: "/admin", label: "Admin", icon: Shield, color: "from-red-500 to-orange-500" }]
    : NAV;
  const initials = (user?.user_metadata?.display_name || user?.email || "U")
    .toString()
    .split(/[\s@]/)
    .filter(Boolean)
    .map((s: string) => s[0]?.toUpperCase())
    .slice(0, 2)
    .join("");

  const timeStr = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  const dateStr = now.toLocaleDateString([], { weekday: "short", month: "short", day: "numeric" });

  const SidebarBody = (
    <nav className="flex flex-col gap-1 p-3">
      <div className="flex items-center gap-2 px-3 py-4">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl gradient-primary shadow-glow">
          <Sparkles className="h-5 w-5 text-primary-foreground" />
        </div>
        <div className="flex flex-col">
          <span className="text-base font-bold leading-tight">Studyflow</span>
          <span className="text-[10px] uppercase tracking-wider text-muted-foreground">AI Study Helper</span>
        </div>
      </div>
      <div className="mt-2 flex flex-col gap-0.5">
        {nav.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === "/"}
            onClick={() => setMobileOpen(false)}
            className={({ isActive }) =>
              cn(
                "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all",
                isActive
                  ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-sm"
                  : "text-sidebar-foreground/80 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground"
              )
            }
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <motion.div
                    layoutId="activePill"
                    className="absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r-full gradient-primary"
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
                <span
                  className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-lg transition-all",
                    isActive ? `bg-gradient-to-br ${item.color} text-white shadow-md` : "bg-muted/50"
                  )}
                >
                  <item.icon className="h-4 w-4" />
                </span>
                <span>{item.label}</span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );

  return (
    <div className="relative min-h-screen w-full bg-background">
      {/* Mesh background */}
      <div className="pointer-events-none fixed inset-0 -z-10 gradient-mesh opacity-60" />

      <div className="flex min-h-screen w-full">
        {/* Desktop sidebar */}
        <aside className="sticky top-0 hidden h-screen w-64 shrink-0 border-r border-sidebar-border bg-sidebar/80 backdrop-blur-xl lg:block">
          <div className="h-full overflow-y-auto scrollbar-thin">{SidebarBody}</div>
        </aside>

        {/* Mobile sidebar */}
        <AnimatePresence>
          {mobileOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setMobileOpen(false)}
                className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm lg:hidden"
              />
              <motion.aside
                initial={{ x: -300 }}
                animate={{ x: 0 }}
                exit={{ x: -300 }}
                transition={{ type: "spring", stiffness: 300, damping: 32 }}
                className="fixed inset-y-0 left-0 z-50 w-72 overflow-y-auto border-r border-sidebar-border bg-sidebar shadow-elevated lg:hidden"
              >
                <div className="flex justify-end p-2">
                  <Button variant="ghost" size="icon" onClick={() => setMobileOpen(false)}>
                    <X className="h-5 w-5" />
                  </Button>
                </div>
                {SidebarBody}
              </motion.aside>
            </>
          )}
        </AnimatePresence>

        {/* Main */}
        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-border/50 bg-background/70 px-4 backdrop-blur-xl">
            <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setMobileOpen(true)}>
              <Menu className="h-5 w-5" />
            </Button>
            <div className="flex flex-1 items-center gap-2">
              <h1 className="text-sm font-semibold text-muted-foreground">
                {nav.find((n) => (n.to === "/" ? location.pathname === "/" : location.pathname.startsWith(n.to)))?.label || "Studyflow"}
              </h1>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(resolved === "dark" ? "light" : "dark")}
              aria-label="Toggle theme"
            >
              {resolved === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </Button>
            {user && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="rounded-full" aria-label="Account">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-gradient-to-br from-primary to-primary/60 text-primary-foreground text-xs">
                        {initials || <UserIcon className="h-4 w-4" />}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium">{user.user_metadata?.display_name || "Student"}</p>
                      <p className="truncate text-xs text-muted-foreground">{user.email}</p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => signOut()} className="cursor-pointer">
                    <LogOut className="mr-2 h-4 w-4" /> Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </header>

          <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
            <AnimatePresence mode="wait">
              <motion.div
                key={location.pathname}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
                className="mx-auto w-full max-w-7xl"
              >
                {children}
              </motion.div>
            </AnimatePresence>
          </main>
        </div>
      </div>
    </div>
  );
}
