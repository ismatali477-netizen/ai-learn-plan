import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { callLovableChat } from "./ai-gateway.server";
import { embedOne } from "./embeddings.server";
import { z } from "zod";

const EDUCATION_LEVELS = [
  "SEE",
  "NEB Grade 11 Science",
  "NEB Grade 11 Management",
  "NEB Grade 11 Humanities",
  "NEB Grade 12 Science",
  "NEB Grade 12 Management",
  "NEB Grade 12 Humanities",
  "BSc CSIT",
  "BIT",
  "BCA",
  "BIM",
  "BBS",
  "TU Entrance Preparation",
  "Other",
] as const;

export const EDUCATION_LEVEL_OPTIONS = EDUCATION_LEVELS;

function buildSystemPrompt(opts: {
  educationLevel: string | null;
  course: string | null;
  semester: string | null;
  faculty: string | null;
  language: string;
  ragContext?: string;
}) {
  const langLine =
    opts.language === "ne"
      ? "Reply in simple, natural Nepali (Devanagari)."
      : opts.language === "en"
        ? "Reply in clear, natural English."
        : "Reply in the same language the student writes in (English or Nepali).";

  // Silent profile — used to calibrate difficulty, never announced.
  const profileHints = [
    opts.educationLevel && `level=${opts.educationLevel}`,
    opts.course && `course=${opts.course}`,
    opts.semester && `semester=${opts.semester}`,
    opts.faculty && `faculty=${opts.faculty}`,
  ]
    .filter(Boolean)
    .join(", ");

  const base = `You are a friendly, expert AI tutor. Respond like ChatGPT or Claude: natural, clear, and helpful.

Style:
- Be concise by default. Expand only when the user asks for detail.
- Teach like a good teacher: short explanation, then an example when it helps.
- Skip filler intros ("Great question!", "Sure, I'd be happy to help…") and needless disclaimers.
- Do NOT mention curricula, boards, or programs (NEB, SEE, TU, BSc CSIT, BIT, BCA, BIM, BBS, etc.) unless the user explicitly asks about them.
- Do NOT announce the student's level, course, or that you are adapting — just adapt silently.

Formatting (Markdown):
- Use headings (##) to separate sections when the answer has multiple parts.
- Use bullet points for lists and numbered steps for procedures.
- Use fenced code blocks with language tags for code.
- Use tables only when they genuinely help.
- Add blank lines between sections. Avoid walls of text.

Answer shapes:
- Programming: brief explanation → code block → sample input/output when relevant.
- Concept / study question: short explanation → key points → a quick example or takeaway. Add "Exam tips" only if the user asks about exams.
- MCQs: numbered questions with 4 options; mark the correct answer clearly with a short reason.
- PDF-grounded answers: summarize findings in your own words. Cite as [Doc chunk N] only when a specific claim needs backing. Never dump raw retrieval metadata.`;

  const contextBlock = opts.ragContext
    ? `\n\nReference excerpts from the student's uploaded documents (use as the primary source when relevant; cite sparingly as [Doc chunk N]):\n${opts.ragContext}`
    : "";

  const hintLine = profileHints
    ? `\n\n(Silent context, do not mention to the user: ${profileHints}. Calibrate depth and vocabulary accordingly.)`
    : "";

  return `${base}\n\n${langLine}${hintLine}${contextBlock}`;
}

// ---------- Threads ----------

export const listThreads = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data, error } = await supabase
      .from("chat_threads")
      .select("id,title,last_message_at,created_at,language,education_level,course")
      .eq("user_id", userId)
      .order("last_message_at", { ascending: false });
    if (error) throw error;
    return data ?? [];
  });

export const createThread = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ title: z.string().max(120).optional() }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: profile } = await supabase
      .from("profiles")
      .select("education_level,course,preferred_language")
      .eq("id", userId)
      .maybeSingle();
    const { data: row, error } = await supabase
      .from("chat_threads")
      .insert({
        user_id: userId,
        title: data.title ?? "New chat",
        education_level: profile?.education_level ?? null,
        course: profile?.course ?? null,
        language: profile?.preferred_language ?? "auto",
      })
      .select("id")
      .single();
    if (error) throw error;
    return { id: row.id };
  });

export const deleteThread = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { error } = await supabase
      .from("chat_threads")
      .delete()
      .eq("id", data.id)
      .eq("user_id", userId);
    if (error) throw error;
    return { ok: true };
  });

export const renameThread = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({ id: z.string().uuid(), title: z.string().min(1).max(120) }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { error } = await supabase
      .from("chat_threads")
      .update({ title: data.title })
      .eq("id", data.id)
      .eq("user_id", userId);
    if (error) throw error;
    return { ok: true };
  });

export const listMessages = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ threadId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: rows, error } = await supabase
      .from("chat_messages")
      .select("id,role,content,sources,created_at")
      .eq("thread_id", data.threadId)
      .eq("user_id", userId)
      .order("created_at", { ascending: true });
    if (error) throw error;
    return rows ?? [];
  });

// ---------- Chat send (non-streaming; UI shows typing indicator) ----------

const SendInput = z.object({
  threadId: z.string().uuid(),
  content: z.string().min(1).max(4000),
  documentId: z.string().uuid().nullable().optional(),
  useAllDocuments: z.boolean().optional(),
});

export const sendChatMessage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => SendInput.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) throw new Error("LOVABLE_API_KEY not configured");

    // Verify thread ownership
    const { data: thread, error: tErr } = await supabase
      .from("chat_threads")
      .select("id,title,language,education_level,course")
      .eq("id", data.threadId)
      .eq("user_id", userId)
      .maybeSingle();
    if (tErr) throw tErr;
    if (!thread) throw new Error("Thread not found");

    const { data: profile } = await supabase
      .from("profiles")
      .select("education_level,course,semester,faculty,preferred_language")
      .eq("id", userId)
      .maybeSingle();

    // Insert user message
    const { error: uErr } = await supabase.from("chat_messages").insert({
      thread_id: data.threadId,
      user_id: userId,
      role: "user",
      content: data.content,
    });
    if (uErr) throw uErr;

    // Fetch conversation history
    const { data: history } = await supabase
      .from("chat_messages")
      .select("role,content")
      .eq("thread_id", data.threadId)
      .eq("user_id", userId)
      .order("created_at", { ascending: true })
      .limit(30);

    // RAG: retrieve relevant chunks
    let ragContext = "";
    const sources: Array<{ document_id: string; chunk_index: number; page_number: number | null; title?: string }> = [];
    if (data.documentId || data.useAllDocuments) {
      try {
        const emb = await embedOne(apiKey, data.content);
        const { data: matches } = await supabase.rpc("match_document_chunks", {
          query_embedding: emb as unknown as string,
          match_count: 6,
          filter_document_id: data.documentId ?? undefined,
        });
        if (matches && matches.length) {
          const ids = Array.from(new Set(matches.map((m: any) => m.document_id)));
          const { data: docs } = await supabase
            .from("documents")
            .select("id,title")
            .in("id", ids);
          const titleMap = new Map((docs ?? []).map((d) => [d.id, d.title]));
          ragContext = matches
            .map(
              (m: any, i: number) =>
                `[Doc chunk ${i + 1}] (${titleMap.get(m.document_id) ?? "Document"}, page ${m.page_number ?? "?"}):\n${m.content}`,
            )
            .join("\n\n");
          for (const m of matches as any[]) {
            sources.push({
              document_id: m.document_id,
              chunk_index: m.chunk_index,
              page_number: m.page_number,
              title: titleMap.get(m.document_id),
            });
          }
        }
      } catch (e) {
        console.error("RAG lookup failed", e);
      }
    }

    const system = buildSystemPrompt({
      educationLevel: profile?.education_level ?? thread.education_level ?? null,
      course: profile?.course ?? thread.course ?? null,
      semester: profile?.semester ?? null,
      faculty: profile?.faculty ?? null,
      language: profile?.preferred_language ?? thread.language ?? "auto",
      ragContext: ragContext || undefined,
    });

    const messages = [
      { role: "system" as const, content: system },
      ...(history ?? []).map((m) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      })),
    ];

    const reply = await callLovableChat({
      apiKey,
      model: "google/gemini-3-flash-preview",
      messages,
    });

    // Persist assistant message
    const { data: assistantRow, error: aErr } = await supabase
      .from("chat_messages")
      .insert({
        thread_id: data.threadId,
        user_id: userId,
        role: "assistant",
        content: reply,
        sources: sources.length ? sources : null,
      })
      .select("id,role,content,sources,created_at")
      .single();
    if (aErr) throw aErr;

    // Update thread last_message_at + auto-title if still default
    const updates: { last_message_at: string; title?: string } = {
      last_message_at: new Date().toISOString(),
    };
    if (thread.title === "New chat") {
      updates.title = data.content.slice(0, 60);
    }
    await supabase.from("chat_threads").update(updates).eq("id", data.threadId);

    return assistantRow;
  });
