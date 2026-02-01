-- Fix ambiguous user_id reference in get_admin_users_password_status
CREATE OR REPLACE FUNCTION public.get_admin_users_password_status()
 RETURNS TABLE(user_id uuid, email text, display_name text, role text, has_admin_password boolean, password_expired boolean, days_until_expiry integer)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_actor_id UUID := auth.uid();
  v_is_owner BOOLEAN;
BEGIN
  -- Security: Verify actor is owner
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles ur_check
    WHERE ur_check.user_id = v_actor_id AND ur_check.role = 'owner'
  ) INTO v_is_owner;

  IF NOT v_is_owner THEN
    RAISE EXCEPTION 'Unauthorized: Only owners can view admin password status';
  END IF;

  RETURN QUERY
  SELECT 
    ur.user_id,
    u.email::text,
    COALESCE(p.display_name, split_part(u.email, '@', 1))::text as display_name,
    ur.role::text,
    ap.id IS NOT NULL as has_admin_password,
    COALESCE(ap.expires_at < now(), false) as password_expired,
    COALESCE(GREATEST(0, EXTRACT(DAY FROM (ap.expires_at - now()))::INTEGER), 0) as days_until_expiry
  FROM public.user_roles ur
  JOIN auth.users u ON u.id = ur.user_id
  LEFT JOIN public.profiles p ON p.user_id = ur.user_id
  LEFT JOIN public.admin_passwords ap ON ap.user_id = ur.user_id
  WHERE ur.role IN ('admin', 'owner')
  ORDER BY 
    CASE ur.role WHEN 'owner' THEN 1 WHEN 'admin' THEN 2 END,
    u.email;
END;
$function$;