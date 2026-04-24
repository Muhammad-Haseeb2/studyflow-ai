// Essay Writer
import { useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { PenLine, Sparkles, Copy, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { callAI } from "@/lib/ai";
import { toast } from "sonner";
import { MarkdownView } from "@/components/MarkdownView";

export default function Essay() {
  const [topic, setTopic] = useState("");
  const [length, setLength] = useState("medium");
  const [tone, setTone] = useState("formal");
  const [loading, setLoading] = useState(false);
  const [content, setContent] = useState("");

  const generate = async () => {
    if (!topic.trim()) return;
    setLoading(true);
    setContent("");
    try {
      const data = await callAI<{ content: string }>({
        mode: "essay",
        prompt: `Write a ${length} (${length === "short" ? "~400" : length === "medium" ? "~700" : "~1200"} words) ${tone} essay on: ${topic}`,
      });
      setContent(data.content || "");
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  };

  const download = () => {
    const blob = new Blob([content], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${topic.slice(0, 40) || "essay"}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        icon={PenLine}
        title="Essay Writer"
        description="Generate structured, formal essays with proper headings and paragraphs."
        gradient="from-blue-500 to-indigo-500"
      />

      <Card className="border-border/50 shadow-soft">
        <CardContent className="space-y-3 p-5">
          <Input
            placeholder="Essay topic (e.g. The impact of AI on education)"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            className="rounded-xl"
          />
          <div className="grid gap-3 sm:grid-cols-3">
            <Select value={length} onValueChange={setLength}>
              <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="short">Short (~400w)</SelectItem>
                <SelectItem value="medium">Medium (~700w)</SelectItem>
                <SelectItem value="long">Long (~1200w)</SelectItem>
              </SelectContent>
            </Select>
            <Select value={tone} onValueChange={setTone}>
              <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="formal">Formal academic</SelectItem>
                <SelectItem value="persuasive">Persuasive</SelectItem>
                <SelectItem value="analytical">Analytical</SelectItem>
                <SelectItem value="reflective">Reflective</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={generate} disabled={loading || !topic.trim()} className="gradient-primary text-primary-foreground shadow-md">
              <Sparkles className="mr-2 h-4 w-4" />
              {loading ? "Writing…" : "Write essay"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {content && (
        <Card className="border-border/50 shadow-soft">
          <CardContent className="space-y-3 p-5 sm:p-7">
            <div className="flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => { navigator.clipboard.writeText(content); toast.success("Copied"); }}>
                <Copy className="mr-2 h-4 w-4" /> Copy
              </Button>
              <Button variant="outline" size="sm" onClick={download}>
                <Download className="mr-2 h-4 w-4" /> Download
              </Button>
            </div>
            <MarkdownView content={content} />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
