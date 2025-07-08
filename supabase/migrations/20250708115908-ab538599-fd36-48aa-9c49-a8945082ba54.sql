
-- Fix the admin functions to work properly with WHERE clauses
CREATE OR REPLACE FUNCTION public.admin_give_coins_to_all(coin_amount numeric)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  updated_count integer;
BEGIN
  UPDATE public.user_balances 
  SET balance = balance + coin_amount, updated_at = now()
  WHERE id IS NOT NULL;
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RETURN updated_count;
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
  SET balance = target_balance, updated_at = now()
  WHERE id IS NOT NULL;
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
    updated_at = now()
  WHERE user_id IS NOT NULL;
  
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
  DELETE FROM public.game_history WHERE id IS NOT NULL;
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$;
