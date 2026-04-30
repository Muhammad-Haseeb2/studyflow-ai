// AI Chat Coach — streaming, mode toggle (simple/advanced/ELI10), markdown.
import { useEffect, useRef, useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import {
  MessageSquare,
  Send,
  Sparkles,
  Loader2,
  Trash2,
  AlertCircle,
  Lightbulb,
  GraduationCap,
  Baby,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { streamChat, type ChatMode } from "@/lib/ai";
import { MarkdownView } from "@/components/MarkdownView";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

type Msg = { role: "user" | "assistant"; content: string };

const MODES: {
  id: ChatMode;
  label: string;
  Icon: React.ComponentType<{ className?: string }>;
  hint: string;
}[] = [
  { id: "chat-simple", label: "Simple", Icon: Lightbulb, hint: "Clear, friendly explanations" },
  { id: "chat-advanced", label: "Advanced", Icon: GraduationCap, hint: "Deep, rigorous analysis" },
  { id: "chat-eli10", label: "ELI10", Icon: Baby, hint: "Explain like I'm 10" },
];

const STARTERS = [
  { title: "Explain photosynthesis", sub: "with a quick example" },
  { title: "Help me with derivatives", sub: "step-by-step walkthrough" },
  { title: "Summarize WWII causes", sub: "in 5 bullet points" },
  { title: "What is Big-O notation?", sub: "with simple analogies" },
];

export default function ChatCoach() {
  const [messages, setMessages] = useLocalStorage<Msg[]>("studyflow.chat.messages", []);
  const [mode, setMode] = useLocalStorage<ChatMode>("studyflow.chat.mode", "chat-simple");
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const taRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  // Auto-grow textarea
  useEffect(() => {
    const el = taRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 180) + "px";
  }, [input]);

  const send = async (overrideText?: string) => {
    const text = (overrideText ?? input).trim();
    if (!text || loading) return;
    setError(null);
    const next: Msg[] = [...messages, { role: "user", content: text }];
    setMessages(next);
    setInput("");
    setLoading(true);

    let acc = "";
    setMessages([...next, { role: "assistant", content: "" }]);

    try {
      await streamChat({
        mode,
        prompt: text,
        history: messages,
        onDelta: (chunk) => {
          acc += chunk;
          setMessages([...next, { role: "assistant", content: acc }]);
        },
        onError: (m) => {
          setError(m);
          toast.error(m);
        },
      });
    } catch (e: any) {
      const msg = e?.message || "Something went wrong. Please try again.";
      setError(msg);
      if (!acc) setMessages(next);
    } finally {
      setLoading(false);
    }
  };

  const retry = () => {
    // Find last user message and resend
    const lastUser = [...messages].reverse().find((m) => m.role === "user");
    if (!lastUser) return;
    // Strip trailing empty assistant if present
    const trimmed =
      messages[messages.length - 1]?.role === "assistant" && !messages[messages.length - 1]?.content
        ? messages.slice(0, -1)
        : messages;
    setMessages(trimmed);
    send(lastUser.content);
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  return (
    <TooltipProvider delayDuration={200}>
      <div className="flex h-[calc(100vh-9rem)] flex-col gap-4">
        <PageHeader
          icon={MessageSquare}
          title="AI Study Coach"
          description="Ask anything. Pick a mode that matches how deep you want to go."
          gradient="from-indigo-500 to-purple-500"
          action={
            <div className="flex gap-1 rounded-xl border border-border/50 bg-muted/40 p-1 shadow-sm">
              {MODES.map((m) => {
                const active = mode === m.id;
                return (
                  <Tooltip key={m.id}>
                    <TooltipTrigger asChild>
                      <button
                        onClick={() => setMode(m.id)}
                        aria-pressed={active}
                        aria-label={`${m.label} mode`}
                        className={`relative flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                          active
                            ? "text-primary-foreground"
                            : "text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        {active && (
                          <motion.div
                            layoutId="modePill"
                            className="absolute inset-0 rounded-lg gradient-primary shadow-md"
                            transition={{ type: "spring", stiffness: 400, damping: 30 }}
                          />
                        )}
                        <m.Icon className="relative z-10 h-3.5 w-3.5" />
                        <span className="relative z-10">{m.label}</span>
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom">{m.hint}</TooltipContent>
                  </Tooltip>
                );
              })}
            </div>
          }
        />

        <Card className="flex min-h-0 flex-1 flex-col overflow-hidden border-border/50 shadow-soft">
          <div
            ref={scrollRef}
            className="flex-1 space-y-5 overflow-y-auto scrollbar-thin px-4 py-6 sm:px-8 sm:py-8"
          >
            {messages.length === 0 && (
              <div className="flex h-full min-h-[320px] flex-col items-center justify-center text-center">
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl gradient-primary shadow-glow"
                >
                  <Sparkles className="h-8 w-8 text-primary-foreground" />
                </motion.div>
                <h3 className="text-xl font-semibold tracking-tight">
                  Hey! What shall we learn today?
                </h3>
                <p className="mt-2 max-w-md text-sm text-muted-foreground">
                  Ask about a topic, request examples, or paste your homework question. Switch
                  modes anytime to change the explanation depth.
                </p>
                <div className="mt-8 grid w-full max-w-2xl grid-cols-1 gap-3 sm:grid-cols-2">
                  {STARTERS.map((s, i) => (
                    <motion.button
                      key={s.title}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.05 * i }}
                      onClick={() => {
                        setInput(s.title);
                        taRef.current?.focus();
                      }}
                      className="group rounded-xl border border-border/50 bg-card/60 p-4 text-left transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:bg-primary/5 hover:shadow-md"
                    >
                      <div className="flex items-center gap-2 text-sm font-medium">
                        <Sparkles className="h-3.5 w-3.5 text-primary opacity-70 transition-opacity group-hover:opacity-100" />
                        {s.title}
                      </div>
                      <div className="mt-1 text-xs text-muted-foreground">{s.sub}</div>
                    </motion.button>
                  ))}
                </div>
              </div>
            )}

            <AnimatePresence initial={false}>
              {messages.map((m, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[88%] rounded-2xl px-4 py-3 leading-relaxed sm:max-w-[78%] ${
                      m.role === "user"
                        ? "gradient-primary text-primary-foreground shadow-md"
                        : "border border-border/50 bg-card/80 shadow-sm backdrop-blur-sm"
                    }`}
                  >
                    {m.role === "user" ? (
                      <div className="whitespace-pre-wrap text-sm">{m.content}</div>
                    ) : m.content ? (
                      <MarkdownView content={m.content} />
                    ) : (
                      <div className="flex items-center gap-1.5 py-1">
                        <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground/60 [animation-delay:-0.3s]" />
                        <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground/60 [animation-delay:-0.15s]" />
                        <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground/60" />
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {error && !loading && (
              <motion.div
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-start gap-3 rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-sm"
              >
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
                <div className="flex-1">
                  <div className="font-medium text-destructive">Couldn't get a response</div>
                  <div className="text-xs text-muted-foreground">{error}</div>
                </div>
                <Button size="sm" variant="outline" onClick={retry}>
                  Retry
                </Button>
              </motion.div>
            )}
          </div>

          <div className="border-t border-border/50 bg-background/60 p-3 backdrop-blur-sm sm:p-4">
            <div className="flex items-end gap-2">
              <div className="flex-1 rounded-2xl border border-border/60 bg-background px-3 py-2 transition-colors focus-within:border-primary/50 focus-within:ring-2 focus-within:ring-primary/20">
                <Textarea
                  ref={taRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={onKeyDown}
                  placeholder="Ask a question…  (Shift + Enter for newline)"
                  className="min-h-[36px] resize-none border-0 bg-transparent p-0 shadow-none focus-visible:ring-0"
                  rows={1}
                  disabled={loading}
                />
              </div>
              <Button
                onClick={() => send()}
                disabled={loading || !input.trim()}
                size="icon"
                aria-label="Send message"
                className="h-11 w-11 shrink-0 rounded-xl gradient-primary shadow-md transition-transform hover:scale-105 active:scale-95"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
            <div className="mt-2 flex items-center justify-between px-1 text-[11px] text-muted-foreground">
              <span>
                Mode:{" "}
                <span className="font-medium text-foreground">
                  {MODES.find((m) => m.id === mode)?.label}
                </span>
              </span>
              {messages.length > 0 && (
                <button
                  onClick={() => {
                    setMessages([]);
                    setError(null);
                  }}
                  className="inline-flex items-center gap-1 transition-colors hover:text-destructive"
                >
                  <Trash2 className="h-3 w-3" /> Clear conversation
                </button>
              )}
            </div>
          </div>
        </Card>
      </div>
    </TooltipProvider>
  );
}
