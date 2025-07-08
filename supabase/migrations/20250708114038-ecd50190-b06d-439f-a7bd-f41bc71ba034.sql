
-- Fix the leaderboard view with security_invoker to avoid RLS issues
DROP VIEW IF EXISTS public.leaderboard_stats;

CREATE VIEW public.leaderboard_stats 
WITH (security_invoker=on)
AS
SELECT 
    p.id as user_id,
    p.username,
    ub.balance,
    us.total_bets,
    us.biggest_win,
    us.longest_win_streak
FROM public.profiles p
LEFT JOIN public.user_balances ub ON p.id = ub.id
LEFT JOIN public.user_stats us ON p.id = us.user_id
WHERE p.username IS NOT NULL
ORDER BY ub.balance DESC NULLS LAST;

-- Add admin functions for overpowered buttons
CREATE OR REPLACE FUNCTION public.admin_give_coins_to_all(coin_amount numeric)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  updated_count integer;
BEGIN
  UPDATE public.user_balances 
  SET balance = balance + coin_amount, updated_at = now();
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RETURN updated_count;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_reset_all_stats()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  reset_count integer;
BEGIN
  UPDATE public.user_stats 
  SET 
    total_bets = 0,
    total_won = 0,
    total_lost = 0,
    biggest_win = 0,
    current_win_streak = 0,
    current_loss_streak = 0,
    longest_win_streak = 0,
    longest_loss_streak = 0,
    updated_at = now();
  
  GET DIAGNOSTICS reset_count = ROW_COUNT;
  RETURN reset_count;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_clear_game_history()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  deleted_count integer;
BEGIN
  DELETE FROM public.game_history;
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_set_all_balances(target_balance numeric)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  updated_count integer;
BEGIN
  UPDATE public.user_balances 
  SET balance = target_balance, updated_at = now();
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RETURN updated_count;
END;
$$;
