// AI Chat Coach — streaming, mode toggle (simple/advanced/ELI10), markdown.
import { useEffect, useRef, useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { MessageSquare, Send, Sparkles, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { streamChat, type ChatMode } from "@/lib/ai";
import { MarkdownView } from "@/components/MarkdownView";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { useLocalStorage } from "@/hooks/useLocalStorage";

type Msg = { role: "user" | "assistant"; content: string };

const MODES: { id: ChatMode; label: string; emoji: string }[] = [
  { id: "chat-simple", label: "Simple", emoji: "✨" },
  { id: "chat-advanced", label: "Advanced", emoji: "🎓" },
  { id: "chat-eli10", label: "ELI10", emoji: "🧒" },
];

export default function ChatCoach() {
  const [messages, setMessages] = useLocalStorage<Msg[]>("studyflow.chat.messages", []);
  const [mode, setMode] = useLocalStorage<ChatMode>("studyflow.chat.mode", "chat-simple");
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  const send = async () => {
    const text = input.trim();
    if (!text || loading) return;
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
        onError: (m) => toast.error(m),
      });
    } catch (e: any) {
      // remove empty assistant if nothing came
      if (!acc) setMessages(next);
    } finally {
      setLoading(false);
    }
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  return (
    <div className="flex h-[calc(100vh-9rem)] flex-col gap-4">
      <PageHeader
        icon={MessageSquare}
        title="AI Study Coach"
        description="Ask anything. Pick a mode that matches how deep you want to go."
        gradient="from-indigo-500 to-purple-500"
        action={
          <div className="flex gap-1 rounded-xl bg-muted/60 p-1">
            {MODES.map((m) => (
              <button
                key={m.id}
                onClick={() => setMode(m.id)}
                className={`relative rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                  mode === m.id ? "text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {mode === m.id && (
                  <motion.div
                    layoutId="modePill"
                    className="absolute inset-0 rounded-lg gradient-primary shadow-md"
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
                <span className="relative z-10">
                  {m.emoji} {m.label}
                </span>
              </button>
            ))}
          </div>
        }
      />

      <Card className="flex min-h-0 flex-1 flex-col border-border/50 shadow-soft">
        <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto scrollbar-thin p-4 sm:p-6">
          {messages.length === 0 && (
            <div className="flex h-full min-h-[300px] flex-col items-center justify-center text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl gradient-primary shadow-glow">
                <Sparkles className="h-8 w-8 text-primary-foreground" />
              </div>
              <h3 className="text-lg font-semibold">Hey! What shall we learn today?</h3>
              <p className="mt-1 max-w-md text-sm text-muted-foreground">
                Ask about a topic, request examples, or paste your homework question.
              </p>
              <div className="mt-6 grid w-full max-w-xl grid-cols-1 gap-2 sm:grid-cols-2">
                {[
                  "Explain photosynthesis",
                  "Help me understand derivatives",
                  "Summarize World War II causes",
                  "What's Big-O notation?",
                ].map((s) => (
                  <button
                    key={s}
                    onClick={() => setInput(s)}
                    className="rounded-xl border border-border/50 bg-card p-3 text-left text-sm transition-all hover:border-primary/50 hover:bg-primary/5"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          <AnimatePresence initial={false}>
            {messages.map((m, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[88%] rounded-2xl px-4 py-3 sm:max-w-[80%] ${
                    m.role === "user"
                      ? "gradient-primary text-primary-foreground shadow-md"
                      : "border border-border/50 bg-card shadow-sm"
                  }`}
                >
                  {m.role === "user" ? (
                    <div className="whitespace-pre-wrap text-sm">{m.content}</div>
                  ) : (
                    <MarkdownView content={m.content || "…"} />
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {loading && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Loader2 className="h-3.5 w-3.5 animate-spin" /> Thinking…
            </div>
          )}
        </div>

        <div className="border-t border-border/50 p-3">
          <div className="flex items-end gap-2">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={onKeyDown}
              placeholder="Ask a question… (Shift+Enter for newline)"
              className="min-h-[44px] resize-none rounded-xl"
              rows={1}
            />
            <Button
              onClick={send}
              disabled={loading || !input.trim()}
              size="icon"
              className="h-11 w-11 shrink-0 rounded-xl gradient-primary shadow-md"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </div>
          {messages.length > 0 && (
            <button
              onClick={() => setMessages([])}
              className="mt-2 text-xs text-muted-foreground hover:text-destructive"
            >
              Clear conversation
            </button>
          )}
        </div>
      </Card>
    </div>
  );
}
