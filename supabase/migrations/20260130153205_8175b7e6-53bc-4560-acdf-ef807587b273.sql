-- Enable realtime for friend_connections (if not already)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND tablename = 'friend_connections'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.friend_connections;
  END IF;
END $$;

-- Enable realtime for partner_requests (if not already)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND tablename = 'partner_requests'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.partner_requests;
  END IF;
END $$;