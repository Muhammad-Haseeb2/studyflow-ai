// Public marketing landing page (shown when logged out at "/").
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Sparkles,
  Brain,
  MessageSquare,
  Layers,
  Network,
  Mic,
  PenLine,
  NotebookPen,
  Calendar,
  Timer,
  Languages,
  GraduationCap,
  ArrowRight,
  Mail,
  Linkedin,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const FEATURES = [
  { icon: MessageSquare, title: "AI Coach", desc: "Chat with a tutor that adapts to your level." },
  { icon: Brain, title: "Smart Quizzes", desc: "Generate 3–15 MCQs from any topic, instantly." },
  { icon: Layers, title: "Flashcards", desc: "Auto-built decks you can save and review later." },
  { icon: Network, title: "Mind Maps", desc: "Visualize concepts hierarchically with one click." },
  { icon: Mic, title: "Voice Mode", desc: "Speak in your language — get spoken answers back." },
  { icon: PenLine, title: "Essay Writer", desc: "Drafts in academic, APA & MLA styles." },
  { icon: GraduationCap, title: "Assignment Maker", desc: "Title page, references, and clean DOCX/PDF export." },
  { icon: NotebookPen, title: "Notes", desc: "AI-generated, beautifully structured study notes." },
  { icon: Calendar, title: "Calendar", desc: "Plan study sessions, exams, and revisions." },
  { icon: Timer, title: "Focus Timer", desc: "Pomodoro & free timers that sync to your dashboard." },
  { icon: Languages, title: "Translator", desc: "Translate notes & passages, formatting preserved." },
  { icon: Sparkles, title: "Insights", desc: "Track progress, weak concepts, and study streaks." },
];

const HIGHLIGHTS = [
  "12+ AI-powered study tools in one place",
  "Works in English, Urdu, Arabic, Hindi & more",
  "Your data stays private and secure",
  "Free to start — no credit card needed",
];

export default function Landing() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Mesh background */}
      <div className="pointer-events-none fixed inset-0 -z-10 gradient-mesh opacity-50" />

      {/* Nav */}
      <header className="sticky top-0 z-30 border-b border-border/50 bg-background/70 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link to="/" className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl gradient-primary shadow-glow">
              <Sparkles className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-lg font-bold">Studyflow</span>
          </Link>
          <nav className="hidden items-center gap-6 text-sm md:flex">
            <a href="#features" className="text-muted-foreground hover:text-foreground">Features</a>
            <Link to="/about" className="text-muted-foreground hover:text-foreground">About</Link>
            <Link to="/privacy" className="text-muted-foreground hover:text-foreground">Privacy</Link>
            <Link to="/terms" className="text-muted-foreground hover:text-foreground">Terms</Link>
          </nav>
          <div className="flex items-center gap-2">
            <Link to="/auth">
              <Button variant="ghost" size="sm">Sign in</Button>
            </Link>
            <Link to="/auth">
              <Button size="sm" className="gradient-primary text-primary-foreground shadow-md">
                Get started
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mx-auto max-w-3xl text-center"
        >
          <span className="mb-4 inline-flex items-center gap-2 rounded-full border border-border/60 bg-muted/40 px-3 py-1 text-xs font-medium text-muted-foreground">
            <Sparkles className="h-3 w-3 text-primary" /> AI-powered study companion
          </span>
          <h1 className="text-4xl font-bold tracking-tight sm:text-6xl">
            Study smarter with{" "}
            <span className="bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
              your own AI tutor
            </span>
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg text-muted-foreground">
            Quizzes, flashcards, mind maps, voice tutoring, essays, assignments and more —
            all in one calm, focused workspace built for students.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link to="/auth">
              <Button size="lg" className="gradient-primary text-primary-foreground shadow-md">
                Get started free <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <a href="#features">
              <Button size="lg" variant="outline">See features</Button>
            </a>
          </div>
          <ul className="mx-auto mt-8 grid max-w-2xl grid-cols-1 gap-2 text-sm text-muted-foreground sm:grid-cols-2">
            {HIGHLIGHTS.map((h) => (
              <li key={h} className="flex items-center gap-2">
                <Check className="h-4 w-4 text-primary" /> {h}
              </li>
            ))}
          </ul>
        </motion.div>
      </section>

      {/* Features */}
      <section id="features" className="mx-auto max-w-7xl px-4 pb-20 sm:px-6 lg:px-8">
        <div className="mx-auto mb-10 max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Everything you need to learn</h2>
          <p className="mt-3 text-muted-foreground">
            One app. Twelve tools. Zero friction.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f, i) => {
            const Icon = f.icon;
            return (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 8 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.04 }}
              >
                <Card className="h-full border-border/50 transition-all hover:border-primary/40 hover:shadow-md">
                  <CardContent className="p-5">
                    <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl gradient-primary shadow-glow">
                      <Icon className="h-5 w-5 text-primary-foreground" />
                    </div>
                    <h3 className="font-semibold">{f.title}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">{f.desc}</p>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-5xl px-4 pb-24 sm:px-6 lg:px-8">
        <Card className="overflow-hidden border-primary/30 bg-gradient-to-br from-primary/10 via-background to-primary/5 shadow-elevated">
          <CardContent className="flex flex-col items-center gap-4 p-10 text-center sm:p-14">
            <h2 className="text-3xl font-bold sm:text-4xl">Ready to study smarter?</h2>
            <p className="max-w-xl text-muted-foreground">
              Create your free account in seconds and start learning with your AI tutor today.
            </p>
            <Link to="/auth">
              <Button size="lg" className="gradient-primary text-primary-foreground shadow-md">
                Get started free <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/50 bg-muted/20">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
            <div>
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg gradient-primary">
                  <Sparkles className="h-4 w-4 text-primary-foreground" />
                </div>
                <span className="font-bold">Studyflow</span>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                Built with care by Muhammad Haseeb.
              </p>
            </div>

            <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
              <Link to="/about" className="text-muted-foreground hover:text-foreground">About</Link>
              <Link to="/privacy" className="text-muted-foreground hover:text-foreground">Privacy</Link>
              <Link to="/terms" className="text-muted-foreground hover:text-foreground">Terms</Link>
              <a href="#features" className="text-muted-foreground hover:text-foreground">Features</a>
            </div>

            <div className="flex flex-col gap-2 text-sm">
              <a
                href="mailto:itxhaseeb36@gmail.com"
                className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
              >
                <Mail className="h-4 w-4" /> itxhaseeb36@gmail.com
              </a>
              <a
                href="https://www.linkedin.com/in/muhammad-haseeb-hsb"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
              >
                <Linkedin className="h-4 w-4" /> linkedin.com/in/muhammad-haseeb-hsb
              </a>
            </div>
          </div>
          <div className="mt-8 border-t border-border/50 pt-6 text-center text-xs text-muted-foreground">
            © {new Date().getFullYear()} Studyflow. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
