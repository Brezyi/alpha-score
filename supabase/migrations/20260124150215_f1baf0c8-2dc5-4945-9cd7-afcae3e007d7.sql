-- Add unique username column to profiles
ALTER TABLE public.profiles 
ADD COLUMN username text UNIQUE;

-- Create index for faster username lookups
CREATE INDEX idx_profiles_username ON public.profiles(username);

-- Create a function to validate username format
CREATE OR REPLACE FUNCTION public.validate_username()
RETURNS TRIGGER AS $$
BEGIN
  -- Username must be 3-20 characters, lowercase letters, numbers, underscores only
  IF NEW.username IS NOT NULL AND NEW.username !~ '^[a-z0-9_]{3,20}$' THEN
    RAISE EXCEPTION 'Username must be 3-20 characters and contain only lowercase letters, numbers, and underscores';
  END IF;
  
  -- Convert to lowercase if provided
  IF NEW.username IS NOT NULL THEN
    NEW.username := lower(NEW.username);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for username validation
CREATE TRIGGER validate_username_trigger
BEFORE INSERT OR UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.validate_username();