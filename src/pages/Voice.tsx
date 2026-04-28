// Voice Study Mode — Web Speech API STT + TTS, language picker, AI streaming chat.
import { useEffect, useRef, useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Mic, MicOff, Volume2, VolumeX, Loader2, Languages } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { streamChat } from "@/lib/ai";
import { toast } from "sonner";
import { MarkdownView } from "@/components/MarkdownView";
import { motion } from "framer-motion";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const LANGS = [
  { code: "en-US", label: "English (US)" },
  { code: "en-GB", label: "English (UK)" },
  { code: "ur-PK", label: "اردو (Urdu)" },
  { code: "es-ES", label: "Español" },
  { code: "fr-FR", label: "Français" },
  { code: "de-DE", label: "Deutsch" },
  { code: "hi-IN", label: "हिन्दी" },
  { code: "ar-SA", label: "العربية" },
  { code: "zh-CN", label: "中文" },
];

export default function Voice() {
  const [lang, setLang] = useState("en-US");
  const [listening, setListening] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [voiceOn, setVoiceOn] = useState(true);
  const [transcript, setTranscript] = useState("");
  const [reply, setReply] = useState("");
  const [loading, setLoading] = useState(false);
  const recogRef = useRef<any>(null);
  const voicesRef = useRef<SpeechSynthesisVoice[]>([]);
  const spokenLenRef = useRef(0);

  const Recognition: any =
    typeof window !== "undefined" ? (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition : null;
  const supportsSTT = !!Recognition;
  const supportsTTS = typeof window !== "undefined" && "speechSynthesis" in window;

  // Preload voices (Chrome loads them async)
  useEffect(() => {
    if (!supportsTTS) return;
    const load = () => {
      voicesRef.current = window.speechSynthesis.getVoices();
    };
    load();
    window.speechSynthesis.onvoiceschanged = load;
    return () => {
      window.speechSynthesis.onvoiceschanged = null;
      try {
        recogRef.current?.stop();
        window.speechSynthesis?.cancel();
      } catch {
        /* ignore */
      }
    };
  }, [supportsTTS]);

  const pickVoice = (target: string): SpeechSynthesisVoice | undefined => {
    const voices = voicesRef.current;
    if (!voices?.length) return undefined;
    const baseLang = target.split("-")[0].toLowerCase();
    // 1) exact match (e.g. ur-PK)
    let v = voices.find((vo) => vo.lang.toLowerCase() === target.toLowerCase());
    if (v) return v;
    // 2) same base language (ur-IN, ur, hi-IN as fallback for Urdu)
    v = voices.find((vo) => vo.lang.toLowerCase().startsWith(baseLang));
    if (v) return v;
    // 3) Urdu special: fall back to Hindi voices (closest phonetics)
    if (baseLang === "ur") {
      v = voices.find((vo) => vo.lang.toLowerCase().startsWith("hi"));
      if (v) return v;
    }
    return undefined;
  };

  // Strip markdown for cleaner TTS
  const cleanForTTS = (text: string) =>
    text
      .replace(/```[\s\S]*?```/g, " ")
      .replace(/`([^`]+)`/g, "$1")
      .replace(/!\[[^\]]*\]\([^)]*\)/g, " ")
      .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
      .replace(/[#>*_~]/g, "")
      .replace(/\s+/g, " ")
      .trim();

  const startListening = () => {
    if (!Recognition) return toast.error("Speech recognition not supported in this browser");
    const r = new Recognition();
    r.lang = lang;
    r.interimResults = true;
    r.continuous = false;
    r.onresult = (e: any) => {
      const t = Array.from(e.results)
        .map((res: any) => res[0].transcript)
        .join(" ");
      setTranscript(t);
    };
    r.onerror = (e: any) => {
      toast.error(`Mic error: ${e.error}`);
      setListening(false);
    };
    r.onend = () => {
      setListening(false);
      // auto-send
      setTimeout(() => sendCurrent(), 100);
    };
    recogRef.current = r;
    setTranscript("");
    r.start();
    setListening(true);
  };

  const stopListening = () => {
    try {
      recogRef.current?.stop();
    } catch {
      /* ignore */
    }
    setListening(false);
  };

  const speakChunk = (text: string) => {
    if (!supportsTTS || !voiceOn) return;
    const cleaned = cleanForTTS(text);
    if (!cleaned) return;
    const utt = new SpeechSynthesisUtterance(cleaned);
    const voice = pickVoice(lang);
    if (voice) utt.voice = voice;
    utt.lang = voice?.lang || lang;
    // Slightly slower for non-English to sound more natural
    utt.rate = lang.startsWith("en") ? 1.0 : 0.92;
    utt.pitch = 1;
    utt.onstart = () => setSpeaking(true);
    utt.onend = () => {
      // only mark done when nothing else queued
      if (!window.speechSynthesis.pending && !window.speechSynthesis.speaking) {
        setSpeaking(false);
      }
    };
    window.speechSynthesis.speak(utt);
  };

  const sendCurrent = async () => {
    const text = transcript.trim();
    if (!text) return;
    setLoading(true);
    setReply("");
    spokenLenRef.current = 0;
    if (supportsTTS) window.speechSynthesis.cancel();
    let acc = "";
    try {
      await streamChat({
        mode: "chat-simple",
        prompt: text,
        history: [],
        onDelta: (chunk) => {
          acc += chunk;
          setReply(acc);
          // Speak as soon as we have a complete sentence — eliminates the
          // "wait until full reply" perceived delay.
          if (!voiceOn) return;
          const pending = acc.slice(spokenLenRef.current);
          const match = pending.match(/^([\s\S]*?[.!?؟。！？\n])/);
          if (match) {
            speakChunk(match[1]);
            spokenLenRef.current += match[1].length;
          }
        },
        onError: (m) => toast.error(m),
      });
      // Speak any trailing text that didn't end with punctuation
      if (voiceOn) {
        const tail = acc.slice(spokenLenRef.current);
        if (tail.trim()) speakChunk(tail);
      }
    } catch (e: any) {
      /* handled */
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        icon={Mic}
        title="Voice Study Mode"
        description="Speak in your language — your AI coach listens and replies in voice."
        gradient="from-sky-500 to-cyan-500"
        action={
          <Select value={lang} onValueChange={setLang}>
            <SelectTrigger className="w-[180px] rounded-xl">
              <Languages className="mr-2 h-4 w-4" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {LANGS.map((l) => (
                <SelectItem key={l.code} value={l.code}>
                  {l.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        }
      />

      {!supportsSTT && (
        <Card className="border-warning/40 bg-warning/5">
          <CardContent className="p-4 text-sm">
            Speech recognition isn't supported in this browser. Try Chrome or Edge for the best experience.
          </CardContent>
        </Card>
      )}

      <div className="flex flex-col items-center gap-6 py-6">
        <motion.button
          onClick={listening ? stopListening : startListening}
          whileTap={{ scale: 0.95 }}
          className={`relative flex h-32 w-32 items-center justify-center rounded-full text-white shadow-elevated transition-all ${
            listening ? "gradient-warm animate-pulse-glow" : "gradient-primary"
          }`}
        >
          {listening ? <MicOff className="h-12 w-12" /> : <Mic className="h-12 w-12" />}
        </motion.button>
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-muted-foreground">{listening ? "Listening…" : "Tap to talk"}</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              if (speaking) window.speechSynthesis.cancel();
              setVoiceOn((v) => !v);
            }}
          >
            {voiceOn ? <Volume2 className="mr-1.5 h-4 w-4" /> : <VolumeX className="mr-1.5 h-4 w-4" />}
            Voice {voiceOn ? "on" : "off"}
          </Button>
        </div>
      </div>

      {transcript && (
        <Card className="border-border/50 shadow-soft">
          <CardContent className="p-4">
            <div className="text-xs uppercase tracking-wider text-muted-foreground">You said</div>
            <div className="mt-1 text-base">{transcript}</div>
          </CardContent>
        </Card>
      )}

      {(reply || loading) && (
        <Card className="border-border/50 shadow-soft">
          <CardContent className="p-4">
            <div className="mb-2 flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground">
              AI response {loading && <Loader2 className="h-3 w-3 animate-spin" />}
            </div>
            <MarkdownView content={reply || "…"} />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
