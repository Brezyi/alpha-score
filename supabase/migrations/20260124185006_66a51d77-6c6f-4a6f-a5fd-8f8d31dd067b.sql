-- Add column to track when display name was last changed
ALTER TABLE public.profiles 
ADD COLUMN display_name_changed_at timestamp with time zone DEFAULT NULL;

-- Create function to check if display name change is allowed (30 days cooldown)
CREATE OR REPLACE FUNCTION public.can_change_display_name(p_user_id uuid)
RETURNS TABLE(allowed boolean, days_remaining integer, next_change_date timestamp with time zone)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  last_change timestamp with time zone;
  cooldown_days integer := 30;
BEGIN
  SELECT display_name_changed_at INTO last_change
  FROM profiles
  WHERE user_id = p_user_id;
  
  -- If never changed, allow it
  IF last_change IS NULL THEN
    RETURN QUERY SELECT true, 0, now();
    RETURN;
  END IF;
  
  -- Check if 30 days have passed
  IF last_change + interval '30 days' <= now() THEN
    RETURN QUERY SELECT true, 0, now();
  ELSE
    RETURN QUERY SELECT 
      false, 
      EXTRACT(DAY FROM (last_change + interval '30 days' - now()))::integer + 1,
      last_change + interval '30 days';
  END IF;
END;
$$;

-- Create trigger to automatically update display_name_changed_at when display_name changes
CREATE OR REPLACE FUNCTION public.track_display_name_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only update timestamp if display_name actually changed
  IF OLD.display_name IS DISTINCT FROM NEW.display_name THEN
    NEW.display_name_changed_at := now();
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_display_name_change
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.track_display_name_change();