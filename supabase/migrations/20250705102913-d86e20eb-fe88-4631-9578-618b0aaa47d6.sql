
-- Create a profiles table to store additional user information
CREATE TABLE public.profiles (
  id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  username TEXT UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  PRIMARY KEY (id)
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create policies for profiles table
CREATE POLICY "Users can view their own profile" 
  ON public.profiles 
  FOR SELECT 
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" 
  ON public.profiles 
  FOR UPDATE 
  USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" 
  ON public.profiles 
  FOR INSERT 
  WITH CHECK (auth.uid() = id);

-- Create a function to handle new user signups
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username)
  VALUES (NEW.id, NEW.email);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a trigger to automatically create a profile when a user signs up
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Update the balance table to store user balances
CREATE TABLE public.user_balances (
  id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  balance DECIMAL(10,2) NOT NULL DEFAULT 1000.00,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  PRIMARY KEY (id)
);

-- Enable RLS for user_balances
ALTER TABLE public.user_balances ENABLE ROW LEVEL SECURITY;

-- Create policies for user_balances
CREATE POLICY "Users can view their own balance" 
  ON public.user_balances 
  FOR SELECT 
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own balance" 
  ON public.user_balances 
  FOR UPDATE 
  USING (auth.uid() = id);

CREATE POLICY "Users can insert their own balance" 
  ON public.user_balances 
  FOR INSERT 
  WITH CHECK (auth.uid() = id);

-- Update the handle_new_user function to also create a balance record
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username)
  VALUES (NEW.id, NEW.email);
  
  INSERT INTO public.user_balances (id, balance)
  VALUES (NEW.id, 1000.00);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
