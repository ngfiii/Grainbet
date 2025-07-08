
-- Fix the SECURITY DEFINER view issue
ALTER VIEW public.leaderboard_stats SET (security_invoker=on);
