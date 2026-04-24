// AI Notes Maker — generate, edit, save (Supabase), export.
import { useEffect, useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { NotebookPen, Sparkles, Save, Trash2, Download, Plus, Edit3, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { callAI } from "@/lib/ai";
import { toast } from "sonner";
import { MarkdownView } from "@/components/MarkdownView";
import { useNotes, useNoteMutations } from "@/lib/store";
import { motion } from "framer-motion";

export default function Notes() {
  const { data: notes = [] } = useNotes();
  const { create, update, remove } = useNoteMutations();
  const [topic, setTopic] = useState("");
  const [loading, setLoading] = useState(false);
  const [active, setActive] = useState<string | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [draft, setDraft] = useState<{ title: string; content: string } | null>(null);

  const current = notes.find((n) => n.id === active) || null;

  // Hydrate draft when switching notes
  useEffect(() => {
    if (current) setDraft({ title: current.title, content: current.content });
    else setDraft(null);
  }, [current?.id]);

  // Debounced auto-save
  useEffect(() => {
    if (!current || !draft) return;
    if (draft.title === current.title && draft.content === current.content) return;
    const t = setTimeout(() => {
      update.mutate({ id: current.id, title: draft.title, content: draft.content });
    }, 600);
    return () => clearTimeout(t);
  }, [draft, current?.id]);

  const generate = async () => {
    if (!topic.trim()) return;
    setLoading(true);
    try {
      const data = await callAI<{ content: string }>({ mode: "notes", prompt: topic });
      const created = await create.mutateAsync({ title: topic, content: data.content || "" });
      setActive(created.id);
      setTopic("");
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  };

  const exportNote = (kind: "md" | "txt") => {
    if (!current) return;
    const blob = new Blob([draft?.content ?? current.content], {
      type: kind === "md" ? "text/markdown" : "text/plain",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${(draft?.title ?? current.title).slice(0, 40)}.${kind}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const newBlank = async () => {
    const created = await create.mutateAsync({ title: "Untitled note", content: "# Untitled\n\nStart writing…" });
    setActive(created.id);
    setEditMode(true);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        icon={NotebookPen}
        title="AI Notes"
        description="Generate beautifully structured study notes from any topic. Edit, save, export."
        gradient="from-purple-500 to-pink-500"
      />

      <Card className="border-border/50 shadow-soft">
        <CardContent className="flex flex-col gap-3 p-5 sm:flex-row">
          <Input
            placeholder="Topic (e.g. Photosynthesis for grade 9)"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && generate()}
            className="rounded-xl"
          />
          <Button onClick={generate} disabled={loading || !topic.trim()} className="gradient-primary text-primary-foreground shadow-md">
            <Sparkles className="mr-2 h-4 w-4" />
            {loading ? "Generating…" : "Generate notes"}
          </Button>
          <Button variant="outline" onClick={newBlank}>
            <Plus className="mr-2 h-4 w-4" /> Blank
          </Button>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
        <Card className="border-border/50 shadow-soft">
          <CardContent className="space-y-1 p-3">
            {notes.length === 0 ? (
              <p className="p-4 text-center text-sm text-muted-foreground">No notes yet</p>
            ) : (
              notes.map((n) => (
                <motion.button
                  key={n.id}
                  layout
                  onClick={() => {
                    setActive(n.id);
                    setEditMode(false);
                  }}
                  className={`group flex w-full items-start justify-between gap-2 rounded-xl p-3 text-left transition-all ${
                    active === n.id ? "bg-primary/10" : "hover:bg-muted/60"
                  }`}
                >
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium">{n.title}</div>
                    <div className="text-[10px] text-muted-foreground">{new Date(n.updated_at).toLocaleDateString()}</div>
                  </div>
                  <Trash2
                    className="h-3.5 w-3.5 opacity-0 transition-opacity group-hover:opacity-60 hover:text-destructive hover:opacity-100"
                    onClick={(e) => {
                      e.stopPropagation();
                      remove.mutate(n.id);
                      if (active === n.id) setActive(null);
                    }}
                  />
                </motion.button>
              ))
            )}
          </CardContent>
        </Card>

        <Card className="border-border/50 shadow-soft">
          <CardContent className="p-5">
            {!current || !draft ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <NotebookPen className="mb-3 h-10 w-10 text-muted-foreground/50" />
                <p className="text-sm text-muted-foreground">Select a note or generate a new one.</p>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  {editMode ? (
                    <Input
                      value={draft.title}
                      onChange={(e) => setDraft({ ...draft, title: e.target.value })}
                      className="flex-1 rounded-xl text-base font-semibold"
                    />
                  ) : (
                    <h2 className="flex-1 truncate text-lg font-semibold">{draft.title}</h2>
                  )}
                  <Button variant="outline" size="sm" onClick={() => setEditMode((v) => !v)}>
                    {editMode ? <Eye className="mr-1.5 h-4 w-4" /> : <Edit3 className="mr-1.5 h-4 w-4" />}
                    {editMode ? "Preview" : "Edit"}
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => exportNote("md")}>
                    <Download className="mr-1.5 h-4 w-4" /> .md
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => exportNote("txt")}>
                    <Download className="mr-1.5 h-4 w-4" /> .txt
                  </Button>
                </div>
                {editMode ? (
                  <Textarea
                    value={draft.content}
                    onChange={(e) => setDraft({ ...draft, content: e.target.value })}
                    rows={20}
                    className="rounded-xl font-mono text-sm"
                  />
                ) : (
                  <div className="min-h-[300px]">
                    <MarkdownView content={draft.content} />
                  </div>
                )}
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Save className="h-3 w-3" /> Auto-saved · {new Date(current.updated_at).toLocaleTimeString()}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
