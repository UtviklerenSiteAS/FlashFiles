import fs from 'fs';
import path from 'path';
import { supabase } from '../config/supabase';

class CleanupService {
    private interval: NodeJS.Timeout | null = null;
    private readonly CLEANUP_INTERVAL = 10 * 60 * 1000; // 10 minutter

    start() {
        console.log('[Cleanup] Starter automatisk oppryddingstjeneste...');

        // Kjør umiddelbart ved oppstart
        this.runCleanup();

        // Sett opp fast intervall
        this.interval = setInterval(() => {
            this.runCleanup();
        }, this.CLEANUP_INTERVAL);
    }

    stop() {
        if (this.interval) {
            clearInterval(this.interval);
            this.interval = null;
        }
    }

    private async runCleanup() {
        console.log(`[Cleanup] Kjører opprydding: ${new Date().toISOString()}`);

        try {
            const now = new Date().toISOString();

            // 1. Finn alle filer som har utløpt
            const { data: expiredFiles, error } = await supabase
                .from('files')
                .select('*')
                .lt('expires_at', now);

            if (error) {
                console.error('[Cleanup] Feil ved henting av utløpte filer fra DB:', error);
                return;
            }

            if (!expiredFiles || expiredFiles.length === 0) {
                console.log('[Cleanup] Ingen utløpte filer funnet.');
                return;
            }

            console.log(`[Cleanup] Fant ${expiredFiles.length} utløpte filer.`);

            for (const file of expiredFiles) {
                try {
                    // 2. Slett filen fra disk
                    const filePath = path.resolve(file.path);
                    if (fs.existsSync(filePath)) {
                        fs.unlinkSync(filePath);
                        console.log(`[Cleanup] Slettet fil fra disk: ${file.filename} (${file.id})`);
                    } else {
                        console.warn(`[Cleanup] Fil fantes ikke på disk, hopper over unlink: ${file.path}`);
                    }

                    // 3. Slett raden fra databasen
                    const { error: deleteError } = await supabase
                        .from('files')
                        .delete()
                        .eq('id', file.id);

                    if (deleteError) {
                        console.error(`[Cleanup] Kunne ikke slette database-rad for fil ${file.id}:`, deleteError);
                    } else {
                        console.log(`[Cleanup] Slettet metadata for fil ${file.id} fra database.`);
                    }

                } catch (fileError) {
                    console.error(`[Cleanup] Feil under sletting av spesifikk fil ${file.id}:`, fileError);
                }
            }

        } catch (error) {
            console.error('[Cleanup] Uventet feil i oppryddingsprosessen:', error);
        }
    }
}

export const cleanupService = new CleanupService();
