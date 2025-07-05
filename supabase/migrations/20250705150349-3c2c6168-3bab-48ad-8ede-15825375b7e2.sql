
-- Update the coin_keys table policies to allow proper admin operations
-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Allow key insertion" ON public.coin_keys;
DROP POLICY IF EXISTS "Allow key deletion" ON public.coin_keys;

-- Create new policies that allow authenticated users to insert and delete keys
-- (we'll handle admin check in the application code)
CREATE POLICY "Authenticated users can insert keys" 
  ON public.coin_keys 
  FOR INSERT 
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete keys" 
  ON public.coin_keys 
  FOR DELETE 
  TO authenticated
  USING (true);
