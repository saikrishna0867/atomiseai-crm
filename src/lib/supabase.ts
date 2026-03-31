import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
  || 'https://otjruslxfermmcnrnvbn.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY
  || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im90anJ1c2x4ZmVybW1jbnJudmJuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM2NzY5MDcsImV4cCI6MjA4OTI1MjkwN30.rY4p-XtQk4eVi745o4o2F9XZq-l8xGbUbIoxlgTgR6k';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
