// AI Quiz Generator — Supabase-backed result history.
import { useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Brain, Sparkles, RotateCcw, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { callAI } from "@/lib/ai";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { useAddQuizResult } from "@/lib/store";
import { Progress } from "@/components/ui/progress";

type QQ = {
  type: "mcq";
  question: string;
  options: string[];
  answer: string;
  explanation: string;
  concept: string;
};

export default function Quiz() {
  const [topic, setTopic] = useState("");
  const [loading, setLoading] = useState(false);
  const [questions, setQuestions] = useState<QQ[]>([]);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const addResult = useAddQuizResult();

  const generate = async () => {
    if (!topic.trim()) return;
    setLoading(true);
    setQuestions([]);
    setAnswers({});
    setSubmitted(false);
    try {
      const data = await callAI<{ questions: QQ[] }>({ mode: "quiz", prompt: topic });
      setQuestions(data.questions || []);
    } catch (e: any) {
      toast.error(e.message || "Quiz generation failed");
    } finally {
      setLoading(false);
    }
  };

  const score = questions.reduce((acc, q, i) => {
    const a = (answers[i] || "").trim().toLowerCase();
    return acc + (a && a === q.answer.trim().toLowerCase() ? 1 : 0);
  }, 0);
  const pct = questions.length ? Math.round((score / questions.length) * 100) : 0;

  const submit = () => {
    setSubmitted(true);
    const weak = Array.from(
      new Set(
        questions
          .map((q, i) => ((answers[i] || "").trim().toLowerCase() !== q.answer.trim().toLowerCase() ? q.concept : null))
          .filter(Boolean) as string[]
      )
    );
    addResult.mutate(
      { topic, score: pct, total: questions.length, correct: score, weak_concepts: weak },
      { onError: (e: any) => toast.error(e.message) }
    );
  };

  const reset = () => {
    setQuestions([]);
    setAnswers({});
    setSubmitted(false);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        icon={Brain}
        title="AI Quiz Generator"
        description="Turn any topic into a quiz with MCQs and conceptual questions. Get instant feedback."
        gradient="from-pink-500 to-rose-500"
      />

      {questions.length === 0 ? (
        <Card className="border-border/50 shadow-soft">
          <CardContent className="space-y-3 p-5">
            <Textarea
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="Paste a topic, lecture notes, or paragraph (e.g. Newton's laws of motion)…"
              rows={5}
              className="rounded-xl"
            />
            <Button
              onClick={generate}
              disabled={loading || !topic.trim()}
              className="w-full gradient-primary text-primary-foreground shadow-md sm:w-auto"
            >
              <Sparkles className="mr-2 h-4 w-4" />
              {loading ? "Generating…" : "Generate quiz"}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          {submitted && (
            <Card className="overflow-hidden border-border/50 shadow-soft">
              <CardContent className="p-5">
                <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <div className="text-sm text-muted-foreground">Your score</div>
                    <div className="text-3xl font-bold text-gradient">
                      {score} / {questions.length}{" "}
                      <span className="text-base text-muted-foreground">({pct}%)</span>
                    </div>
                  </div>
                  <Button onClick={reset} variant="outline">
                    <RotateCcw className="mr-2 h-4 w-4" /> New quiz
                  </Button>
                </div>
                <Progress value={pct} className="mt-3 h-2" />
                {questions.length > 0 && (
                  <div className="mt-4 rounded-xl border border-border/50 bg-muted/40 p-3 text-sm">
                    <div className="mb-1 font-medium">📈 Improvement suggestions</div>
                    <ul className="list-disc pl-5 text-muted-foreground">
                      {Array.from(
                        new Set(
                          questions
                            .map((q, i) =>
                              (answers[i] || "").trim().toLowerCase() !== q.answer.trim().toLowerCase() ? q.concept : null
                            )
                            .filter(Boolean) as string[]
                        )
                      ).map((c) => (
                        <li key={c}>
                          Review <strong className="text-foreground">{c}</strong>
                        </li>
                      ))}
                      {score === questions.length && <li>You aced it! Try a harder topic 🎉</li>}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          <div className="space-y-4">
            {questions.map((q, i) => {
              const ua = answers[i] || "";
              const correct = ua.trim().toLowerCase() === q.answer.trim().toLowerCase();
              return (
                <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
                  <Card className="border-border/50 shadow-soft">
                    <CardContent className="space-y-3 p-5">
                      <div className="flex items-start gap-3">
                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg gradient-primary text-xs font-bold text-primary-foreground">
                          {i + 1}
                        </div>
                        <div className="flex-1">
                          <div className="text-xs uppercase tracking-wider text-muted-foreground">{q.type === "mcq" ? "Multiple choice" : "Conceptual"}</div>
                          <div className="mt-0.5 font-medium">{q.question}</div>
                        </div>
                      </div>

                      {q.type === "mcq" && q.options ? (
                        <div className="grid gap-2">
                          {q.options.map((opt) => {
                            const selected = ua === opt;
                            const isCorrect = submitted && opt.trim().toLowerCase() === q.answer.trim().toLowerCase();
                            const isWrong = submitted && selected && !correct;
                            return (
                              <button
                                key={opt}
                                disabled={submitted}
                                onClick={() => setAnswers({ ...answers, [i]: opt })}
                                className={`flex items-center gap-2 rounded-xl border p-3 text-left text-sm transition-all ${
                                  isCorrect
                                    ? "border-success bg-success/10 text-foreground"
                                    : isWrong
                                    ? "border-destructive bg-destructive/10 text-foreground"
                                    : selected
                                    ? "border-primary bg-primary/10"
                                    : "border-border/60 hover:border-primary/50 hover:bg-primary/5"
                                }`}
                              >
                                {submitted ? (
                                  isCorrect ? (
                                    <Check className="h-4 w-4 text-success" />
                                  ) : isWrong ? (
                                    <X className="h-4 w-4 text-destructive" />
                                  ) : (
                                    <span className="h-4 w-4" />
                                  )
                                ) : (
                                  <span className={`h-4 w-4 rounded-full border-2 ${selected ? "border-primary bg-primary" : "border-border"}`} />
                                )}
                                <span>{opt}</span>
                              </button>
                            );
                          })}
                        </div>
                      ) : (
                        <Textarea
                          value={ua}
                          onChange={(e) => setAnswers({ ...answers, [i]: e.target.value })}
                          placeholder="Type your answer…"
                          rows={2}
                          disabled={submitted}
                          className="rounded-xl"
                        />
                      )}

                      <AnimatePresence>
                        {submitted && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            className={`rounded-xl border p-3 text-sm ${correct ? "border-success/40 bg-success/5" : "border-destructive/40 bg-destructive/5"}`}
                          >
                            <div className={`font-semibold ${correct ? "text-success" : "text-destructive"}`}>
                              {correct ? "Correct ✓" : "Not quite"}
                            </div>
                            {!correct && q.type === "conceptual" && (
                              <div className="mt-1 text-xs text-muted-foreground">
                                Expected: <span className="text-foreground">{q.answer}</span>
                              </div>
                            )}
                            <div className="mt-1 text-muted-foreground">{q.explanation}</div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>

          {!submitted && (
            <div className="sticky bottom-4 z-10 flex justify-center">
              <Button
                onClick={submit}
                disabled={Object.keys(answers).length < questions.length}
                className="gradient-primary text-primary-foreground shadow-elevated"
                size="lg"
              >
                Submit quiz
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
