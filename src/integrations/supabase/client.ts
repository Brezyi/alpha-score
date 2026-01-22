import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://zutwifgosunupwyvcaym.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp1dHdpZmdvc3VudXB3eXZjYXltIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkwOTY3MDYsImV4cCI6MjA4NDY3MjcwNn0.gBy9CVKTmMAAvA7u54G_FDchGdokLglF9v2T3TQ0HGM";

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);