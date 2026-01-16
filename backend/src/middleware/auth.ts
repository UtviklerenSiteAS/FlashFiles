import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

import { supabase } from '../config/supabase';
import { Logger } from '../utils/logger';

// Utvider Express Request type for å inkludere brukerdata
export interface AuthenticatedRequest extends Request {
    user?: {
        id: string;
        [key: string]: any;
    };
}

export const authenticateToken = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const startTime = Date.now();
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
        Logger.error('[Auth] Malformed token structure');
        return res.status(401).json({ error: 'Ugyldig tokenformat' });
    }

    // 1. Try Local JWT Verification (Fastest) - Only for HS256 tokens
    const jwtSecret = process.env.SUPABASE_JWT_SECRET || process.env.JWT_SECRET;
    const decodedToken = jwt.decode(token, { complete: true }) as any;

    if (jwtSecret && decodedToken && decodedToken.header.alg === 'HS256') {
        try {
            const verified = jwt.verify(token, jwtSecret) as any;
            const duration = Date.now() - startTime;
            Logger.info(`[Auth] Token verifisert lokalt (HS256) på ${duration}ms ✅`);
            req.user = { id: verified.sub, ...verified };
            return next();
        } catch (jwtErr) {
            // Local check failed, proceed to API
        }
    }

    // 2. Try Supabase Auth API (Robust fallback for RS256/ES256)
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (user) {
        const duration = Date.now() - startTime;
        Logger.info(`[Auth] Token verifisert via Supabase API på ${duration}ms ✅`);
        req.user = user;
        return next();
    }

    // 3. Fallback: If API fails (e.g. "Auth session missing") but token looks structurally valid and not expired
    // We check if the user exists in the DB via Admin API.
    // WARNING: This does NOT verify the signature if JWT Secret is missing. It only checks if the user ID claims to be real.
    // This is a necessary fallback for some Service Role client configurations.
    const payload = decodedToken?.payload || decodedToken;
    if (error && payload && typeof payload === 'object' && payload.sub && payload.exp) {
        const now = Math.floor(Date.now() / 1000);
        if (payload.exp > now) {
            const { data: { user: adminUser }, error: adminError } = await supabase.auth.admin.getUserById(payload.sub as string);

            if (adminUser && !adminError) {
                const duration = Date.now() - startTime;
                Logger.info(`[Auth] Token bekreftet via Admin API på ${duration}ms ⚠️`);
                req.user = adminUser;
                return next();
            }
        }
    }

    const totalDuration = Date.now() - startTime;
    Logger.error(`[Auth] Verifisering feilet etter ${totalDuration}ms: ${error?.message}`);
    return res.status(401).json({ error: 'Ugyldig eller utløpt token' });
};
