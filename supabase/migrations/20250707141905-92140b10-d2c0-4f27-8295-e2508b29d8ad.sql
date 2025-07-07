
-- Add user statistics tracking table
CREATE TABLE public.user_stats (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  total_bets INTEGER NOT NULL DEFAULT 0,
  total_won NUMERIC NOT NULL DEFAULT 0,
  total_lost NUMERIC NOT NULL DEFAULT 0,
  biggest_win NUMERIC NOT NULL DEFAULT 0,
  current_win_streak INTEGER NOT NULL DEFAULT 0,
  current_loss_streak INTEGER NOT NULL DEFAULT 0,
  longest_win_streak INTEGER NOT NULL DEFAULT 0,
  longest_loss_streak INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add game history table for tracking individual games
CREATE TABLE public.game_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  game_type TEXT NOT NULL,
  bet_amount NUMERIC NOT NULL,
  payout NUMERIC NOT NULL DEFAULT 0,
  is_win BOOLEAN NOT NULL,
  multiplier NUMERIC,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on user_stats
ALTER TABLE public.user_stats ENABLE ROW LEVEL SECURITY;

-- Users can view their own stats
CREATE POLICY "Users can view their own stats" 
  ON public.user_stats 
  FOR SELECT 
  USING (auth.uid() = user_id);

-- Users can insert their own stats (auto-created)
CREATE POLICY "Users can insert their own stats" 
  ON public.user_stats 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own stats
CREATE POLICY "Users can update their own stats" 
  ON public.user_stats 
  FOR UPDATE 
  USING (auth.uid() = user_id);

-- Admins can view all stats
CREATE POLICY "Admins can view all stats" 
  ON public.user_stats 
  FOR SELECT 
  USING (true);

-- Enable RLS on game_history
ALTER TABLE public.game_history ENABLE ROW LEVEL SECURITY;

-- Users can view their own game history
CREATE POLICY "Users can view their own game history" 
  ON public.game_history 
  FOR SELECT 
  USING (auth.uid() = user_id);

-- Users can insert their own game history
CREATE POLICY "Users can insert their own game history" 
  ON public.game_history 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Admins can view all game history
CREATE POLICY "Admins can view all game history" 
  ON public.game_history 
  FOR SELECT 
  USING (true);

-- Add public stats view for leaderboard (only non-sensitive data)
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

-- Update the handle_new_user function to also create user stats
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.profiles (id, username)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data ->> 'username', NEW.email));
  
  INSERT INTO public.user_balances (id, balance)
  VALUES (NEW.id, 1000.00);
  
  INSERT INTO public.user_stats (user_id)
  VALUES (NEW.id);
  
  RETURN NEW;
END;
$$;

-- Function to update user stats after a game
CREATE OR REPLACE FUNCTION public.update_user_stats(
  p_user_id UUID,
  p_bet_amount NUMERIC,
  p_payout NUMERIC,
  p_is_win BOOLEAN,
  p_multiplier NUMERIC DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_stats RECORD;
BEGIN
  -- Get current stats
  SELECT * INTO current_stats FROM public.user_stats WHERE user_id = p_user_id;
  
  -- Update stats
  UPDATE public.user_stats SET
    total_bets = total_bets + 1,
    total_won = total_won + CASE WHEN p_is_win THEN p_payout ELSE 0 END,
    total_lost = total_lost + CASE WHEN NOT p_is_win THEN p_bet_amount ELSE 0 END,
    biggest_win = GREATEST(biggest_win, CASE WHEN p_is_win THEN p_payout ELSE 0 END),
    current_win_streak = CASE 
      WHEN p_is_win THEN current_win_streak + 1 
      ELSE 0 
    END,
    current_loss_streak = CASE 
      WHEN NOT p_is_win THEN current_loss_streak + 1 
      ELSE 0 
    END,
    longest_win_streak = GREATEST(longest_win_streak, 
      CASE WHEN p_is_win THEN current_win_streak + 1 ELSE current_win_streak END),
    longest_loss_streak = GREATEST(longest_loss_streak, 
      CASE WHEN NOT p_is_win THEN current_loss_streak + 1 ELSE current_loss_streak END),
    updated_at = now()
  WHERE user_id = p_user_id;
END;
$$;
