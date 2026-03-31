import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
  || 'https://otjruslxfermmcnrnvbn.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY
  || 'PASTE-NEW-KEY-HERE';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
