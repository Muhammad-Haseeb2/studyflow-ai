// Flashcards — AI generated, smooth flip without inverted text.
import { useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Layers, Sparkles, ChevronLeft, ChevronRight, RotateCcw, Save, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { callAI } from "@/lib/ai";
import { toast } from "sonner";
import { useFlashcardDecks, newId } from "@/lib/store";
import { motion } from "framer-motion";

type Card = { front: string; back: string };

export default function Flashcards() {
  const [topic, setTopic] = useState("");
  const [loading, setLoading] = useState(false);
  const [cards, setCards] = useState<Card[]>([]);
  const [idx, setIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [decks, setDecks] = useFlashcardDecks();

  const generate = async () => {
    if (!topic.trim()) return;
    setLoading(true);
    setCards([]);
    setIdx(0);
    setFlipped(false);
    try {
      const data = await callAI<{ cards: Card[] }>({ mode: "flashcards", prompt: topic });
      setCards(data.cards || []);
    } catch (e: any) {
      toast.error(e.message || "Flashcard generation failed");
    } finally {
      setLoading(false);
    }
  };

  const next = () => {
    setFlipped(false);
    setTimeout(() => setIdx((i) => (i + 1) % cards.length), 50);
  };
  const prev = () => {
    setFlipped(false);
    setTimeout(() => setIdx((i) => (i - 1 + cards.length) % cards.length), 50);
  };
  const saveDeck = () => {
    if (!cards.length) return;
    setDecks([...decks, { id: newId(), title: topic, cards, createdAt: new Date().toISOString() }]);
    toast.success("Deck saved");
  };

  return (
    <div className="space-y-6">
      <PageHeader
        icon={Layers}
        title="Flashcards"
        description="AI-generated flashcards with smooth flip animation. Perfect for active recall."
        gradient="from-amber-500 to-orange-500"
      />

      <Card className="border-border/50 shadow-soft">
        <CardContent className="flex flex-col gap-3 p-5 sm:flex-row">
          <Input
            placeholder="Topic (e.g. Spanish food vocabulary)"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && generate()}
            className="rounded-xl"
          />
          <Button onClick={generate} disabled={loading || !topic.trim()} className="gradient-primary text-primary-foreground shadow-md">
            <Sparkles className="mr-2 h-4 w-4" />
            {loading ? "Generating…" : "Generate"}
          </Button>
        </CardContent>
      </Card>

      {cards.length > 0 && (
        <div className="flex flex-col items-center gap-4">
          <div className="text-sm text-muted-foreground">
            Card {idx + 1} of {cards.length}
          </div>

          <div className="flip-card w-full max-w-xl">
            <motion.div
              key={idx}
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              className={`flip-card-inner relative h-72 w-full cursor-pointer ${flipped ? "flipped" : ""}`}
              onClick={() => setFlipped((f) => !f)}
              style={{ transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)", transformStyle: "preserve-3d", transition: "transform 0.6s cubic-bezier(0.4,0,0.2,1)" }}
            >
              <div className="flip-face absolute inset-0 flex items-center justify-center rounded-3xl border border-border/50 bg-gradient-to-br from-card to-secondary p-8 text-center shadow-elevated">
                <div className="space-y-3">
                  <div className="text-xs uppercase tracking-widest text-muted-foreground">Question</div>
                  <div className="text-xl font-semibold leading-snug">{cards[idx].front}</div>
                  <div className="pt-2 text-xs text-muted-foreground">Tap to reveal</div>
                </div>
              </div>
              <div className="flip-face flip-back absolute inset-0 flex items-center justify-center rounded-3xl border border-primary/30 bg-gradient-to-br from-primary/10 via-card to-accent/10 p-8 text-center shadow-elevated">
                <div className="space-y-3">
                  <div className="text-xs uppercase tracking-widest text-primary">Answer</div>
                  <div className="text-lg font-medium leading-relaxed">{cards[idx].back}</div>
                </div>
              </div>
            </motion.div>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={prev} className="rounded-full">
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" onClick={() => setFlipped((f) => !f)}>
              <RotateCcw className="mr-2 h-4 w-4" /> Flip
            </Button>
            <Button variant="outline" size="icon" onClick={next} className="rounded-full">
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button variant="outline" onClick={saveDeck}>
              <Save className="mr-2 h-4 w-4" /> Save deck
            </Button>
          </div>
        </div>
      )}

      {decks.length > 0 && (
        <div>
          <h3 className="mb-3 text-sm font-semibold text-muted-foreground">Saved decks</h3>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {decks.map((d) => (
              <Card key={d.id} className="border-border/50 shadow-soft transition-all hover:shadow-elevated">
                <CardContent className="space-y-2 p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="font-semibold">{d.title}</div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-muted-foreground hover:text-destructive"
                      onClick={() => setDecks(decks.filter((x) => x.id !== d.id))}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                  <div className="text-xs text-muted-foreground">{d.cards.length} cards</div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full"
                    onClick={() => {
                      setCards(d.cards);
                      setTopic(d.title);
                      setIdx(0);
                      setFlipped(false);
                    }}
                  >
                    Study deck
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
