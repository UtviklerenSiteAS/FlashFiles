import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

// Hjelpefunksjon for å vaske miljøvariabler (fjerne whitespace og anførselstegn)
const cleanEnvVar = (val: string | undefined) => (val || '').trim().replace(/^["']|["']$/g, '');

const supabaseUrl = cleanEnvVar(process.env.EXPO_PUBLIC_SUPABASE_URL).replace(/\/+$/, '');
const supabaseAnonKey = cleanEnvVar(process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY);

console.log('--- Supabase Mobile Init Debug ---');
console.log('URL: [' + supabaseUrl + '] (len: ' + supabaseUrl.length + ')');
if (supabaseUrl.length > 0) {
    const lastChars = supabaseUrl.slice(-5).split('').map(c => c + ':' + c.charCodeAt(0)).join(', ');
    console.log('URL suffix codes: ' + lastChars);
}
console.log('Key: [' + supabaseAnonKey.substring(0, 10) + '...] (len: ' + supabaseAnonKey.length + ')');
console.log('---------------------------');

// Håndter SSR (Server Side Rendering) ved å sjekke om window eksisterer
const isServer = typeof window === 'undefined';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
        storage: isServer ? {
            getItem: () => Promise.resolve(null),
            setItem: () => Promise.resolve(),
            removeItem: () => Promise.resolve(),
        } : AsyncStorage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
    },
});
