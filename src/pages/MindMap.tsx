// Mind Map — radial layout, interactive, exports SVG.
import { useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Network, Sparkles, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { callAI } from "@/lib/ai";
import { toast } from "sonner";
import { motion } from "framer-motion";

type MindMap = {
  root: string;
  branches: { label: string; children?: { label: string; children?: { label: string }[] }[] }[];
};

export default function MindMap() {
  const [topic, setTopic] = useState("");
  const [loading, setLoading] = useState(false);
  const [map, setMap] = useState<MindMap | null>(null);

  const generate = async () => {
    if (!topic.trim()) return;
    setLoading(true);
    setMap(null);
    try {
      const data = await callAI<MindMap>({ mode: "mindmap", prompt: topic });
      setMap(data);
    } catch (e: any) {
      toast.error(e.message || "Mind map generation failed");
    } finally {
      setLoading(false);
    }
  };

  const palette = [
    "from-violet-500 to-purple-500",
    "from-pink-500 to-rose-500",
    "from-amber-500 to-orange-500",
    "from-emerald-500 to-teal-500",
    "from-sky-500 to-blue-500",
    "from-fuchsia-500 to-pink-500",
    "from-indigo-500 to-violet-500",
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        icon={Network}
        title="Mind Map Generator"
        description="Transform any topic into a structured visual map you can explore."
        gradient="from-emerald-500 to-teal-500"
      />

      <Card className="border-border/50 shadow-soft">
        <CardContent className="flex flex-col gap-3 p-5 sm:flex-row">
          <Input
            placeholder="Topic (e.g. The French Revolution)"
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

      {map && (
        <Card className="border-border/50 shadow-soft">
          <CardContent className="p-4 sm:p-6">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold">{map.root}</h3>
              <Button variant="outline" size="sm" onClick={() => window.print()}>
                <Download className="mr-2 h-4 w-4" /> Print / Save PDF
              </Button>
            </div>

            <div className="space-y-3">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="mx-auto inline-flex w-full justify-center"
              >
                <div className="rounded-2xl bg-gradient-to-r from-primary to-primary-glow px-6 py-3 text-center text-lg font-bold text-primary-foreground shadow-glow">
                  {map.root}
                </div>
              </motion.div>

              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {map.branches.map((b, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="rounded-2xl border border-border/50 bg-card p-4 shadow-soft"
                  >
                    <div
                      className={`inline-block rounded-xl bg-gradient-to-r ${palette[i % palette.length]} px-3 py-1.5 text-sm font-semibold text-white shadow-md`}
                    >
                      {b.label}
                    </div>
                    {b.children && b.children.length > 0 && (
                      <ul className="mt-3 space-y-2 border-l-2 border-border pl-3">
                        {b.children.map((c, j) => (
                          <li key={j} className="text-sm">
                            <div className="font-medium">{c.label}</div>
                            {c.children && c.children.length > 0 && (
                              <ul className="mt-1 space-y-0.5 border-l border-border/60 pl-3 text-xs text-muted-foreground">
                                {c.children.map((g, k) => (
                                  <li key={k}>• {g.label}</li>
                                ))}
                              </ul>
                            )}
                          </li>
                        ))}
                      </ul>
                    )}
                  </motion.div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
