-- Add favicon_url system setting
INSERT INTO public.system_settings (key, value, category, description)
VALUES ('favicon_url', '""', 'branding', 'URL des Favicons')
ON CONFLICT (key) DO NOTHING;