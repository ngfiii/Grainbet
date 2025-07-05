
-- Drop the existing restrictive policies
DROP POLICY IF EXISTS "Anyone can view unused keys" ON public.coin_keys;
DROP POLICY IF EXISTS "Anyone can update keys for redemption" ON public.coin_keys;

-- Create new policies that allow proper key redemption
-- Allow anyone to view keys (needed for redemption lookup)
CREATE POLICY "Allow key lookup for redemption" 
  ON public.coin_keys 
  FOR SELECT 
  USING (true);

-- Allow anyone to update keys for redemption (marking as used)
CREATE POLICY "Allow key redemption updates" 
  ON public.coin_keys 
  FOR UPDATE 
  USING (true);
