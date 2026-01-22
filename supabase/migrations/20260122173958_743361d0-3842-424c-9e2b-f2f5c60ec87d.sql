-- Create audit_logs table
CREATE TABLE public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action_type TEXT NOT NULL, -- 'INSERT', 'UPDATE', 'DELETE'
  table_name TEXT NOT NULL,
  record_id UUID,
  actor_id UUID, -- The user who performed the action
  target_user_id UUID, -- For role changes: the affected user
  old_values JSONB,
  new_values JSONB,
  metadata JSONB DEFAULT '{}',
  ip_address TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for faster queries
CREATE INDEX idx_audit_logs_created_at ON public.audit_logs(created_at DESC);
CREATE INDEX idx_audit_logs_actor_id ON public.audit_logs(actor_id);
CREATE INDEX idx_audit_logs_table_name ON public.audit_logs(table_name);

-- Enable RLS
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Only owners and admins can view audit logs
CREATE POLICY "Owners can view all audit logs"
ON public.audit_logs
FOR SELECT
USING (has_role(auth.uid(), 'owner'));

CREATE POLICY "Admins can view audit logs"
ON public.audit_logs
FOR SELECT
USING (has_role(auth.uid(), 'admin'));

-- Only system (via triggers) can insert - no direct user inserts
-- We'll use SECURITY DEFINER functions for this

-- Create function to log audit entries (security definer to bypass RLS)
CREATE OR REPLACE FUNCTION public.create_audit_log(
  _action_type TEXT,
  _table_name TEXT,
  _record_id UUID,
  _actor_id UUID,
  _target_user_id UUID,
  _old_values JSONB,
  _new_values JSONB,
  _metadata JSONB DEFAULT '{}'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _log_id UUID;
BEGIN
  INSERT INTO public.audit_logs (
    action_type,
    table_name,
    record_id,
    actor_id,
    target_user_id,
    old_values,
    new_values,
    metadata
  ) VALUES (
    _action_type,
    _table_name,
    _record_id,
    _actor_id,
    _target_user_id,
    _old_values,
    _new_values,
    _metadata
  )
  RETURNING id INTO _log_id;
  
  RETURN _log_id;
END;
$$;

-- Trigger function to automatically log user_roles changes
CREATE OR REPLACE FUNCTION public.audit_user_roles_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM public.create_audit_log(
      'INSERT',
      'user_roles',
      NEW.id,
      auth.uid(),
      NEW.user_id,
      NULL,
      jsonb_build_object('role', NEW.role),
      jsonb_build_object('event', 'Role assigned')
    );
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    PERFORM public.create_audit_log(
      'UPDATE',
      'user_roles',
      NEW.id,
      auth.uid(),
      NEW.user_id,
      jsonb_build_object('role', OLD.role),
      jsonb_build_object('role', NEW.role),
      jsonb_build_object('event', 'Role changed')
    );
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    PERFORM public.create_audit_log(
      'DELETE',
      'user_roles',
      OLD.id,
      auth.uid(),
      OLD.user_id,
      jsonb_build_object('role', OLD.role),
      NULL,
      jsonb_build_object('event', 'Role removed')
    );
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

-- Create trigger on user_roles table
CREATE TRIGGER audit_user_roles_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.user_roles
FOR EACH ROW
EXECUTE FUNCTION public.audit_user_roles_changes();