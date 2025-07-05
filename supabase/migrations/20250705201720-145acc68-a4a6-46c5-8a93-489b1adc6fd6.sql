
-- Update existing profiles to use username from auth metadata instead of email
UPDATE public.profiles 
SET username = COALESCE(
  (SELECT raw_user_meta_data->>'username' 
   FROM auth.users 
   WHERE auth.users.id = profiles.id), 
  username
)
WHERE username IS NOT NULL;
