const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const GATEWAY = "https://ai.gateway.lovable.dev/v1/chat/completions";
const DEFAULT_MODEL = "google/gemini-3-flash-preview";

type Mode =
  | "chat-simple"
  | "chat-advanced"
  | "chat-eli10"
  | "quiz"
  | "flashcards"
  | "mindmap"
  | "essay"
  | "translate"
  | "notes";

const SYSTEM_PROMPTS: Record<string, string> = {
  "chat-simple":
    "You are Studyflow, a friendly AI study coach. Give concise, clear explanations a student can grasp quickly. ALWAYS format responses in rich Markdown using: # H1 for the topic, ## H2 for sections, **bold** for key terms, bullet lists, and clickable [link text](https://url) resources at the end under a '## Helpful Resources' heading. Keep tone warm and motivating.",
  "chat-advanced":
    "You are Studyflow, an expert academic tutor. Provide deep, rigorous explanations with nuance, edge cases, and connections between ideas. ALWAYS format in rich Markdown: # H1 topic, ## H2 sections, ### H3 sub-sections, **bold** key terms, bullet lists, code blocks if relevant, and a '## Further Reading' section with [clickable links](https://url).",
  "chat-eli10":
    "You are Studyflow explaining to a curious 10-year-old. Use simple words, fun analogies, emojis sparingly, and short sentences. ALWAYS format in Markdown: # H1 topic, ## H2 sections, **bold** key terms, bullet lists, and a '## Cool Things to Explore' section with [links](https://url).",
  essay:
    "You are an expert academic essay writer. Produce a structured, formal essay with: # Title, ## Introduction, ## body sections with descriptive H2 headings, ## Conclusion. Use formal tone, well-developed paragraphs, **bold** for key terms.",
  translate:
    "You are a professional translator. Preserve meaning, tone and nuance. Return ONLY the translated text in Markdown, with original formatting (headings, lists, bold) preserved.",
  notes:
    "You are a study notes generator. Produce comprehensive, beautifully structured notes in Markdown: # Topic, ## sections, ### subsections, bullet points, **bold key terms**, > blockquote highlights, and a final '## Summary' section. Be exhaustive but scannable.",
};

async function callAI(messages: any[], opts: { model?: string; tools?: any[]; tool_choice?: any; reasoning?: any } = {}) {
  const apiKey = Deno.env.get("LOVABLE_API_KEY");
  if (!apiKey) throw new Error("LOVABLE_API_KEY missing");

  const body: any = {
    model: opts.model || DEFAULT_MODEL,
    messages,
  };
  if (opts.tools) body.tools = opts.tools;
  if (opts.tool_choice) body.tool_choice = opts.tool_choice;
  if (opts.reasoning) body.reasoning = opts.reasoning;

  const r = await fetch(GATEWAY, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!r.ok) {
    const text = await r.text();
    console.error("ai-study gateway error", r.status, text);
    const safe =
      r.status === 429
        ? "Rate limit reached, please slow down."
        : r.status === 402
          ? "AI credits exhausted. Add funds in Lovable workspace."
          : "AI request failed. Please try again.";
    return { error: safe, status: r.status };
  }
  const data = await r.json();
  return { data };
}

async function verifyAuth(req: Request): Promise<Response | null> {
  const authHeader = req.headers.get("Authorization");
  const token = authHeader?.replace("Bearer ", "");
  if (!token) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  try {
    const { createClient } = await import("https://esm.sh/@supabase/supabase-js@2.45.0");
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
    );
    const { data, error } = await supabase.auth.getUser(token);
    if (error || !data?.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    return null;
  } catch {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const unauthorized = await verifyAuth(req);
  if (unauthorized) return unauthorized;

  try {
    const { mode, prompt, context, target, history, count } = await req.json();

    // Input size limits to prevent abuse
    const MAX_PROMPT = 20_000;
    const MAX_HISTORY = 50;
    const MAX_MSG = 8_000;
    if (typeof prompt === "string" && prompt.length > MAX_PROMPT) {
      return new Response(JSON.stringify({ error: "Prompt too long." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const safeHistory = Array.isArray(history)
      ? history
          .slice(-MAX_HISTORY)
          .filter((m: any) => m && typeof m.role === "string" && typeof m.content === "string")
          .map((m: any) => ({ role: m.role, content: String(m.content).slice(0, MAX_MSG) }))
      : [];

    // Streaming chat
    if (mode === "chat-simple" || mode === "chat-advanced" || mode === "chat-eli10") {
      const apiKey = Deno.env.get("LOVABLE_API_KEY");
      if (!apiKey) throw new Error("LOVABLE_API_KEY missing");

      const messages = [
        { role: "system", content: SYSTEM_PROMPTS[mode] },
        ...safeHistory,
        { role: "user", content: String(prompt || "").slice(0, MAX_PROMPT) },
      ];

      const r = await fetch(GATEWAY, {
        method: "POST",
        headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({ model: DEFAULT_MODEL, messages, stream: true }),
      });

      if (r.status === 429)
        return new Response(JSON.stringify({ error: "Rate limit reached, please slow down." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      if (r.status === 402)
        return new Response(JSON.stringify({ error: "AI credits exhausted. Add funds in Lovable workspace." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      if (!r.ok || !r.body) {
        const t = await r.text();
        console.error("ai-study stream gateway error", r.status, t);
        return new Response(JSON.stringify({ error: "AI request failed. Please try again." }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(r.body, {
        headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
      });
    }

    // Essay / Notes / Translate (non-streaming markdown)
    if (mode === "essay" || mode === "notes" || mode === "translate") {
      const userPrompt =
        mode === "translate"
          ? `Translate the following content into ${target}. Preserve formatting.\n\n${prompt}`
          : prompt;
      const result = await callAI([
        { role: "system", content: SYSTEM_PROMPTS[mode] },
        { role: "user", content: userPrompt },
      ]);
      if ("error" in result) {
        return new Response(JSON.stringify({ error: result.error }), {
          status: result.status,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const content = result.data.choices?.[0]?.message?.content || "";
      return new Response(JSON.stringify({ content }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Quiz generation (structured)
    if (mode === "quiz") {
      const tool = {
        type: "function",
        function: {
          name: "build_quiz",
          description: "Build a quiz with MCQs and conceptual questions.",
          parameters: {
            type: "object",
            properties: {
              questions: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    type: { type: "string", enum: ["mcq"] },
                    question: { type: "string" },
                    options: { type: "array", items: { type: "string" }, minItems: 4, maxItems: 4 },
                    answer: { type: "string", description: "Must match one of the options exactly" },
                    explanation: { type: "string" },
                    concept: { type: "string" },
                  },
                  required: ["type", "question", "options", "answer", "explanation", "concept"],
                },
              },
            },
            required: ["questions"],
          },
        },
      };
      const qCount = Math.max(3, Math.min(15, Number(count) || 8));
      const result = await callAI(
        [
          {
            role: "system",
            content:
              `Generate a multiple-choice quiz with EXACTLY ${qCount} questions. Cover the full breadth of the topic — include core definitions, key principles, applications, and at least one slightly tricky question to test understanding. Every question MUST have type='mcq' with exactly 4 distinct options. The 'answer' field MUST be the EXACT TEXT of the correct option (must match one of the options character-for-character). Include a clear 1-2 sentence explanation and a short 'concept' tag for each question. Do NOT include conceptual / open-ended / text-input questions.`,
          },
          { role: "user", content: `Topic / source material:\n${prompt}` },
        ],
        { tools: [tool], tool_choice: { type: "function", function: { name: "build_quiz" } } }
      );
      if ("error" in result) {
        return new Response(JSON.stringify({ error: result.error }), {
          status: result.status,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const args = result.data.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments;
      return new Response(args || JSON.stringify({ questions: [] }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Flashcards (structured)
    if (mode === "flashcards") {
      const tool = {
        type: "function",
        function: {
          name: "build_flashcards",
          description: "Build study flashcards.",
          parameters: {
            type: "object",
            properties: {
              cards: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    front: { type: "string" },
                    back: { type: "string" },
                  },
                  required: ["front", "back"],
                },
              },
            },
            required: ["cards"],
          },
        },
      };
      const result = await callAI(
        [
          {
            role: "system",
            content: "Generate 8-12 high-quality study flashcards. Front = concise question/term. Back = clear concise answer (1-3 sentences).",
          },
          { role: "user", content: `Topic:\n${prompt}` },
        ],
        { tools: [tool], tool_choice: { type: "function", function: { name: "build_flashcards" } } }
      );
      if ("error" in result) {
        return new Response(JSON.stringify({ error: result.error }), {
          status: result.status,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const args = result.data.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments;
      return new Response(args || JSON.stringify({ cards: [] }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Mind map (structured)
    if (mode === "mindmap") {
      const tool = {
        type: "function",
        function: {
          name: "build_mindmap",
          description: "Build a hierarchical mind map.",
          parameters: {
            type: "object",
            properties: {
              root: { type: "string" },
              branches: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    label: { type: "string" },
                    children: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          label: { type: "string" },
                          children: { type: "array", items: { type: "object", properties: { label: { type: "string" } }, required: ["label"] } },
                        },
                        required: ["label"],
                      },
                    },
                  },
                  required: ["label"],
                },
              },
            },
            required: ["root", "branches"],
          },
        },
      };
      const result = await callAI(
        [
          { role: "system", content: "Build a clear hierarchical mind map for the topic. Use 4-7 main branches, each with 2-5 children, and optionally grandchildren. Labels must be short (max 6 words)." },
          { role: "user", content: `Topic: ${prompt}` },
        ],
        { tools: [tool], tool_choice: { type: "function", function: { name: "build_mindmap" } } }
      );
      if ("error" in result) {
        return new Response(JSON.stringify({ error: result.error }), {
          status: result.status,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const args = result.data.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments;
      return new Response(args || JSON.stringify({ root: prompt, branches: [] }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Unknown mode" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e: any) {
    console.error("ai-study error:", e);
    return new Response(JSON.stringify({ error: e?.message || "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
