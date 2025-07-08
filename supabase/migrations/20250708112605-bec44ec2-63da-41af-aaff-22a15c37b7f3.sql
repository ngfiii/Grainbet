
-- Ensure the leaderboard view works properly and add any missing functionality
-- Fix the security definer issue if it still exists
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

-- Add a function to bulk update user balances (for admin use)
CREATE OR REPLACE FUNCTION public.admin_bulk_update_balance(
  target_balance numeric,
  user_filter text DEFAULT 'all'
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  updated_count integer;
BEGIN
  IF user_filter = 'all' THEN
    UPDATE public.user_balances 
    SET balance = target_balance, updated_at = now();
    GET DIAGNOSTICS updated_count = ROW_COUNT;
  ELSE
    UPDATE public.user_balances ub
    SET balance = target_balance, updated_at = now()
    FROM public.profiles p
    WHERE ub.id = p.id AND p.username ILIKE '%' || user_filter || '%';
    GET DIAGNOSTICS updated_count = ROW_COUNT;
  END IF;
  
  RETURN updated_count;
END;
$$;

-- Add a function to reset all user stats (for admin use)
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

-- Add a function to delete all game history (for admin use)
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

-- Add a function to give coins to all users (for admin use)
CREATE OR REPLACE FUNCTION public.admin_give_coins_to_all(
  coin_amount numeric
)
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

-- Ensure the update_user_stats function exists and works properly
CREATE OR REPLACE FUNCTION public.update_user_stats(
  p_user_id uuid,
  p_bet_amount numeric,
  p_payout numeric,
  p_is_win boolean,
  p_multiplier numeric DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Insert or update user stats
  INSERT INTO public.user_stats (
    user_id,
    total_bets,
    total_won,
    total_lost,
    biggest_win,
    current_win_streak,
    current_loss_streak,
    longest_win_streak,
    longest_loss_streak
  )
  VALUES (
    p_user_id,
    1,
    CASE WHEN p_is_win THEN p_payout ELSE 0 END,
    CASE WHEN NOT p_is_win THEN p_bet_amount ELSE 0 END,
    CASE WHEN p_is_win THEN p_payout ELSE 0 END,
    CASE WHEN p_is_win THEN 1 ELSE 0 END,
    CASE WHEN NOT p_is_win THEN 1 ELSE 0 END,
    CASE WHEN p_is_win THEN 1 ELSE 0 END,
    CASE WHEN NOT p_is_win THEN 1 ELSE 0 END
  )
  ON CONFLICT (user_id) DO UPDATE SET
    total_bets = user_stats.total_bets + 1,
    total_won = user_stats.total_won + CASE WHEN p_is_win THEN p_payout ELSE 0 END,
    total_lost = user_stats.total_lost + CASE WHEN NOT p_is_win THEN p_bet_amount ELSE 0 END,
    biggest_win = GREATEST(user_stats.biggest_win, CASE WHEN p_is_win THEN p_payout ELSE 0 END),
    current_win_streak = CASE 
      WHEN p_is_win THEN user_stats.current_win_streak + 1 
      ELSE 0 
    END,
    current_loss_streak = CASE 
      WHEN NOT p_is_win THEN user_stats.current_loss_streak + 1 
      ELSE 0 
    END,
    longest_win_streak = GREATEST(
      user_stats.longest_win_streak, 
      CASE WHEN p_is_win THEN user_stats.current_win_streak + 1 ELSE user_stats.current_win_streak END
    ),
    longest_loss_streak = GREATEST(
      user_stats.longest_loss_streak, 
      CASE WHEN NOT p_is_win THEN user_stats.current_loss_streak + 1 ELSE user_stats.current_loss_streak END
    ),
    updated_at = now();
END;
$$;
