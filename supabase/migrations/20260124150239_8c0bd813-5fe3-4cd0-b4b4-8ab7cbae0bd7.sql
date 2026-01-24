-- Fix search_path for validate_username function
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
$$ LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public;