-- Fix login 'infinite loading' for non-owners by allowing read access to maintenance_mode
-- Only the maintenance_mode row is readable; all other settings remain owner-only.
DROP POLICY IF EXISTS "Anyone can view maintenance mode" ON public.system_settings;

CREATE POLICY "Anyone can view maintenance mode"
ON public.system_settings
FOR SELECT
USING (key = 'maintenance_mode');