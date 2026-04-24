// Translator
import { useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Languages, Sparkles, ArrowRight, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { callAI } from "@/lib/ai";
import { toast } from "sonner";
import { MarkdownView } from "@/components/MarkdownView";

const LANGS = ["English", "Urdu", "Spanish", "French", "German", "Arabic", "Hindi", "Chinese", "Japanese", "Portuguese", "Russian", "Italian"];

export default function Translator() {
  const [source, setSource] = useState("");
  const [target, setTarget] = useState("Urdu");
  const [output, setOutput] = useState("");
  const [loading, setLoading] = useState(false);

  const translate = async () => {
    if (!source.trim()) return;
    setLoading(true);
    setOutput("");
    try {
      const data = await callAI<{ content: string }>({ mode: "translate", prompt: source, target });
      setOutput(data.content || "");
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        icon={Languages}
        title="Translator"
        description="Translate to and from Urdu, English and many more — meaning preserved."
        gradient="from-teal-500 to-emerald-500"
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="border-border/50 shadow-soft">
          <CardContent className="space-y-3 p-5">
            <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Source</div>
            <Textarea value={source} onChange={(e) => setSource(e.target.value)} rows={10} placeholder="Type or paste text…" className="rounded-xl" />
          </CardContent>
        </Card>
        <Card className="border-border/50 shadow-soft">
          <CardContent className="space-y-3 p-5">
            <div className="flex items-center justify-between">
              <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Translation</div>
              {output && (
                <Button variant="ghost" size="sm" onClick={() => { navigator.clipboard.writeText(output); toast.success("Copied"); }}>
                  <Copy className="mr-1.5 h-3.5 w-3.5" /> Copy
                </Button>
              )}
            </div>
            <div className="min-h-[230px] rounded-xl border border-border/50 bg-muted/30 p-3">
              {output ? <MarkdownView content={output} /> : <p className="text-sm text-muted-foreground">Translation will appear here.</p>}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
        <Select value={target} onValueChange={setTarget}>
          <SelectTrigger className="w-full rounded-xl sm:w-[200px]">
            <ArrowRight className="mr-2 h-4 w-4" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {LANGS.map((l) => (
              <SelectItem key={l} value={l}>
                {l}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button onClick={translate} disabled={loading || !source.trim()} className="w-full gradient-primary text-primary-foreground shadow-md sm:w-auto">
          <Sparkles className="mr-2 h-4 w-4" />
          {loading ? "Translating…" : "Translate"}
        </Button>
      </div>
    </div>
  );
}
