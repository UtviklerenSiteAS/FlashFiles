import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

const envLocalPath = path.join(process.cwd(), '.env.local');
if (fs.existsSync(envLocalPath)) {
    dotenv.config({ path: envLocalPath });
} else {
    dotenv.config();
}

import http from 'http';
import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import app from './index';
import { socketService } from './services/socketService';
import { cleanupService } from './services/cleanupService';
import { supabase } from './config/supabase';
import { Logger } from './utils/logger';

// Les PORT fra .env eller bruk 3000
const PORT = process.env.PORT || 3000;

const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

// Middleware for å verifisere JWT ved tilkobling
io.use(async (socket, next) => {
    // Forventer token i socket.handshake.auth.token eller som en header
    const token = socket.handshake.auth.token;

    if (!token) {
        return next(new Error('Mangler autentiseringstoken'));
    }

    // 1. Try Local JWT Verification (Fast & Reliable)
    // Only attempt if we have a secret AND the token algorithm matches our secret type (HS256)
    const jwtSecret = process.env.SUPABASE_JWT_SECRET || process.env.JWT_SECRET;
    const decoded = jwt.decode(token, { complete: true });

    if (jwtSecret && decoded && decoded.header.alg === 'HS256') {
        try {
            const verified = jwt.verify(token, jwtSecret) as any;
            (socket as any).userId = verified.sub;
            return next();
        } catch (err) {
            // If local fails (e.g. expired), we still try the API below just in case
        }
    }

    // 2. Verify using Supabase Auth API (Robust fallback for RS256/ES256 or explicit checks)
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
        // Only log actual auth failures
        Logger.error('[Socket] Auth Failed:', error?.message);
        return next(new Error('Ugyldig eller utløpt token'));
    }

    // Legger til user_id på socket-objektet
    (socket as any).userId = user.id;
    next();
});

// Initialiser socketService
socketService.init(io);

io.on('connection', (socket) => {
    const userId = (socket as any).userId;

    // Brukeren blir med i et "rom" dedikert til sin bruker-id
    socket.join(`user:${userId}`);
    Logger.info(`[Socket] Bruker ${userId} koblet til og ble med i rom user:${userId} ✅`);

    socket.on('disconnect', (reason) => {
        Logger.info(`[Socket] Bruker ${userId} koblet fra. Årsak: ${reason}`);
    });
});

server.listen(PORT, () => {
    Logger.info(`Server running on port ${PORT} with WebSocket enabled 🚀`);
    cleanupService.start();
});
