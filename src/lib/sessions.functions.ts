import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

export const startSession = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ subject_id: z.string().uuid().nullable().optional(), task_id: z.string().uuid().nullable().optional(), notes: z.string().max(500).optional() }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: row, error } = await supabase
      .from("study_sessions")
      .insert({ user_id: userId, subject_id: data.subject_id ?? null, task_id: data.task_id ?? null, notes: data.notes ?? null, started_at: new Date().toISOString() })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return row;
  });

export const endSession = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid(), duration_minutes: z.number().int().min(0).max(1440), notes: z.string().max(500).optional() }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: updated, error } = await supabase
      .from("study_sessions")
      .update({ ended_at: new Date().toISOString(), duration_minutes: data.duration_minutes, notes: data.notes ?? null })
      .eq("id", data.id)
      .eq("user_id", userId)
      .is("ended_at", null)
      .select("id")
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!updated) return { ok: true, xp_earned: 0 };

    // Award XP for time studied (1 XP per 2 min) — only on first end
    const xp = Math.max(0, Math.round(data.duration_minutes / 2));
    if (xp > 0) {
      const { data: prof } = await supabase.from("profiles").select("xp").eq("id", userId).maybeSingle();
      await supabase.from("profiles").update({ xp: (prof?.xp ?? 0) + xp }).eq("id", userId);
    }

    return { ok: true, xp_earned: xp };
  });

export const deleteSession = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { error } = await supabase.from("study_sessions").delete().eq("id", data.id).eq("user_id", userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
