// AI Assignment Maker — multi-step flow: input → options → generate → preview → download.
import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileText,
  Upload,
  Wand2,
  Loader2,
  Download,
  Eye,
  ChevronLeft,
  ChevronRight,
  Trash2,
  Clock,
  CheckCircle2,
  PenTool,
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { toast } from "@/hooks/use-toast";
import { extractTextFromFile } from "@/lib/fileExtract";
import {
  downloadDocx,
  downloadPdf,
  generateDocx,
  generatePdf,
  type AssignmentContent,
  type ExportOptions,
} from "@/lib/assignmentExport";
import { cn } from "@/lib/utils";

type Level = "basic" | "medium" | "advanced";
type Style = "academic" | "formal" | "simple";
type HwStyle = "neat" | "cursive" | "rough";
type Step = 1 | 2 | 3 | 4;

const HW_FONTS: Record<HwStyle, string> = {
  neat: "Kalam, cursive",
  cursive: "'Dancing Script', cursive",
  rough: "Caveat, cursive",
};

type AssignmentRow = {
  id: string;
  title: string;
  topic: string | null;
  level: string;
  language: string;
  formatting_style: string;
  word_count: number;
  include_title_page: boolean;
  include_references: boolean;
  source_input: string | null;
  source_filename: string | null;
  content: AssignmentContent;
  references_list: string[];
  docx_path: string | null;
  pdf_path: string | null;
  created_at: string;
};

export default function AssignmentMaker() {
  const { user } = useAuth();
  const qc = useQueryClient();

  const [step, setStep] = useState<Step>(1);
  const [sourceText, setSourceText] = useState("");
  const [sourceFilename, setSourceFilename] = useState<string | null>(null);
  const [topic, setTopic] = useState("");
  const [extracting, setExtracting] = useState(false);

  // Options
  const [level, setLevel] = useState<Level>("medium");
  const [language, setLanguage] = useState("English");
  const [formattingStyle, setFormattingStyle] = useState<Style>("academic");
  const [wordCount, setWordCount] = useState(800);
  const [includeTitlePage, setIncludeTitlePage] = useState(true);
  const [includeReferences, setIncludeReferences] = useState(false);
  const [authorName, setAuthorName] = useState(
    (user?.user_metadata?.display_name as string) || "",
  );

  // Output
  const [content, setContent] = useState<AssignmentContent | null>(null);
  const [generating, setGenerating] = useState(false);
  const [savedId, setSavedId] = useState<string | null>(null);

  // Preview
  const [previewMode, setPreviewMode] = useState<"typed" | "handwritten">("typed");
  const [hwStyle, setHwStyle] = useState<HwStyle>("neat");

  const fileInputRef = useRef<HTMLInputElement>(null);

  // ===== Past assignments =====
  const { data: history = [] } = useQuery({
    queryKey: ["assignments", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("assignments")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(20);
      if (error) throw error;
      return (data || []) as unknown as AssignmentRow[];
    },
  });

  const deleteMut = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("assignments").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["assignments", user?.id] }),
  });

  // ===== File handling =====
  const onFile = async (file: File) => {
    if (file.size > 10 * 1024 * 1024) {
      toast({ title: "File too large", description: "Max 10 MB.", variant: "destructive" });
      return;
    }
    setExtracting(true);
    try {
      const text = await extractTextFromFile(file);
      setSourceText(text);
      setSourceFilename(file.name);
      toast({ title: "File loaded", description: `${file.name} — ${text.length.toLocaleString()} chars extracted.` });
    } catch (e) {
      toast({
        title: "Couldn't read file",
        description: e instanceof Error ? e.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setExtracting(false);
    }
  };

  // ===== Generation =====
  const generate = async () => {
    if (!topic.trim() && !sourceText.trim()) {
      toast({ title: "Add a topic or upload a file", variant: "destructive" });
      return;
    }
    setGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke("ai-assignment", {
        body: {
          action: "generate",
          topic: topic.trim() || undefined,
          sourceText: sourceText.trim() || undefined,
          level,
          language,
          formattingStyle,
          wordCount,
          includeReferences,
        },
      });
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);

      const generated = data as AssignmentContent;
      setContent(generated);

      // Save to DB
      if (user) {
        const { data: inserted, error: insErr } = await supabase
          .from("assignments")
          .insert({
            user_id: user.id,
            title: generated.title || "Untitled assignment",
            topic: generated.topic || topic || null,
            level,
            language,
            formatting_style: formattingStyle,
            word_count: wordCount,
            include_title_page: includeTitlePage,
            include_references: includeReferences,
            source_input: sourceText || null,
            source_filename: sourceFilename,
            content: generated as any,
            references_list: (generated.references || []) as any,
          })
          .select("id")
          .single();
        if (insErr) {
          console.error(insErr);
        } else {
          setSavedId(inserted.id);
          qc.invalidateQueries({ queryKey: ["assignments", user.id] });
        }
      }
      setStep(4);
    } catch (e) {
      toast({
        title: "Generation failed",
        description: e instanceof Error ? e.message : "Try again",
        variant: "destructive",
      });
    } finally {
      setGenerating(false);
    }
  };

  // ===== Export & store files =====
  const buildOpts = (handwritten: boolean): ExportOptions => ({
    includeTitlePage,
    includeReferences,
    handwritten,
    handwritingStyle: hwStyle,
    authorName: authorName || undefined,
  });

  const uploadAndStorePath = async (
    blob: Blob,
    ext: "docx" | "pdf",
    column: "docx_path" | "pdf_path",
  ) => {
    if (!user || !savedId) return;
    const path = `${user.id}/${savedId}.${ext}`;
    const { error } = await supabase.storage
      .from("assignment-files")
      .upload(path, blob, { upsert: true, contentType: blob.type });
    if (error) {
      console.warn("upload failed", error);
      return;
    }
    const update = column === "docx_path" ? { docx_path: path } : { pdf_path: path };
    await supabase.from("assignments").update(update).eq("id", savedId);
    qc.invalidateQueries({ queryKey: ["assignments", user.id] });
  };

  const exportDocx = async () => {
    if (!content) return;
    const filename = (content.title || "assignment").replace(/[^\w\s-]/g, "").trim() || "assignment";
    const handwritten = previewMode === "handwritten";
    const opts = buildOpts(handwritten);
    const blob = await generateDocx(content, opts);
    const { saveAs } = await import("file-saver");
    saveAs(blob, `${filename}${handwritten ? "-handwritten" : ""}.docx`);
    await uploadAndStorePath(blob, "docx", "docx_path");
    toast({ title: "DOCX downloaded" });
  };

  const exportPdf = async () => {
    if (!content) return;
    const filename = (content.title || "assignment").replace(/[^\w\s-]/g, "").trim() || "assignment";
    const opts = buildOpts(previewMode === "handwritten");
    const blob = generatePdf(content, opts);
    const { saveAs } = await import("file-saver");
    saveAs(blob, `${filename}.pdf`);
    await uploadAndStorePath(blob, "pdf", "pdf_path");
    toast({ title: "PDF downloaded" });
  };

  // ===== Reset / load past =====
  const startNew = () => {
    setStep(1);
    setSourceText("");
    setSourceFilename(null);
    setTopic("");
    setContent(null);
    setSavedId(null);
  };

  const loadPast = (a: AssignmentRow) => {
    setContent(a.content);
    setLevel((a.level as Level) || "medium");
    setLanguage(a.language || "English");
    setFormattingStyle((a.formatting_style as Style) || "academic");
    setWordCount(a.word_count || 800);
    setIncludeTitlePage(a.include_title_page);
    setIncludeReferences(a.include_references);
    setSavedId(a.id);
    setStep(4);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // ===== Step indicator =====
  const steps = [
    { n: 1, label: "Input" },
    { n: 2, label: "Options" },
    { n: 3, label: "Generate" },
    { n: 4, label: "Preview" },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        icon={PenTool}
        title="AI Assignment Maker"
        description="Upload a brief or type a topic, choose your style, and get a polished assignment in seconds."
        gradient="from-violet-500 to-purple-600"
      />

      {/* Stepper */}
      <div className="flex items-center justify-between gap-2 rounded-2xl border bg-card/60 p-3 backdrop-blur">
        {steps.map((s, i) => (
          <div key={s.n} className="flex flex-1 items-center gap-2">
            <button
              onClick={() => content && setStep(s.n as Step)}
              disabled={!content && s.n > step}
              className={cn(
                "flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition-colors",
                step === s.n
                  ? "bg-primary text-primary-foreground"
                  : step > s.n
                    ? "text-foreground"
                    : "text-muted-foreground",
                content || s.n <= step ? "cursor-pointer" : "cursor-not-allowed opacity-50",
              )}
            >
              <span
                className={cn(
                  "flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold",
                  step >= s.n ? "bg-background/20" : "bg-muted",
                )}
              >
                {step > s.n ? <CheckCircle2 className="h-4 w-4" /> : s.n}
              </span>
              <span className="hidden sm:inline">{s.label}</span>
            </button>
            {i < steps.length - 1 && <div className="h-px flex-1 bg-border" />}
          </div>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {step === 1 && (
          <motion.div
            key="step1"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
            className="grid gap-6 lg:grid-cols-2"
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Upload className="h-5 w-5" /> Upload a brief
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex h-40 w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border bg-muted/30 transition-colors hover:bg-muted/50"
                >
                  {extracting ? (
                    <>
                      <Loader2 className="h-6 w-6 animate-spin text-primary" />
                      <span className="text-sm text-muted-foreground">Extracting text…</span>
                    </>
                  ) : sourceFilename ? (
                    <>
                      <FileText className="h-6 w-6 text-primary" />
                      <span className="text-sm font-medium">{sourceFilename}</span>
                      <span className="text-xs text-muted-foreground">{sourceText.length.toLocaleString()} chars</span>
                    </>
                  ) : (
                    <>
                      <Upload className="h-6 w-6 text-muted-foreground" />
                      <span className="text-sm font-medium">Click to upload</span>
                      <span className="text-xs text-muted-foreground">PDF, DOCX or TXT (≤10 MB)</span>
                    </>
                  )}
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.docx,.txt,application/pdf,text/plain,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) onFile(f);
                    e.target.value = "";
                  }}
                />
                {sourceFilename && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSourceFilename(null);
                      setSourceText("");
                    }}
                  >
                    Remove file
                  </Button>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" /> Or describe the topic
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Textarea
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="e.g. Write a 1000-word assignment on the causes and consequences of climate change, with academic tone and clear sections."
                  className="min-h-[160px]"
                />
                <p className="text-xs text-muted-foreground">
                  You can combine both: upload a brief AND add extra instructions below.
                </p>
              </CardContent>
            </Card>

            <div className="lg:col-span-2 flex justify-end">
              <Button
                size="lg"
                onClick={() => setStep(2)}
                disabled={!sourceText.trim() && !topic.trim()}
              >
                Continue <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            </div>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div
            key="step2"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
            className="space-y-6"
          >
            <Card>
              <CardHeader>
                <CardTitle>Assignment options</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Academic level</Label>
                  <RadioGroup value={level} onValueChange={(v) => setLevel(v as Level)} className="grid grid-cols-3 gap-2">
                    {(["basic", "medium", "advanced"] as Level[]).map((l) => (
                      <Label
                        key={l}
                        htmlFor={`lvl-${l}`}
                        className={cn(
                          "flex cursor-pointer flex-col items-center gap-1 rounded-xl border p-3 text-sm capitalize transition-colors",
                          level === l ? "border-primary bg-primary/10" : "hover:bg-muted/50",
                        )}
                      >
                        <RadioGroupItem id={`lvl-${l}`} value={l} className="sr-only" />
                        {l}
                      </Label>
                    ))}
                  </RadioGroup>
                </div>

                <div className="space-y-2">
                  <Label>Formatting style</Label>
                  <Select value={formattingStyle} onValueChange={(v) => setFormattingStyle(v as Style)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="academic">Academic</SelectItem>
                      <SelectItem value="formal">Formal</SelectItem>
                      <SelectItem value="simple">Simple</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Language</Label>
                  <Select value={language} onValueChange={setLanguage}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {["English", "Spanish", "French", "German", "Hindi", "Arabic", "Portuguese", "Italian", "Chinese", "Japanese"].map(
                        (l) => (
                          <SelectItem key={l} value={l}>
                            {l}
                          </SelectItem>
                        ),
                      )}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Author name (for title page)</Label>
                  <Input value={authorName} onChange={(e) => setAuthorName(e.target.value)} placeholder="Your name" />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <div className="flex items-center justify-between">
                    <Label>Target word count</Label>
                    <Badge variant="secondary">{wordCount} words</Badge>
                  </div>
                  <Slider
                    value={[wordCount]}
                    onValueChange={(v) => setWordCount(v[0])}
                    min={300}
                    max={3000}
                    step={100}
                  />
                </div>

                <div className="flex items-center justify-between rounded-xl border p-3">
                  <div>
                    <Label className="text-sm">Include title page</Label>
                    <p className="text-xs text-muted-foreground">Cover with title + author</p>
                  </div>
                  <Switch checked={includeTitlePage} onCheckedChange={setIncludeTitlePage} />
                </div>

                <div className="flex items-center justify-between rounded-xl border p-3">
                  <div>
                    <Label className="text-sm">Include references</Label>
                    <p className="text-xs text-muted-foreground">Add a references section</p>
                  </div>
                  <Switch checked={includeReferences} onCheckedChange={setIncludeReferences} />
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep(1)}>
                <ChevronLeft className="mr-1 h-4 w-4" /> Back
              </Button>
              <Button size="lg" onClick={() => setStep(3)}>
                Continue <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            </div>
          </motion.div>
        )}

        {step === 3 && (
          <motion.div
            key="step3"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
            className="space-y-6"
          >
            <Card>
              <CardHeader>
                <CardTitle>Review & generate</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-3 text-sm sm:grid-cols-2">
                  <Row k="Source" v={sourceFilename || (sourceText ? "Pasted text" : "—")} />
                  <Row k="Topic" v={topic ? topic.slice(0, 80) + (topic.length > 80 ? "…" : "") : "—"} />
                  <Row k="Level" v={level} />
                  <Row k="Language" v={language} />
                  <Row k="Style" v={formattingStyle} />
                  <Row k="Words" v={`~${wordCount}`} />
                  <Row k="Title page" v={includeTitlePage ? "Yes" : "No"} />
                  <Row k="References" v={includeReferences ? "Yes" : "No"} />
                </div>

                <Button onClick={generate} disabled={generating} size="lg" className="w-full gap-2">
                  {generating ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Generating your assignment…
                    </>
                  ) : (
                    <>
                      <Wand2 className="h-5 w-5" />
                      Generate assignment
                    </>
                  )}
                </Button>
                {generating && (
                  <p className="text-center text-xs text-muted-foreground">
                    This usually takes 10–30 seconds depending on length.
                  </p>
                )}
              </CardContent>
            </Card>

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep(2)} disabled={generating}>
                <ChevronLeft className="mr-1 h-4 w-4" /> Back
              </Button>
            </div>
          </motion.div>
        )}

        {step === 4 && content && (
          <motion.div
            key="step4"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
            className="space-y-6"
          >
            <Card>
              <CardHeader className="flex flex-row items-start justify-between gap-4">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Eye className="h-5 w-5" /> Preview
                  </CardTitle>
                  <p className="mt-1 text-xs text-muted-foreground">{content.title}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" size="sm" onClick={exportDocx}>
                    <Download className="mr-1 h-4 w-4" /> DOCX
                  </Button>
                  <Button variant="outline" size="sm" onClick={exportPdf}>
                    <Download className="mr-1 h-4 w-4" /> PDF
                  </Button>
                  <Button variant="default" size="sm" onClick={startNew}>
                    New assignment
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <Tabs value={previewMode} onValueChange={(v) => setPreviewMode(v as "typed" | "handwritten")}>
                  <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                    <TabsList>
                      <TabsTrigger value="typed">Typed</TabsTrigger>
                      <TabsTrigger value="handwritten">Handwritten</TabsTrigger>
                    </TabsList>
                    {previewMode === "handwritten" && (
                      <div className="flex items-center gap-2">
                        <Label className="text-xs">Style:</Label>
                        <Select value={hwStyle} onValueChange={(v) => setHwStyle(v as HwStyle)}>
                          <SelectTrigger className="h-8 w-36">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="neat">Neat student</SelectItem>
                            <SelectItem value="cursive">Cursive</SelectItem>
                            <SelectItem value="rough">Exam-style rough</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </div>

                  <TabsContent value="typed" className="mt-0">
                    <PreviewDoc content={content} authorName={authorName} includeTitlePage={includeTitlePage} includeReferences={includeReferences} />
                  </TabsContent>
                  <TabsContent value="handwritten" className="mt-0">
                    <PreviewDoc
                      content={content}
                      authorName={authorName}
                      includeTitlePage={includeTitlePage}
                      includeReferences={includeReferences}
                      handwritingFont={HW_FONTS[hwStyle]}
                    />
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* History */}
      {history.length > 0 && step !== 4 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Clock className="h-4 w-4" /> Recent assignments
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {history.map((a) => (
              <div
                key={a.id}
                className="flex items-center justify-between gap-3 rounded-lg border p-3 hover:bg-muted/40"
              >
                <button onClick={() => loadPast(a)} className="flex-1 text-left">
                  <p className="font-medium">{a.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(a.created_at).toLocaleString()} • {a.level} • ~{a.word_count} words
                  </p>
                </button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => deleteMut.mutate(a.id)}
                  aria-label="Delete"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between gap-2 rounded-lg bg-muted/40 px-3 py-2">
      <span className="text-muted-foreground">{k}</span>
      <span className="font-medium capitalize">{v}</span>
    </div>
  );
}

function PreviewDoc({
  content,
  authorName,
  includeTitlePage,
  includeReferences,
  handwritingFont,
}: {
  content: AssignmentContent;
  authorName: string;
  includeTitlePage: boolean;
  includeReferences: boolean;
  handwritingFont?: string;
}) {
  const isHw = !!handwritingFont;
  const baseStyle = handwritingFont
    ? { fontFamily: handwritingFont, fontSize: "1.25rem", lineHeight: "2.1" }
    : { fontFamily: "Georgia, 'Times New Roman', serif", fontSize: "1rem", lineHeight: "1.7" };

  return (
    <div
      className="mx-auto max-w-3xl rounded-xl border bg-white p-8 text-neutral-900 shadow-sm sm:p-12 dark:bg-neutral-100"
      style={baseStyle}
    >
      {includeTitlePage && (
        <div className="mb-12 border-b pb-12 text-center">
          <h1 className={cn("font-bold", isHw ? "text-4xl" : "text-3xl")}>{content.title}</h1>
          {content.subtitle && <p className="mt-3 italic opacity-80">{content.subtitle}</p>}
          {authorName && <p className="mt-8">By {authorName}</p>}
        </div>
      )}

      <h1 className={cn("mb-4 font-bold", isHw ? "text-3xl" : "text-2xl")}>{content.title}</h1>

      <h2 className={cn("mb-2 mt-6 font-bold", isHw ? "text-2xl" : "text-xl")}>Introduction</h2>
      {content.introduction.split(/\n\n+/).map((p, i) => (
        <p key={i} className="mb-3">
          {p}
        </p>
      ))}

      {content.sections.map((s, i) => (
        <div key={i}>
          <h2 className={cn("mb-2 mt-6 font-bold", isHw ? "text-2xl" : "text-xl")}>{s.heading}</h2>
          {s.paragraphs.map((p, j) => (
            <p key={j} className="mb-3">
              {p}
            </p>
          ))}
          {s.subsections?.map((sub, k) => (
            <div key={k}>
              <h3 className={cn("mb-2 mt-4 font-semibold", isHw ? "text-xl" : "text-lg")}>{sub.heading}</h3>
              {sub.paragraphs.map((p, m) => (
                <p key={m} className="mb-3">
                  {p}
                </p>
              ))}
            </div>
          ))}
        </div>
      ))}

      <h2 className={cn("mb-2 mt-6 font-bold", isHw ? "text-2xl" : "text-xl")}>Conclusion</h2>
      {content.conclusion.split(/\n\n+/).map((p, i) => (
        <p key={i} className="mb-3">
          {p}
        </p>
      ))}

      {includeReferences && content.references && content.references.length > 0 && (
        <>
          <h2 className={cn("mb-2 mt-6 font-bold", isHw ? "text-2xl" : "text-xl")}>References</h2>
          <ul className="list-inside list-disc space-y-1">
            {content.references.map((r, i) => (
              <li key={i}>{r}</li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
