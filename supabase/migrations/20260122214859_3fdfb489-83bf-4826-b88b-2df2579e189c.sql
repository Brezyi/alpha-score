-- Create system_settings table (owner-only configuration)
CREATE TABLE public.system_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL UNIQUE,
  value JSONB NOT NULL DEFAULT '{}',
  description TEXT,
  category TEXT NOT NULL DEFAULT 'general',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for faster queries
CREATE INDEX idx_system_settings_key ON public.system_settings(key);
CREATE INDEX idx_system_settings_category ON public.system_settings(category);

-- Enable RLS
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

-- Only owners can view settings
CREATE POLICY "Owners can view all settings"
ON public.system_settings
FOR SELECT
USING (has_role(auth.uid(), 'owner'));

-- Only owners can update settings
CREATE POLICY "Owners can update settings"
ON public.system_settings
FOR UPDATE
USING (has_role(auth.uid(), 'owner'));

-- Only owners can insert settings
CREATE POLICY "Owners can insert settings"
ON public.system_settings
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'owner'));

-- Create trigger for updated_at
CREATE TRIGGER update_system_settings_updated_at
BEFORE UPDATE ON public.system_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default settings
INSERT INTO public.system_settings (key, value, description, category) VALUES
  ('app_name', '"FaceRank"', 'Name der Anwendung', 'branding'),
  ('maintenance_mode', 'false', 'Wartungsmodus aktivieren', 'general'),
  ('auto_confirm_email', 'true', 'E-Mail-Bestätigung automatisch', 'auth'),
  ('max_upload_size_mb', '10', 'Maximale Upload-Größe in MB', 'general'),
  ('streak_reminder_enabled', 'true', 'Streak-Erinnerungen aktivieren', 'notifications'),
  ('analytics_enabled', 'true', 'Analytics aktivieren', 'general'),
  ('ai_analysis_intensity', '"standard"', 'KI-Analyse-Intensität (light/standard/deep)', 'ai'),
  ('default_theme', '"dark"', 'Standard-Theme (dark/light)', 'branding'),
  ('accent_color', '"#00FF88"', 'Standard-Akzentfarbe', 'branding');

-- Create settings_changelog table for versioning
CREATE TABLE public.settings_changelog (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key TEXT NOT NULL,
  old_value JSONB,
  new_value JSONB NOT NULL,
  changed_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS for changelog
ALTER TABLE public.settings_changelog ENABLE ROW LEVEL SECURITY;

-- Only owners can view changelog
CREATE POLICY "Owners can view settings changelog"
ON public.settings_changelog
FOR SELECT
USING (has_role(auth.uid(), 'owner'));

-- Create function to log setting changes (triggered automatically)
CREATE OR REPLACE FUNCTION public.log_settings_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.settings_changelog (setting_key, old_value, new_value, changed_by)
  VALUES (NEW.key, OLD.value, NEW.value, auth.uid());
  
  -- Also create an audit log entry
  PERFORM public.create_audit_log(
    'UPDATE',
    'system_settings',
    NEW.id,
    auth.uid(),
    NULL,
    jsonb_build_object('key', OLD.key, 'value', OLD.value),
    jsonb_build_object('key', NEW.key, 'value', NEW.value),
    jsonb_build_object('event', 'Setting changed')
  );
  
  RETURN NEW;
END;
$$;

-- Create trigger for settings changes
CREATE TRIGGER log_system_settings_changes
AFTER UPDATE ON public.system_settings
FOR EACH ROW
WHEN (OLD.value IS DISTINCT FROM NEW.value)
EXECUTE FUNCTION public.log_settings_change();