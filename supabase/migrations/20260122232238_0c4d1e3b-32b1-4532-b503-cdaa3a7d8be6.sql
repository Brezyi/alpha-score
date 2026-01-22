-- Create storage bucket for app branding assets
INSERT INTO storage.buckets (id, name, public)
VALUES ('branding', 'branding', true)
ON CONFLICT (id) DO NOTHING;

-- Allow anyone to view branding assets (public bucket)
CREATE POLICY "Branding assets are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'branding');

-- Only authenticated admins/owners can upload branding assets
CREATE POLICY "Only admins can upload branding assets"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'branding' 
  AND auth.role() = 'authenticated'
  AND EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'owner')
  )
);

-- Only admins/owners can update branding assets
CREATE POLICY "Only admins can update branding assets"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'branding' 
  AND auth.role() = 'authenticated'
  AND EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'owner')
  )
);

-- Only admins/owners can delete branding assets
CREATE POLICY "Only admins can delete branding assets"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'branding' 
  AND auth.role() = 'authenticated'
  AND EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'owner')
  )
);

-- Add app_logo_url system setting
INSERT INTO public.system_settings (key, value, category, description)
VALUES ('app_logo_url', '""', 'branding', 'URL des App-Logos')
ON CONFLICT (key) DO NOTHING;