import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

console.log('--- Supabase Init Debug ---');
console.log('URL found:', supabaseUrl ? `${supabaseUrl.substring(0, 10)}... (length: ${supabaseUrl.length})` : 'MISSING ❌');
console.log('Key found:', supabaseAnonKey ? `${supabaseAnonKey.substring(0, 10)}... (length: ${supabaseAnonKey.length})` : 'MISSING ❌');
console.log('---------------------------');

if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('Supabase credentials missing in environment variables. Check your .env.local file in the web folder.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
