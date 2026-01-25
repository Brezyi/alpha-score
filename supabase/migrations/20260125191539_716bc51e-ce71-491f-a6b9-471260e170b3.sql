-- Temporarily disable the settings changelog trigger to allow system updates
ALTER TABLE public.system_settings DISABLE TRIGGER ALL;

-- Update the app name
UPDATE public.system_settings SET value = '"GLOWMAXXED AI"' WHERE key = 'app_name';

-- Re-enable triggers
ALTER TABLE public.system_settings ENABLE TRIGGER ALL;