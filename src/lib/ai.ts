// Centralized AI service calls (edge function `ai-study`).
import { supabase } from "@/integrations/supabase/client";

const FUNCTIONS_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-study`;
const ANON = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

export type ChatMode = "chat-simple" | "chat-advanced" | "chat-eli10";

export async function streamChat(opts: {
  mode: ChatMode;
  prompt: string;
  history: { role: "user" | "assistant"; content: string }[];
  onDelta: (text: string) => void;
  onError?: (msg: string) => void;
  signal?: AbortSignal;
}) {
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token;
  if (!token) {
    opts.onError?.("You must be signed in to use the AI coach.");
    throw new Error("Not authenticated");
  }
  const resp = await fetch(FUNCTIONS_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: ANON,
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ mode: opts.mode, prompt: opts.prompt, history: opts.history }),
    signal: opts.signal,
  });

  if (!resp.ok || !resp.body) {
    let msg = "AI request failed";
    try {
      const j = await resp.json();
      msg = j.error || msg;
    } catch {
      /* ignore */
    }
    opts.onError?.(msg);
    throw new Error(msg);
  }

  const reader = resp.body.getReader();
  const decoder = new TextDecoder();
  let buf = "";
  let done = false;
  while (!done) {
    const { value, done: rDone } = await reader.read();
    if (rDone) break;
    buf += decoder.decode(value, { stream: true });
    let i: number;
    while ((i = buf.indexOf("\n")) !== -1) {
      let line = buf.slice(0, i);
      buf = buf.slice(i + 1);
      if (line.endsWith("\r")) line = line.slice(0, -1);
      if (!line || line.startsWith(":")) continue;
      if (!line.startsWith("data: ")) continue;
      const json = line.slice(6).trim();
      if (json === "[DONE]") {
        done = true;
        break;
      }
      try {
        const parsed = JSON.parse(json);
        const delta = parsed.choices?.[0]?.delta?.content;
        if (delta) opts.onDelta(delta);
      } catch {
        buf = line + "\n" + buf;
        break;
      }
    }
  }
}

export async function callAI<T = any>(payload: any): Promise<T> {
  const { data, error } = await supabase.functions.invoke("ai-study", { body: payload });
  if (error) throw new Error(error.message);
  if ((data as any)?.error) throw new Error((data as any).error);
  return data as T;
}
