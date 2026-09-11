
CREATE OR REPLACE FUNCTION public.profiles_prevent_protected_writes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  jwt_role text;
BEGIN
  -- Determine effective role: service_role bypasses; authenticated users cannot modify protected columns.
  BEGIN
    jwt_role := current_setting('request.jwt.claims', true)::json->>'role';
  EXCEPTION WHEN OTHERS THEN
    jwt_role := NULL;
  END;

  IF jwt_role IS DISTINCT FROM 'service_role' THEN
    NEW.xp := OLD.xp;
    NEW.level := OLD.level;
    NEW.streak_days := OLD.streak_days;
    NEW.email := OLD.email;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS profiles_protect_gamification ON public.profiles;
CREATE TRIGGER profiles_protect_gamification
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.profiles_prevent_protected_writes();
