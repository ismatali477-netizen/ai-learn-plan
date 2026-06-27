import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { callLovableChat } from "./ai-gateway.server";
import { z } from "zod";

const GenerateInput = z.object({
  title: z.string().min(2).max(120),
  start_date: z.string(),
  end_date: z.string(),
  daily_minutes: z.number().int().min(15).max(720),
  focus: z.string().max(500).optional(),
});

type AiTask = {
  scheduled_date: string;
  title: string;
  description?: string;
  subject_name?: string;
  duration_minutes: number;
  priority: number;
};

export const generateStudyPlan = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => GenerateInput.parse(data))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) throw new Error("LOVABLE_API_KEY not configured");

    const [{ data: subjects }, { data: exams }] = await Promise.all([
      supabase.from("subjects").select("id,name,difficulty,notes").eq("user_id", userId),
      supabase.from("exams").select("id,title,exam_date,importance,subject_id,topics").eq("user_id", userId).gte("exam_date", data.start_date),
    ]);

    const sys =
      "You are an expert academic study coach. Output ONLY valid JSON matching the schema. " +
      "Build a realistic, paced day-by-day plan that respects exam dates, difficulty, and the user's daily minute budget. " +
      "Prioritize subjects with upcoming exams. Include short revision sessions before exam dates. " +
      "Schema: {\"summary\": string, \"tasks\": [{\"scheduled_date\": \"YYYY-MM-DD\", \"title\": string, \"description\": string, \"subject_name\": string, \"duration_minutes\": int, \"priority\": 1-5}]}";

    const userMsg = JSON.stringify({
      title: data.title,
      start_date: data.start_date,
      end_date: data.end_date,
      daily_minutes: data.daily_minutes,
      focus: data.focus ?? "",
      subjects: subjects ?? [],
      exams: exams ?? [],
    });

    const raw = await callLovableChat({
      apiKey,
      model: "google/gemini-3-flash-preview",
      messages: [
        { role: "system", content: sys },
        { role: "user", content: userMsg },
      ],
      response_format: { type: "json_object" },
    });

    let parsed: { summary: string; tasks: AiTask[] };
    try {
      parsed = JSON.parse(raw);
    } catch {
      const m = raw.match(/\{[\s\S]*\}/);
      if (!m) throw new Error("AI returned invalid JSON");
      parsed = JSON.parse(m[0]);
    }

    // Insert plan
    const { data: plan, error: planErr } = await supabase
      .from("study_plans")
      .insert({
        user_id: userId,
        title: data.title,
        summary: parsed.summary,
        start_date: data.start_date,
        end_date: data.end_date,
        ai_meta: { daily_minutes: data.daily_minutes, focus: data.focus ?? null },
      })
      .select()
      .single();
    if (planErr || !plan) throw new Error(planErr?.message ?? "Failed to create plan");

    // Map subject names → ids
    const nameToId = new Map<string, string>();
    (subjects ?? []).forEach((s) => nameToId.set(s.name.toLowerCase(), s.id));

    const taskRows = (parsed.tasks ?? []).slice(0, 200).map((t) => ({
      user_id: userId,
      plan_id: plan.id,
      subject_id: t.subject_name ? nameToId.get(t.subject_name.toLowerCase()) ?? null : null,
      title: t.title.slice(0, 200),
      description: t.description?.slice(0, 1000) ?? null,
      scheduled_date: t.scheduled_date,
      duration_minutes: Math.max(5, Math.min(480, Math.round(t.duration_minutes || 30))),
      priority: Math.max(1, Math.min(5, Math.round(t.priority || 3))),
      status: "pending" as const,
    }));

    if (taskRows.length) {
      const { error: taskErr } = await supabase.from("study_tasks").insert(taskRows);
      if (taskErr) throw new Error(taskErr.message);
    }

    return { plan_id: plan.id, task_count: taskRows.length, summary: parsed.summary };
  });

export const toggleTaskComplete = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid(), completed: z.boolean() }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { error } = await supabase
      .from("study_tasks")
      .update({
        status: data.completed ? "completed" : "pending",
        completed_at: data.completed ? new Date().toISOString() : null,
      })
      .eq("id", data.id)
      .eq("user_id", userId);
    if (error) throw new Error(error.message);

    if (data.completed) {
      await supabase.rpc; // noop placeholder; XP handled below
      const { data: t } = await supabase
        .from("study_tasks")
        .select("duration_minutes")
        .eq("id", data.id)
        .single();
      const xp = Math.max(5, Math.round((t?.duration_minutes ?? 30) / 3));
      const { data: prof } = await supabase.from("profiles").select("xp").eq("id", userId).single();
      await supabase
        .from("profiles")
        .update({ xp: (prof?.xp ?? 0) + xp })
        .eq("id", userId);
    }
    return { ok: true };
  });
