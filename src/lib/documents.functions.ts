import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { embedTexts } from "./embeddings.server";
import { callLovableChat } from "./ai-gateway.server";
import { z } from "zod";

export const listDocuments = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data, error } = await supabase
      .from("documents")
      .select("id,title,filename,status,page_count,size_bytes,created_at,error_message")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data ?? [];
  });

export const createDocument = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        title: z.string().min(1).max(200),
        filename: z.string().min(1).max(200),
        storage_path: z.string().min(1),
        mime_type: z.string().max(100).optional(),
        size_bytes: z.number().int().nonnegative().optional(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    // Ensure the storage path is inside the user's folder
    if (!data.storage_path.startsWith(`${userId}/`)) {
      throw new Error("Invalid storage path");
    }
    const { data: row, error } = await supabase
      .from("documents")
      .insert({
        user_id: userId,
        title: data.title,
        filename: data.filename,
        storage_path: data.storage_path,
        mime_type: data.mime_type ?? null,
        size_bytes: data.size_bytes ?? null,
        status: "pending",
      })
      .select("id")
      .single();
    if (error) throw error;
    return { id: row.id };
  });

export const deleteDocument = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: doc } = await supabase
      .from("documents")
      .select("storage_path")
      .eq("id", data.id)
      .eq("user_id", userId)
      .maybeSingle();
    if (doc?.storage_path) {
      await supabase.storage.from("documents").remove([doc.storage_path]);
    }
    const { error } = await supabase
      .from("documents")
      .delete()
      .eq("id", data.id)
      .eq("user_id", userId);
    if (error) throw error;
    return { ok: true };
  });

function chunkText(text: string, targetLen = 1200, overlap = 150): string[] {
  const clean = text.replace(/\r/g, "").replace(/\n{3,}/g, "\n\n").trim();
  if (!clean) return [];
  const chunks: string[] = [];
  let i = 0;
  while (i < clean.length) {
    const end = Math.min(clean.length, i + targetLen);
    // extend to next paragraph or sentence boundary
    let stop = end;
    if (end < clean.length) {
      const para = clean.indexOf("\n\n", end);
      const dot = clean.indexOf(". ", end);
      const candidates = [para, dot].filter((n) => n !== -1 && n - end < 200);
      if (candidates.length) stop = Math.min(...candidates) + 1;
    }
    chunks.push(clean.slice(i, stop).trim());
    if (stop >= clean.length) break;
    i = Math.max(stop - overlap, i + 1);
  }
  return chunks.filter((c) => c.length > 20);
}

export const processDocument = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) throw new Error("LOVABLE_API_KEY not configured");

    const { data: doc, error: dErr } = await supabase
      .from("documents")
      .select("id,storage_path,status")
      .eq("id", data.id)
      .eq("user_id", userId)
      .maybeSingle();
    if (dErr) throw dErr;
    if (!doc) throw new Error("Document not found");

    await supabase.from("documents").update({ status: "processing", error_message: null }).eq("id", doc.id);

    try {
      const { data: file, error: fErr } = await supabase.storage
        .from("documents")
        .download(doc.storage_path);
      if (fErr || !file) throw new Error(fErr?.message ?? "Download failed");
      const bytes = new Uint8Array(await file.arrayBuffer());

      // Extract text with unpdf (edge-compatible)
      const { extractText, getDocumentProxy } = await import("unpdf");
      const pdf = await getDocumentProxy(bytes);
      const numPages = pdf.numPages;

      // Extract all pages then split
      const pageTexts: { page: number; text: string }[] = [];
      const { text: allPages } = await extractText(pdf, { mergePages: false });
      const pagesArr = Array.isArray(allPages) ? allPages : [allPages];
      pagesArr.forEach((t, i) => {
        if (t && t.trim()) pageTexts.push({ page: i + 1, text: t });
      });

      // Build chunks with page numbers
      const chunks: { content: string; page_number: number; chunk_index: number }[] = [];
      let idx = 0;
      for (const pt of pageTexts) {
        for (const c of chunkText(pt.text)) {
          chunks.push({ content: c, page_number: pt.page, chunk_index: idx++ });
        }
      }

      // Embed in batches
      const BATCH = 32;
      const rows: Array<{
        document_id: string;
        user_id: string;
        chunk_index: number;
        page_number: number;
        content: string;
        embedding: string;
      }> = [];
      for (let i = 0; i < chunks.length; i += BATCH) {
        const batch = chunks.slice(i, i + BATCH);
        const embeddings = await embedTexts(
          apiKey,
          batch.map((b) => b.content),
        );
        batch.forEach((b, j) => {
          rows.push({
            document_id: doc.id,
            user_id: userId,
            chunk_index: b.chunk_index,
            page_number: b.page_number,
            content: b.content,
            embedding: `[${embeddings[j].join(",")}]`,
          });
        });
      }

      // Clear existing chunks then insert
      await supabase.from("document_chunks").delete().eq("document_id", doc.id);
      if (rows.length) {
        // Insert in slices of 100
        for (let i = 0; i < rows.length; i += 100) {
          const { error } = await supabase.from("document_chunks").insert(rows.slice(i, i + 100));
          if (error) throw error;
        }
      }

      await supabase
        .from("documents")
        .update({ status: "ready", page_count: numPages })
        .eq("id", doc.id);
      return { ok: true, pages: numPages, chunks: rows.length };
    } catch (e: any) {
      await supabase
        .from("documents")
        .update({ status: "error", error_message: String(e?.message ?? e).slice(0, 500) })
        .eq("id", doc.id);
      throw e;
    }
  });

export const getDocumentSignedUrl = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: doc } = await supabase
      .from("documents")
      .select("storage_path")
      .eq("id", data.id)
      .eq("user_id", userId)
      .maybeSingle();
    if (!doc) throw new Error("Not found");
    const { data: signed, error } = await supabase.storage
      .from("documents")
      .createSignedUrl(doc.storage_path, 3600);
    if (error) throw error;
    return { url: signed.signedUrl };
  });

// ---------- AI-generated content ----------

const GenInput = z.object({
  documentId: z.string().uuid().nullable().optional(),
  topic: z.string().max(500).optional(),
  kind: z.enum(["notes", "summary", "quiz", "cheatsheet"]),
  quizType: z.enum(["mcq", "short", "long", "true_false", "fill"]).optional(),
  count: z.number().int().min(1).max(20).optional(),
});

export const generateStudyContent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => GenInput.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) throw new Error("LOVABLE_API_KEY not configured");

    const { data: profile } = await supabase
      .from("profiles")
      .select("education_level,course,semester,faculty,preferred_language")
      .eq("id", userId)
      .maybeSingle();

    // Gather source context
    let sourceText = "";
    let docTitle = "Study material";
    if (data.documentId) {
      const { data: doc } = await supabase
        .from("documents")
        .select("id,title")
        .eq("id", data.documentId)
        .eq("user_id", userId)
        .maybeSingle();
      if (doc) docTitle = doc.title;
      const { data: chunks } = await supabase
        .from("document_chunks")
        .select("content,page_number")
        .eq("document_id", data.documentId)
        .eq("user_id", userId)
        .order("chunk_index")
        .limit(30);
      sourceText = (chunks ?? [])
        .map((c) => `(p.${c.page_number ?? "?"}) ${c.content}`)
        .join("\n\n");
    }

    const kindPrompt: Record<string, string> = {
      notes: "Produce concise, well-structured revision notes with headings, bullet points, definitions, and key formulas. Format as Markdown.",
      summary: "Produce a clear chapter-style summary highlighting key concepts, definitions, formulas, and examples. Format as Markdown.",
      cheatsheet: "Produce an exam cheat sheet with the most important definitions, formulas, and one-line concepts. Compact Markdown.",
      quiz: `Generate ${data.count ?? 8} ${data.quizType ?? "mcq"} questions. For MCQs, provide 4 options and mark the correct answer. Return Markdown.`,
    };

    const profileLine = [
      profile?.education_level && `Education: ${profile.education_level}`,
      profile?.course && `Course: ${profile.course}`,
      profile?.semester && `Semester: ${profile.semester}`,
    ]
      .filter(Boolean)
      .join(" | ");

    const sys =
      "You are StudyPlanner AI Tutor for Nepali students (TU/NEB/SEE curriculum). " +
      "Use terminology common in Nepali institutions. Be exam-oriented and concise.";
    const user =
      `${kindPrompt[data.kind]}\n\n` +
      (profileLine ? `Student: ${profileLine}\n` : "") +
      (data.topic ? `Topic: ${data.topic}\n` : "") +
      (sourceText
        ? `\nUse the following source material as the primary basis:\n---\n${sourceText.slice(0, 12000)}\n---`
        : "");

    const content = await callLovableChat({
      apiKey,
      model: "google/gemini-3-flash-preview",
      messages: [
        { role: "system", content: sys },
        { role: "user", content: user },
      ],
    });

    const title =
      data.kind === "quiz"
        ? `Quiz — ${data.topic ?? docTitle}`
        : `${data.kind[0].toUpperCase()}${data.kind.slice(1)} — ${data.topic ?? docTitle}`;

    const { data: row, error } = await supabase
      .from("generated_content")
      .insert({
        user_id: userId,
        kind: data.kind,
        title,
        content: { markdown: content },
        source_document_id: data.documentId ?? null,
      })
      .select("id,title,kind,content,created_at")
      .single();
    if (error) throw error;
    return row;
  });

export const listGeneratedContent = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data, error } = await supabase
      .from("generated_content")
      .select("id,title,kind,content,created_at,source_document_id")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data ?? [];
  });

export const deleteGeneratedContent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { error } = await supabase
      .from("generated_content")
      .delete()
      .eq("id", data.id)
      .eq("user_id", userId);
    if (error) throw error;
    return { ok: true };
  });
