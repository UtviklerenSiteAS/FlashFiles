import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Sørger for at environment variables er lastet inn
import path from 'path';
import fs from 'fs';

const envLocalPath = path.join(process.cwd(), '.env.local');
if (fs.existsSync(envLocalPath)) {
    dotenv.config({ path: envLocalPath });
} else {
    dotenv.config();
}

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    throw new Error('Mangler SUPABASE_URL eller SUPABASE_SERVICE_ROLE_KEY i .env');
}

// Oppretter en Supabase-klient med admin-rettigheter (Service Role)
// Vi bruker Service Role-nøkkelen her i backend for å kunne utføre administrative oppgaver
// og omgå RLS når nødvendig (f.eks. lagre metadata for en filopplasting på vegne av bruker).
//
// NB: Denne klienten har fulle rettigheter, så den må IKKE eksponeres til frontend.
export const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false,
    },
});
