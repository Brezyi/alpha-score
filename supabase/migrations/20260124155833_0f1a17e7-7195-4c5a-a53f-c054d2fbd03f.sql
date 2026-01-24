-- Add forbidden display name validation function
CREATE OR REPLACE FUNCTION public.validate_display_name(p_name text)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  lower_name text;
  decoded_name text;
BEGIN
  IF p_name IS NULL OR trim(p_name) = '' THEN
    RETURN FALSE;
  END IF;
  
  lower_name := lower(trim(p_name));
  
  -- Decode basic leetspeak
  decoded_name := lower_name;
  decoded_name := replace(decoded_name, '0', 'o');
  decoded_name := replace(decoded_name, '1', 'i');
  decoded_name := replace(decoded_name, '3', 'e');
  decoded_name := replace(decoded_name, '4', 'a');
  decoded_name := replace(decoded_name, '5', 's');
  decoded_name := replace(decoded_name, '7', 't');
  decoded_name := replace(decoded_name, '8', 'b');
  decoded_name := replace(decoded_name, '@', 'a');
  decoded_name := replace(decoded_name, '$', 's');
  
  -- Check against forbidden patterns (German + English insults, hate speech, etc.)
  IF lower_name ~ 'hurensohn|hure|fotze|wichser|arschloch|schwuchtel|missgeburt|spast|behindert|mongo|kanake|neger|schlampe|nutte|bastard|idiot|vollidiot|depp|drecksau|scheisse|scheiße|kacke|pisser' THEN
    RETURN FALSE;
  END IF;
  
  IF lower_name ~ 'fuck|shit|bitch|asshole|cunt|dick|cock|nigger|nigga|faggot|retard|whore|slut|pussy|piss' THEN
    RETURN FALSE;
  END IF;
  
  IF lower_name ~ 'nazi|hitler|heil|hakenkreuz|swastika|kkk|holocaust|vergasen|auschwitz|jihad|isis|terrorist' THEN
    RETURN FALSE;
  END IF;
  
  IF lower_name ~ 'pedo|pädophil|kinderschänder|kinderporn|loli|shota' THEN
    RETURN FALSE;
  END IF;
  
  IF lower_name ~ 'admin|moderator|support|official|staff|gründer|founder|ceo|owner' THEN
    RETURN FALSE;
  END IF;
  
  IF lower_name ~ 'cocaine|kokain|heroin|meth|dealer' THEN
    RETURN FALSE;
  END IF;
  
  IF lower_name ~ 'killer|mörder|murder|rape|vergewalt|töten' THEN
    RETURN FALSE;
  END IF;
  
  -- Also check decoded leetspeak version
  IF decoded_name != lower_name THEN
    IF decoded_name ~ 'hurensohn|hure|fotze|wichser|arschloch|schwuchtel|missgeburt|spast|behindert|mongo|kanake|neger|schlampe|nutte|bastard|idiot|vollidiot|depp|drecksau|scheisse|scheiße|kacke|pisser' THEN
      RETURN FALSE;
    END IF;
    
    IF decoded_name ~ 'fuck|shit|bitch|asshole|cunt|dick|cock|nigger|nigga|faggot|retard|whore|slut|pussy|piss' THEN
      RETURN FALSE;
    END IF;
    
    IF decoded_name ~ 'nazi|hitler|heil|hakenkreuz|swastika|kkk|holocaust|vergasen|auschwitz|jihad|isis|terrorist' THEN
      RETURN FALSE;
    END IF;
    
    IF decoded_name ~ 'pedo|pädophil|kinderschänder|kinderporn|loli|shota' THEN
      RETURN FALSE;
    END IF;
  END IF;
  
  -- Check length
  IF length(trim(p_name)) < 2 OR length(trim(p_name)) > 30 THEN
    RETURN FALSE;
  END IF;
  
  -- Check allowed characters (letters, numbers, spaces, dots, underscores, hyphens)
  IF NOT trim(p_name) ~ '^[a-zA-Z0-9äöüÄÖÜß\s._-]+$' THEN
    RETURN FALSE;
  END IF;
  
  RETURN TRUE;
END;
$$;

-- Create trigger to validate display_name on insert/update
CREATE OR REPLACE FUNCTION public.check_display_name_content()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.display_name IS NOT NULL AND NOT public.validate_display_name(NEW.display_name) THEN
    RAISE EXCEPTION 'Invalid display name: The chosen name is not allowed.';
  END IF;
  RETURN NEW;
END;
$$;

-- Drop existing trigger if exists and create new one
DROP TRIGGER IF EXISTS validate_display_name_trigger ON public.profiles;
CREATE TRIGGER validate_display_name_trigger
  BEFORE INSERT OR UPDATE OF display_name ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.check_display_name_content();