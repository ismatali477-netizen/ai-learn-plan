import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

/** XP needed to reach a given level: simple curve. Level N starts at 100*(N-1)^1.5 XP. */
export function xpForLevel(level: number) {
  return Math.round(100 * Math.pow(Math.max(0, level - 1), 1.5));
}
export function levelFromXp(xp: number) {
  let lvl = 1;
  while (xpForLevel(lvl + 1) <= xp) lvl++;
  return lvl;
}

/**
 * Recompute the user's current streak (consecutive days with at least one completed task
 * OR a study session that lasted >= 5 min).
 */
async function recomputeStreak(supabase: any, userId: string): Promise<number> {
  const since = new Date();
  since.setDate(since.getDate() - 60);
  const sinceStr = since.toISOString().slice(0, 10);

  const [{ data: tasks }, { data: sessions }] = await Promise.all([
    supabase
      .from("study_tasks")
      .select("completed_at")
      .eq("user_id", userId)
      .eq("status", "completed")
      .gte("completed_at", since.toISOString()),
    supabase
      .from("study_sessions")
      .select("started_at,duration_minutes")
      .eq("user_id", userId)
      .gte("started_at", since.toISOString()),
  ]);

  const days = new Set<string>();
  (tasks ?? []).forEach((t: any) => {
    if (t.completed_at) days.add(new Date(t.completed_at).toISOString().slice(0, 10));
  });
  (sessions ?? []).forEach((s: any) => {
    if ((s.duration_minutes ?? 0) >= 5) days.add(new Date(s.started_at).toISOString().slice(0, 10));
  });

  let streak = 0;
  const cursor = new Date();
  // Allow today to be empty without breaking the streak
  if (!days.has(cursor.toISOString().slice(0, 10))) {
    cursor.setDate(cursor.getDate() - 1);
  }
  while (days.has(cursor.toISOString().slice(0, 10))) {
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }
  // Ignore sinceStr unused warning
  void sinceStr;
  return streak;
}

type EarnedAchievement = { code: string; title: string; description: string; icon: string; xp_reward: number };

/**
 * Recalculate XP/level/streak, then award any unlocked achievements.
 * Returns newly earned achievement rows so the client can celebrate.
 */
export const syncProgress = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<{ newly_earned: EarnedAchievement[]; streak: number; xp: number; level: number }> => {
    const { supabase, userId } = context;

    // Aggregate counts
    const [
      { count: tasksCount },
      { count: sessionsCount },
      { count: subjectsCount },
      { count: examsCount },
      { count: plansCount },
      { data: prof },
    ] = await Promise.all([
      supabase.from("study_tasks").select("id", { head: true, count: "exact" }).eq("user_id", userId).eq("status", "completed"),
      supabase.from("study_sessions").select("id", { head: true, count: "exact" }).eq("user_id", userId).gte("duration_minutes", 5),
      supabase.from("subjects").select("id", { head: true, count: "exact" }).eq("user_id", userId),
      supabase.from("exams").select("id", { head: true, count: "exact" }).eq("user_id", userId),
      supabase.from("study_plans").select("id", { head: true, count: "exact" }).eq("user_id", userId),
      supabase.from("profiles").select("xp").eq("id", userId).maybeSingle(),
    ]);

    const streak = await recomputeStreak(supabase, userId);

    const counts: Record<string, number> = {
      tasks_completed: tasksCount ?? 0,
      sessions_completed: sessionsCount ?? 0,
      subjects_added: subjectsCount ?? 0,
      exams_added: examsCount ?? 0,
      plans_generated: plansCount ?? 0,
      streak_days: streak,
      xp_total: prof?.xp ?? 0,
    };

    const { data: catalog } = await supabase.from("achievements").select("*");
    const { data: already } = await supabase.from("user_achievements").select("achievement_id").eq("user_id", userId);
    const ownedIds = new Set((already ?? []).map((r: any) => r.achievement_id));

    const newlyEarned: EarnedAchievement[] = [];
    let bonusXp = 0;
    const toInsert: { user_id: string; achievement_id: string }[] = [];
    for (const a of catalog ?? []) {
      if (ownedIds.has(a.id)) continue;
      const current = counts[a.threshold_type] ?? 0;
      if (current >= a.threshold_value) {
        toInsert.push({ user_id: userId, achievement_id: a.id });
        bonusXp += a.xp_reward;
        newlyEarned.push({ code: a.code, title: a.title, description: a.description, icon: a.icon, xp_reward: a.xp_reward });
      }
    }
    if (toInsert.length) {
      await supabase.from("user_achievements").insert(toInsert);
      // Notification rows
      await supabase.from("notifications").insert(
        newlyEarned.map((a) => ({
          user_id: userId,
          type: "achievement",
          title: `🏆 Unlocked: ${a.title}`,
          body: `${a.description} (+${a.xp_reward} XP)`,
          link: "/achievements",
        }))
      );
    }

    const newXp = (prof?.xp ?? 0) + bonusXp;
    const newLevel = levelFromXp(newXp);
    await supabase.from("profiles").update({ xp: newXp, level: newLevel, streak_days: streak }).eq("id", userId);

    return { newly_earned: newlyEarned, streak, xp: newXp, level: newLevel };
  });

/** Mark notifications as read. */
export const markNotificationsRead = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ ids: z.array(z.string().uuid()).optional() }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const q = supabase.from("notifications").update({ read_at: new Date().toISOString() }).eq("user_id", userId).is("read_at", null);
    const { error } = data.ids?.length ? await q.in("id", data.ids) : await q;
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/** Generate just-in-time exam/missed-task notifications (idempotent per day). */
export const syncReminders = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const today = new Date().toISOString().slice(0, 10);
    const in7 = new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10);

    const [{ data: exams }, { data: missed }, { data: existing }] = await Promise.all([
      supabase.from("exams").select("id,title,exam_date").eq("user_id", userId).gte("exam_date", today).lte("exam_date", in7),
      supabase.from("study_tasks").select("id,title,scheduled_date").eq("user_id", userId).eq("status", "pending").lt("scheduled_date", today),
      supabase.from("notifications").select("type,link,created_at").eq("user_id", userId).gte("created_at", `${today}T00:00:00Z`),
    ]);

    const seen = new Set((existing ?? []).map((n: any) => `${n.type}:${n.link}`));
    const rows: any[] = [];
    for (const e of exams ?? []) {
      const link = `/exams#${e.id}`;
      const key = `exam_reminder:${link}`;
      if (seen.has(key)) continue;
      const days = Math.max(0, Math.ceil((new Date(e.exam_date).getTime() - Date.now()) / 86400000));
      rows.push({ user_id: userId, type: "exam_reminder", title: `📅 ${e.title} in ${days}d`, body: `Exam on ${e.exam_date}. Stay on plan!`, link });
    }
    if ((missed ?? []).length) {
      const link = "/dashboard";
      const key = `missed_tasks:${link}`;
      if (!seen.has(key)) {
        rows.push({ user_id: userId, type: "missed_tasks", title: `⏰ ${missed!.length} overdue task${missed!.length > 1 ? "s" : ""}`, body: "Review your plan and reschedule what you missed.", link });
      }
    }
    if (rows.length) await supabase.from("notifications").insert(rows);
    return { created: rows.length };
  });
