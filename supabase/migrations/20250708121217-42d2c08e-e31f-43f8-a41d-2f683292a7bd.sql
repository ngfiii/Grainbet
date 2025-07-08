
-- First, let's create some new overpowered admin functions
CREATE OR REPLACE FUNCTION public.admin_delete_all_users()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  deleted_count integer;
BEGIN
  -- Delete from profiles (this will cascade to other tables due to foreign keys)
  DELETE FROM public.profiles WHERE id != auth.uid();
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$;

-- Function to multiply all user balances
CREATE OR REPLACE FUNCTION public.admin_multiply_all_balances(multiplier numeric)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  updated_count integer;
BEGIN
  UPDATE public.user_balances 
  SET balance = balance * multiplier, updated_at = now()
  WHERE id IS NOT NULL;
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RETURN updated_count;
END;
$$;

-- Function to set random balances for all users
CREATE OR REPLACE FUNCTION public.admin_randomize_all_balances(min_balance numeric DEFAULT 100, max_balance numeric DEFAULT 10000)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  updated_count integer;
BEGIN
  UPDATE public.user_balances 
  SET balance = floor(random() * (max_balance - min_balance + 1) + min_balance), 
      updated_at = now()
  WHERE id IS NOT NULL;
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RETURN updated_count;
END;
$$;

-- Function to create fake users for testing
CREATE OR REPLACE FUNCTION public.admin_create_fake_users(user_count integer DEFAULT 10)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  i integer;
  fake_id uuid;
  fake_username text;
  fake_balance numeric;
BEGIN
  FOR i IN 1..user_count LOOP
    fake_id := gen_random_uuid();
    fake_username := 'FakeUser' || i::text;
    fake_balance := floor(random() * 50000 + 1000);
    
    -- Insert into profiles
    INSERT INTO public.profiles (id, username) 
    VALUES (fake_id, fake_username);
    
    -- Insert into user_balances
    INSERT INTO public.user_balances (id, balance) 
    VALUES (fake_id, fake_balance);
    
    -- Insert into user_stats
    INSERT INTO public.user_stats (user_id, total_bets, biggest_win, longest_win_streak) 
    VALUES (fake_id, floor(random() * 1000), floor(random() * 10000), floor(random() * 50));
  END LOOP;
  
  RETURN user_count;
END;
$$;

-- Function to wipe everything (nuclear option)
CREATE OR REPLACE FUNCTION public.admin_nuclear_reset()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result_text text;
BEGIN
  -- Clear all game history
  DELETE FROM public.game_history;
  
  -- Reset all user stats
  UPDATE public.user_stats 
  SET total_bets = 0, total_won = 0, total_lost = 0, biggest_win = 0,
      current_win_streak = 0, current_loss_streak = 0,
      longest_win_streak = 0, longest_loss_streak = 0;
  
  -- Set all balances to 1000
  UPDATE public.user_balances SET balance = 1000;
  
  -- Clear all game saves
  DELETE FROM public.game_saves;
  
  result_text := 'Nuclear reset complete: All history cleared, stats reset, balances set to 1000';
  RETURN result_text;
END;
$$;

-- Update the leaderboard view to ensure it shows all users properly
DROP VIEW IF EXISTS public.leaderboard_stats;
CREATE VIEW public.leaderboard_stats AS
SELECT 
  p.id as user_id,
  p.username,
  COALESCE(ub.balance, 0) as balance,
  COALESCE(us.total_bets, 0) as total_bets,
  COALESCE(us.biggest_win, 0) as biggest_win,
  COALESCE(us.longest_win_streak, 0) as longest_win_streak
FROM public.profiles p
LEFT JOIN public.user_balances ub ON p.id = ub.id
LEFT JOIN public.user_stats us ON p.id = us.user_id
ORDER BY COALESCE(ub.balance, 0) DESC;
