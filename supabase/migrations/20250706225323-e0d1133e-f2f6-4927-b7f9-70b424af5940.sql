
-- Create table for saving game states
CREATE TABLE public.game_saves (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  game_type TEXT NOT NULL, -- 'mines', 'blackjack', etc.
  game_data JSONB NOT NULL, -- stores the game state
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, game_type)
);

-- Enable RLS on game saves
ALTER TABLE public.game_saves ENABLE ROW LEVEL SECURITY;

-- Create policies for game saves
CREATE POLICY "Users can view their own game saves" 
  ON public.game_saves 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own game saves" 
  ON public.game_saves 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own game saves" 
  ON public.game_saves 
  FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own game saves" 
  ON public.game_saves 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- Update the signup bonus to 500 coins
DROP FUNCTION IF EXISTS public.handle_new_user();

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.profiles (id, username)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data ->> 'username', NEW.email));
  
  INSERT INTO public.user_balances (id, balance)
  VALUES (NEW.id, 500.00);
  
  RETURN NEW;
END;
$$;

-- Make sure the trigger still exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Add index for better performance on game saves
CREATE INDEX idx_game_saves_user_game ON public.game_saves(user_id, game_type);
