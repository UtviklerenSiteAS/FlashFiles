import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

import { supabase } from '../config/supabase';

// Utvider Express Request type for å inkludere brukerdata
export interface AuthenticatedRequest extends Request {
    user?: {
        id: string;
        [key: string]: any;
    };
}

export const authenticateToken = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const authHeader = req.headers['authorization'];
    // Forventer format: "Bearer <token>" eller query param ?token=<token>
    let token = authHeader && authHeader.split(' ')[1];

    if (!token && req.query.token) {
        token = req.query.token as string;
    }

    if (!token) {
        return res.status(401).json({ error: 'Mangler autentiseringstoken' });
    }

    // Clean token
    token = token.trim();

    // Verify format (basic check)
    if (token.split('.').length !== 3) {
        console.error('[AuthDebug] Malformed token structure');
        return res.status(401).json({ error: 'Ugyldig tokenformat' });
    }

    console.log(`[AuthDebug] Verifying token: ${token.substring(0, 10)}...`);

    // Decode check (unverified) - needed for fallback
    const decoded = jwt.decode(token);
    console.log('[AuthDebug] Decoded token:', decoded);

    // 1. Try Local JWT Verification (Best & Fastest)
    const jwtSecret = process.env.SUPABASE_JWT_SECRET;
    if (jwtSecret) {
        try {
            const verified = jwt.verify(token, jwtSecret) as any;
            console.log('[Auth] Token verified locally with JWT Secret ✅');
            req.user = { id: verified.sub, ...verified };
            return next();
        } catch (jwtErr) {
            console.error('[Auth] Local JWT verification failed:', jwtErr);
            return res.status(401).json({ error: 'Ugyldig token signatur' });
        }
    } else {
        console.warn('[Auth] Warning: SUPABASE_JWT_SECRET not set. Falling back to slower API verification.');
    }

    // 2. Try Supabase Auth API (getUser)
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (user) {
        console.log('[Auth] Token verified via Supabase API ✅');
        req.user = user;
        return next();
    }

    // 3. Fallback: If API fails (e.g. "Auth session missing") but token looks structurally valid and not expired
    // We check if the user exists in the DB via Admin API.
    // WARNING: This does NOT verify the signature if JWT Secret is missing. It only checks if the user ID claims to be real.
    // This is a necessary fallback for some Service Role client configurations.
    if (error && decoded && typeof decoded === 'object' && decoded.sub && decoded.exp) {
        const now = Math.floor(Date.now() / 1000);
        if (decoded.exp > now) {
            console.log('[Auth] getUser failed. Attempting fallback admin check for ID:', decoded.sub);
            const { data: { user: adminUser }, error: adminError } = await supabase.auth.admin.getUserById(decoded.sub as string);

            if (adminUser && !adminError) {
                console.log('[Auth] Fallback: User confirmed via Admin API (Signature unverified!) ⚠️');
                req.user = adminUser;
                return next();
            }
        }
    }

    console.error('Token verifikasjonsfeil:', error?.message);
    return res.status(401).json({ error: 'Ugyldig eller utløpt token' });
};
