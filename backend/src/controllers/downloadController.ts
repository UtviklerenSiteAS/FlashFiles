import { Response } from 'express';
import path from 'path';
import fs from 'fs';
import { AuthenticatedRequest } from '../middleware/auth';
import { supabase } from '../config/supabase';

export const downloadFile = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const { fileId } = req.params;
        const user = req.user;

        if (!user) {
            return res.status(401).json({ error: 'Bruker ikke funnet i request' });
        }

        // 1. Hent fil-metadata fra databasen
        const { data: fileData, error } = await supabase
            .from('files')
            .select('*')
            .eq('id', fileId)
            .single();

        if (error || !fileData) {
            return res.status(404).json({ error: 'Filen ble ikke funnet' });
        }

        // 2. Sjekk at filen tilhører brukeren
        if (fileData.user_id !== user.id) {
            return res.status(403).json({ error: 'Du har ikke tilgang til denne filen' });
        }

        // 3. Sjekk om filen har utløpt
        const now = new Date();
        const expiresAt = new Date(fileData.expires_at);

        if (now > expiresAt) {
            return res.status(410).json({ error: 'Filen har utløpt og er ikke lenger tilgjengelig' });
        }

        // 4. Sjekk at filen faktisk eksisterer på disk
        const filePath = path.resolve(fileData.path);
        if (!fs.existsSync(filePath)) {
            console.error(`Filmangel: ${filePath} finnes i DB, men ikke på disk.`);
            return res.status(404).json({ error: 'Filen mangler på serveren' });
        }

        // 5. Stream filen til klienten
        // res.download setter automatisk Content-Disposition headeren med det originale filnavnet
        res.download(filePath, fileData.filename, (err) => {
            if (err) {
                console.error('Feil under streaming av fil:', err);
                if (!res.headersSent) {
                    res.status(500).json({ error: 'Kunne ikke laste ned filen' });
                }
            }
        });

    } catch (error) {
        console.error('Uventet feil ved nedlasting:', error);
        return res.status(500).json({ error: 'En uventet feil oppstod under nedlasting' });
    }
};
