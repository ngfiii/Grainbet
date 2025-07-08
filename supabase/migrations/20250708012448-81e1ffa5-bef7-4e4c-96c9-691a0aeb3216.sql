
-- Drop the existing view and recreate it without SECURITY DEFINER
DROP VIEW IF EXISTS public.leaderboard_stats;

-- Create the leaderboard view without SECURITY DEFINER
CREATE VIEW public.leaderboard_stats AS
SELECT 
  p.username,
  ub.balance,
  us.total_bets,
  us.biggest_win,
  us.longest_win_streak,
  us.user_id
FROM public.user_stats us
JOIN public.profiles p ON us.user_id = p.id
JOIN public.user_balances ub ON us.user_id = ub.id
ORDER BY ub.balance DESC;

-- Create user_stats entries for existing users who don't have them
INSERT INTO public.user_stats (user_id)
SELECT p.id 
FROM public.profiles p
LEFT JOIN public.user_stats us ON p.id = us.user_id
WHERE us.user_id IS NULL;

-- Grant necessary permissions for the view
GRANT SELECT ON public.leaderboard_stats TO authenticated;
GRANT SELECT ON public.leaderboard_stats TO anon;
