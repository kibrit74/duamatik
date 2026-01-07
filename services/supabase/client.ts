import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { logger } from '../../utils/logger';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    logger.warn('Supabase credentials missing. Check .env.local');
}

export const supabase: SupabaseClient = createClient(supabaseUrl!, supabaseAnonKey!);
