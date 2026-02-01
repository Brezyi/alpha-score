-- Helper: read maintenance mode even when system_settings has RLS
-- Returns false when the setting is missing or unreadable.
CREATE OR REPLACE FUNCTION public.get_maintenance_mode()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v jsonb;
BEGIN
  SELECT value
  INTO v
  FROM public.system_settings
  WHERE key = 'maintenance_mode'
  LIMIT 1;

  -- Works for JSON booleans and JSON strings
  RETURN lower(coalesce(v #>> '{}', 'false')) = 'true';
EXCEPTION
  WHEN others THEN
    RETURN false;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_maintenance_mode() TO anon, authenticated;
