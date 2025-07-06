
-- Create game_saves table for storing game states
CREATE TABLE public.game_saves (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  game_type TEXT NOT NULL,
  game_data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on game_saves
ALTER TABLE public.game_saves ENABLE ROW LEVEL SECURITY;

-- Create policies for game_saves (users can only access their own saves)
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

-- Add index for better performance
CREATE INDEX idx_game_saves_user_game ON public.game_saves(user_id, game_type);
