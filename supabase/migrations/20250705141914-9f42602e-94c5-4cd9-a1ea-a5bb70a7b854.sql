
-- Create coin_keys table for redemption codes
CREATE TABLE public.coin_keys (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  amount INTEGER NOT NULL,
  used BOOLEAN NOT NULL DEFAULT false,
  used_by UUID REFERENCES auth.users,
  used_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add Row Level Security (RLS)
ALTER TABLE public.coin_keys ENABLE ROW LEVEL SECURITY;

-- Create policy that allows anyone to SELECT unused keys (for redemption)
CREATE POLICY "Anyone can view unused keys" 
  ON public.coin_keys 
  FOR SELECT 
  USING (used = false);

-- Create policy that allows anyone to UPDATE keys when redeeming
CREATE POLICY "Anyone can update keys for redemption" 
  ON public.coin_keys 
  FOR UPDATE 
  USING (used = false);

-- Create policy that allows admins to INSERT keys (we'll handle admin check in code)
CREATE POLICY "Allow key insertion" 
  ON public.coin_keys 
  FOR INSERT 
  WITH CHECK (true);

-- Create policy that allows admins to DELETE keys (we'll handle admin check in code)
CREATE POLICY "Allow key deletion" 
  ON public.coin_keys 
  FOR DELETE 
  USING (true);
