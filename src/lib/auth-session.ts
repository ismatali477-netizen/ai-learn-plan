import type { Session } from "@supabase/supabase-js";

// Keeps the most recent signed-in session in memory for this tab.
// If the saved session copy goes missing right after sign-in (e.g. the
// preview's shared login storage hasn't caught up yet), the protected-page
// check can restore it instead of bouncing the user back to the sign-in page.
let lastSession: Session | null = null;

export function rememberSession(session: Session | null) {
  lastSession = session;
}

export function getRememberedSession(): Session | null {
  if (!lastSession) return null;
  const exp = lastSession.expires_at ? lastSession.expires_at * 1000 : 0;
  if (exp && exp < Date.now()) return null;
  return lastSession;
}
