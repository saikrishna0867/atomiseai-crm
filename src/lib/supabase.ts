import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://otjruslxfermmcnrnvbn.supabase.co';
const supabaseAnonKey = 'sb_secret_34l7pFBiPP5AljTIOT5bow_LU8jz6go';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
