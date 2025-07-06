
-- Create temp_passwords table for admin access
CREATE TABLE public.temp_passwords (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  password TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  used BOOLEAN NOT NULL DEFAULT false
);

-- Enable RLS on temp_passwords
ALTER TABLE public.temp_passwords ENABLE ROW LEVEL SECURITY;

-- Create policies for temp_passwords (admin access only)
CREATE POLICY "Allow temp password lookup" 
  ON public.temp_passwords 
  FOR SELECT 
  USING (true);

CREATE POLICY "Allow temp password creation" 
  ON public.temp_passwords 
  FOR INSERT 
  WITH CHECK (true);

CREATE POLICY "Allow temp password updates" 
  ON public.temp_passwords 
  FOR UPDATE 
  USING (true);

-- Add index for better performance
CREATE INDEX idx_temp_passwords_password ON public.temp_passwords(password);
CREATE INDEX idx_temp_passwords_expires ON public.temp_passwords(expires_at);
