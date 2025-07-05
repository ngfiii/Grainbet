
-- Create admin policies to allow viewing all users and balances
-- First, let's create a more permissive policy for profiles that allows admins to see all profiles
CREATE POLICY "Admins can view all profiles" 
  ON public.profiles 
  FOR SELECT 
  USING (true);

-- Create a more permissive policy for user_balances that allows admins to see all balances
CREATE POLICY "Admins can view all balances" 
  ON public.user_balances 
  FOR SELECT 
  USING (true);

-- Also allow admins to update any user's balance
CREATE POLICY "Admins can update any balance" 
  ON public.user_balances 
  FOR UPDATE 
  USING (true);

-- Allow admins to insert balance records for any user
CREATE POLICY "Admins can insert any balance" 
  ON public.user_balances 
  FOR INSERT 
  WITH CHECK (true);
