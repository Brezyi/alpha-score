-- Create table for admin password reset requests
CREATE TABLE public.admin_password_reset_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  requested_at timestamp with time zone NOT NULL DEFAULT now(),
  processed_at timestamp with time zone,
  processed_by uuid,
  admin_notes text
);

-- Enable RLS
ALTER TABLE public.admin_password_reset_requests ENABLE ROW LEVEL SECURITY;

-- Admins can request a reset (create their own request)
CREATE POLICY "Admins can create their own reset requests"
ON public.admin_password_reset_requests
FOR INSERT
WITH CHECK (
  auth.uid() = user_id 
  AND has_role(auth.uid(), 'admin'::app_role)
);

-- Admins can view their own requests
CREATE POLICY "Admins can view their own reset requests"
ON public.admin_password_reset_requests
FOR SELECT
USING (auth.uid() = user_id);

-- Owners can view all requests
CREATE POLICY "Owners can view all reset requests"
ON public.admin_password_reset_requests
FOR SELECT
USING (has_role(auth.uid(), 'owner'::app_role));

-- Owners can update requests (approve/reject)
CREATE POLICY "Owners can update reset requests"
ON public.admin_password_reset_requests
FOR UPDATE
USING (has_role(auth.uid(), 'owner'::app_role));

-- Owners can delete old requests
CREATE POLICY "Owners can delete reset requests"
ON public.admin_password_reset_requests
FOR DELETE
USING (has_role(auth.uid(), 'owner'::app_role));

-- Function to get pending reset requests with user info (for owners)
CREATE OR REPLACE FUNCTION public.get_pending_password_reset_requests()
RETURNS TABLE(
  id uuid,
  user_id uuid,
  display_name text,
  email text,
  role text,
  requested_at timestamp with time zone,
  status text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only owners can call this
  IF NOT has_role(auth.uid(), 'owner'::app_role) THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;
  
  RETURN QUERY
  SELECT 
    r.id,
    r.user_id,
    COALESCE(p.display_name, 'Unknown') as display_name,
    u.email::text,
    ur.role::text,
    r.requested_at,
    r.status
  FROM admin_password_reset_requests r
  JOIN auth.users u ON u.id = r.user_id
  LEFT JOIN profiles p ON p.user_id = r.user_id
  LEFT JOIN user_roles ur ON ur.user_id = r.user_id
  WHERE r.status = 'pending'
  ORDER BY r.requested_at DESC;
END;
$$;

-- Function for admins to check if they have a pending request
CREATE OR REPLACE FUNCTION public.has_pending_password_reset_request()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM admin_password_reset_requests 
    WHERE user_id = auth.uid() 
    AND status = 'pending'
  );
END;
$$;