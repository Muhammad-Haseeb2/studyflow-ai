// AI Assignment generator: returns structured JSON via tool calling.
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const GATEWAY = "https://ai.gateway.lovable.dev/v1/chat/completions";
const MODEL = "google/gemini-3-flash-preview";

const ASSIGNMENT_TOOL = {
  type: "function",
  function: {
    name: "build_assignment",
    description: "Return a fully structured academic assignment.",
    parameters: {
      type: "object",
      properties: {
        title: { type: "string", description: "Assignment title (concise, descriptive)." },
        subtitle: { type: "string", description: "Optional subtitle / course name." },
        topic: { type: "string", description: "Detected topic or subject." },
        introduction: { type: "string", description: "Introduction paragraph(s)." },
        sections: {
          type: "array",
          description: "Main body sections with headings, optional subsections, and paragraphs.",
          items: {
            type: "object",
            properties: {
              heading: { type: "string" },
              paragraphs: { type: "array", items: { type: "string" } },
              subsections: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    heading: { type: "string" },
                    paragraphs: { type: "array", items: { type: "string" } },
                  },
                  required: ["heading", "paragraphs"],
                  additionalProperties: false,
                },
              },
            },
            required: ["heading", "paragraphs"],
            additionalProperties: false,
          },
        },
        conclusion: { type: "string", description: "Conclusion paragraph(s)." },
        references: {
          type: "array",
          description: "List of references (only if requested). Each is a citation string.",
          items: { type: "string" },
        },
      },
      required: ["title", "topic", "introduction", "sections", "conclusion"],
      additionalProperties: false,
    },
  },
};

function buildSystemPrompt(opts: {
  level: string;
  language: string;
  formattingStyle: string;
  wordCount: number;
  includeReferences: boolean;
}) {
  const toneByLevel: Record<string, string> = {
    basic: "simple, clear language suitable for a school student. Short sentences and basic vocabulary.",
    medium: "clear academic tone suitable for a high-school or early-undergraduate student. Balanced complexity.",
    advanced: "rigorous, scholarly tone with nuanced argumentation suitable for a university student.",
  };
  const styleHint: Record<string, string> = {
    academic: "Formal academic register. Avoid contractions. Use cohesive transitions.",
    formal: "Formal but accessible. Professional tone.",
    simple: "Plain, straightforward language. Easy to read.",
  };
  return [
    "You are an expert academic writer producing a complete, original assignment.",
    `Tone: ${toneByLevel[opts.level] || toneByLevel.medium}`,
    `Style: ${styleHint[opts.formattingStyle] || styleHint.academic}`,
    `Language: write the entire assignment in ${opts.language}.`,
    `Target length: approximately ${opts.wordCount} words across all sections combined.`,
    "Structure the assignment with a strong introduction, 3-6 well-developed body sections (each with a clear heading and 2-4 paragraphs), and a conclusion that synthesizes the main points.",
    "Where appropriate, add 1-2 subsections under a body section.",
    opts.includeReferences
      ? "Include 4-8 plausible academic references at the end (author, year, title, source). Format consistently."
      : "Do NOT include references.",
    "Content must be 100% original (no plagiarism), factually grounded, and logically flowing.",
    "Return ONLY via the build_assignment tool — do not write prose responses.",
  ].join("\n");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const {
      action,
      sourceText,
      topic,
      level = "medium",
      language = "English",
      formattingStyle = "academic",
      wordCount = 800,
      includeReferences = false,
    } = await req.json();

    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) throw new Error("LOVABLE_API_KEY missing");

    if (action === "analyze") {
      // Quick: extract topic + key requirements from raw input.
      const resp = await fetch(GATEWAY, {
        method: "POST",
        headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: MODEL,
          messages: [
            {
              role: "system",
              content:
                "You analyze assignment briefs. Extract the main topic, the explicit instructions, and 3-6 key requirements. Be concise.",
            },
            { role: "user", content: String(sourceText || "").slice(0, 12000) },
          ],
          tools: [
            {
              type: "function",
              function: {
                name: "report_brief",
                description: "Return the parsed assignment brief.",
                parameters: {
                  type: "object",
                  properties: {
                    topic: { type: "string" },
                    instructions: { type: "string" },
                    requirements: { type: "array", items: { type: "string" } },
                    suggestedTitle: { type: "string" },
                  },
                  required: ["topic", "instructions", "requirements", "suggestedTitle"],
                  additionalProperties: false,
                },
              },
            },
          ],
          tool_choice: { type: "function", function: { name: "report_brief" } },
        }),
      });
      if (!resp.ok) {
        const status = resp.status;
        const t = await resp.text();
        return new Response(
          JSON.stringify({ error: status === 429 ? "Rate limit exceeded. Try again shortly." : status === 402 ? "AI credits exhausted. Add credits in Workspace settings." : "Analysis failed", detail: t }),
          { status, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      const data = await resp.json();
      const args = data.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments;
      const parsed = args ? JSON.parse(args) : {};
      return new Response(JSON.stringify(parsed), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // action === "generate"
    const userPrompt = [
      topic ? `Assignment topic / brief:\n${topic}` : "",
      sourceText ? `\n\nReference / source material:\n${String(sourceText).slice(0, 16000)}` : "",
    ]
      .filter(Boolean)
      .join("\n");

    const resp = await fetch(GATEWAY, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: "system", content: buildSystemPrompt({ level, language, formattingStyle, wordCount, includeReferences }) },
          { role: "user", content: userPrompt || "Write a general assignment on a topic of your choice." },
        ],
        tools: [ASSIGNMENT_TOOL],
        tool_choice: { type: "function", function: { name: "build_assignment" } },
      }),
    });

    if (!resp.ok) {
      const status = resp.status;
      const t = await resp.text();
      console.error("ai-assignment generate error", status, t);
      return new Response(
        JSON.stringify({
          error:
            status === 429
              ? "Rate limit exceeded. Try again shortly."
              : status === 402
                ? "AI credits exhausted. Add credits in Workspace settings."
                : "Generation failed",
          detail: t,
        }),
        { status, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const data = await resp.json();
    const args = data.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments;
    if (!args) throw new Error("No assignment returned");
    const parsed = JSON.parse(args);
    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("ai-assignment error", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
