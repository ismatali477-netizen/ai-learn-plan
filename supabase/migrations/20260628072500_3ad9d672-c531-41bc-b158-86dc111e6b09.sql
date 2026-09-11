
-- profiles extras
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS learning_goal text,
  ADD COLUMN IF NOT EXISTS level integer NOT NULL DEFAULT 1;

-- user_settings
CREATE TABLE IF NOT EXISTS public.user_settings (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  preferred_start_hour smallint NOT NULL DEFAULT 9,
  preferred_end_hour smallint NOT NULL DEFAULT 21,
  preferred_days jsonb NOT NULL DEFAULT '[1,2,3,4,5]'::jsonb,
  pomodoro_work_minutes smallint NOT NULL DEFAULT 25,
  pomodoro_break_minutes smallint NOT NULL DEFAULT 5,
  pomodoro_long_break_minutes smallint NOT NULL DEFAULT 15,
  notifications_enabled boolean NOT NULL DEFAULT true,
  theme text NOT NULL DEFAULT 'system',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_settings TO authenticated;
GRANT ALL ON public.user_settings TO service_role;
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY user_settings_owner_all ON public.user_settings FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER tg_user_settings_updated_at BEFORE UPDATE ON public.user_settings
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- achievements catalog (public read)
CREATE TABLE IF NOT EXISTS public.achievements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  title text NOT NULL,
  description text NOT NULL,
  icon text NOT NULL DEFAULT 'Trophy',
  xp_reward integer NOT NULL DEFAULT 50,
  threshold_type text NOT NULL,
  threshold_value integer NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.achievements TO authenticated, anon;
GRANT ALL ON public.achievements TO service_role;
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;
CREATE POLICY achievements_read_all ON public.achievements FOR SELECT TO authenticated, anon USING (true);

INSERT INTO public.achievements (code, title, description, icon, xp_reward, threshold_type, threshold_value) VALUES
  ('first_task', 'First Step', 'Complete your first study task', 'Sparkles', 25, 'tasks_completed', 1),
  ('ten_tasks', 'Momentum', 'Complete 10 study tasks', 'Zap', 75, 'tasks_completed', 10),
  ('fifty_tasks', 'Scholar', 'Complete 50 study tasks', 'GraduationCap', 200, 'tasks_completed', 50),
  ('streak_3', 'On a Roll', '3-day study streak', 'Flame', 50, 'streak_days', 3),
  ('streak_7', 'Week Warrior', '7-day study streak', 'Flame', 150, 'streak_days', 7),
  ('streak_30', 'Unstoppable', '30-day study streak', 'Flame', 500, 'streak_days', 30),
  ('first_session', 'Deep Focus', 'Complete your first study session', 'Timer', 25, 'sessions_completed', 1),
  ('ten_sessions', 'Focused Mind', 'Complete 10 study sessions', 'Brain', 100, 'sessions_completed', 10),
  ('first_plan', 'Strategist', 'Generate your first AI plan', 'Wand2', 50, 'plans_generated', 1),
  ('first_subject', 'Curious', 'Add your first subject', 'BookOpen', 15, 'subjects_added', 1),
  ('first_exam', 'Prepared', 'Track your first exam', 'CalendarDays', 15, 'exams_added', 1),
  ('xp_1000', 'Rising Star', 'Earn 1,000 XP', 'Star', 100, 'xp_total', 1000),
  ('xp_5000', 'XP Master', 'Earn 5,000 XP', 'Trophy', 300, 'xp_total', 5000)
ON CONFLICT (code) DO NOTHING;

-- user_achievements
CREATE TABLE IF NOT EXISTS public.user_achievements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  achievement_id uuid NOT NULL REFERENCES public.achievements(id) ON DELETE CASCADE,
  earned_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, achievement_id)
);
GRANT SELECT, INSERT, DELETE ON public.user_achievements TO authenticated;
GRANT ALL ON public.user_achievements TO service_role;
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;
CREATE POLICY user_achievements_owner_all ON public.user_achievements FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- notifications
CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type text NOT NULL,
  title text NOT NULL,
  body text,
  link text,
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS notifications_user_created ON public.notifications (user_id, created_at DESC);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY notifications_owner_all ON public.notifications FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
