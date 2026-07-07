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

    // Fetch server-recorded start time to compute true elapsed duration.
    const { data: session, error: fetchErr } = await supabase
      .from("study_sessions")
      .select("started_at, ended_at")
      .eq("id", data.id)
      .eq("user_id", userId)
      .maybeSingle();
    if (fetchErr) throw new Error(fetchErr.message);
    if (!session || session.ended_at) return { ok: true, xp_earned: 0 };

    const now = Date.now();
    const startedMs = new Date(session.started_at).getTime();
    const elapsedMinutes = Math.max(0, Math.floor((now - startedMs) / 60000));
    // Trust server elapsed time; clamp client value to at most elapsed and 1440.
    const durationMinutes = Math.min(data.duration_minutes, elapsedMinutes, 1440);

    const { data: updated, error } = await supabase
      .from("study_sessions")
      .update({ ended_at: new Date(now).toISOString(), duration_minutes: durationMinutes, notes: data.notes ?? null })
      .eq("id", data.id)
      .eq("user_id", userId)
      .is("ended_at", null)
      .select("id")
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!updated) return { ok: true, xp_earned: 0 };

    // Award XP for time studied (1 XP per 2 min) — only on first end
    const xp = Math.max(0, Math.round(durationMinutes / 2));
    if (xp > 0) {
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      const { data: prof } = await supabaseAdmin.from("profiles").select("xp").eq("id", userId).maybeSingle();
      await supabaseAdmin.from("profiles").update({ xp: (prof?.xp ?? 0) + xp }).eq("id", userId);
    }


    return { ok: true, xp_earned: xp, duration_minutes: durationMinutes };
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
