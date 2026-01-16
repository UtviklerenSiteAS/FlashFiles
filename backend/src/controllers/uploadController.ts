import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { supabase } from '../config/supabase';
import { socketService } from '../services/socketService';

export const uploadFile = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const file = req.file;
        const user = req.user;

        if (!file) {
            console.error('❌ Ingen fil funnet i request');
            return res.status(400).json({ error: 'Ingen fil lastet opp' });
        }

        console.log(`📤 Mottar filopplasting: ${file.originalname} (${(file.size / 1024).toFixed(2)} KB)`);
        console.log(`📝 Metadata mottatt: Title="${req.body.title}", Desc="${req.body.description}"`);
        console.log(`📂 Filbane på server: ${file.path}`);

        if (!user) {
            return res.status(401).json({ error: 'Bruker ikke funnet i request' });
        }

        // Check for text overlay data
        const { title, description } = req.body;

        if ((title || description) && file.mimetype.startsWith('image/')) {
            console.log('[Upload] 🎨 Starter bildebehandling med Jimp...');
            let JimpClass;
            let jimpLib: any;
            try {
                // Jimp v1 often exports default or { Jimp }
                jimpLib = require('jimp');
                console.log('[Jimp] Keys:', Object.keys(jimpLib));

                if (jimpLib.Jimp) {
                    JimpClass = jimpLib.Jimp;
                } else if (jimpLib.default) {
                    JimpClass = jimpLib.default;
                } else {
                    JimpClass = jimpLib;
                }

                console.log(`[Jimp] Bibliotek lastet. Read funksjon tilgjengelig: ${typeof JimpClass.read}`);
            } catch (err) {
                console.error('[Jimp] Kunne ikke laste biblioteket:', err);
            }

            try {
                if (!JimpClass || typeof JimpClass.read !== 'function') {
                    throw new Error('Jimp class not found or invalid');
                }

                // Resolve helper functions and constants from either JimpClass or the library root
                const loadFont = JimpClass.loadFont || jimpLib.loadFont;
                const measureTextHeight = JimpClass.measureTextHeight || jimpLib.measureTextHeight;

                // Constants: Font
                // Attempt to find constants for larger fonts, or defualt to undefined to trigger fallback
                let FONT_SANS_128_WHITE = JimpClass.FONT_SANS_128_WHITE || jimpLib.FONT_SANS_128_WHITE;
                let FONT_SANS_64_WHITE = JimpClass.FONT_SANS_64_WHITE || jimpLib.FONT_SANS_64_WHITE;
                let FONT_SANS_32_WHITE = JimpClass.FONT_SANS_32_WHITE || jimpLib.FONT_SANS_32_WHITE;

                // Fallback: Resolve paths manually using absolute path construction
                const path = require('path');

                if (!FONT_SANS_128_WHITE) {
                    try {
                        FONT_SANS_128_WHITE = path.join(process.cwd(), 'node_modules', '@jimp', 'plugin-print', 'fonts', 'open-sans', 'open-sans-128-white', 'open-sans-128-white.fnt');
                    } catch (e) { console.warn('[Jimp] Could not resolve FONT_SANS_128_WHITE manually', e); }
                }

                if (!FONT_SANS_64_WHITE) {
                    try {
                        FONT_SANS_64_WHITE = path.join(process.cwd(), 'node_modules', '@jimp', 'plugin-print', 'fonts', 'open-sans', 'open-sans-64-white', 'open-sans-64-white.fnt');
                    } catch (e) { console.warn('[Jimp] Could not resolve FONT_SANS_64_WHITE manually', e); }
                }

                if (!FONT_SANS_32_WHITE) {
                    try {
                        FONT_SANS_32_WHITE = path.join(process.cwd(), 'node_modules', '@jimp', 'plugin-print', 'fonts', 'open-sans', 'open-sans-32-white', 'open-sans-32-white.fnt');
                    } catch (e) { console.warn('[Jimp] Could not resolve FONT_SANS_32_WHITE manually', e); }
                }

                // Constants: Alignment
                const ALIGN_RIGHT = JimpClass.HORIZONTAL_ALIGN_RIGHT || jimpLib.HORIZONTAL_ALIGN_RIGHT || (jimpLib.HorizontalAlign ? jimpLib.HorizontalAlign.RIGHT : 4);
                const ALIGN_BOTTOM = JimpClass.VERTICAL_ALIGN_BOTTOM || jimpLib.VERTICAL_ALIGN_BOTTOM || (jimpLib.VerticalAlign ? jimpLib.VerticalAlign.BOTTOM : 32);

                console.log(`[Jimp] Funksjoner funnet - loadFont: ${typeof loadFont}, measureTextHeight: ${typeof measureTextHeight}`);
                console.log(`[Jimp] Fonts funnet - 128: ${!!FONT_SANS_128_WHITE}, 64: ${!!FONT_SANS_64_WHITE}, 32: ${!!FONT_SANS_32_WHITE}`);

                if (typeof loadFont !== 'function') {
                    throw new Error('loadFont function not found');
                }

                console.log(`[Jimp] Leser fil fra: ${file.path}`);
                const image = await JimpClass.read(file.path);
                console.log(`[Jimp] Bilde lest. Dimensjoner: ${image.bitmap.width}x${image.bitmap.height}`);

                console.log('[Jimp] Laster store fonts (128, 64, 32)...');
                const fontTitle = await loadFont(FONT_SANS_128_WHITE); // Huge Title
                const fontDesc = await loadFont(FONT_SANS_64_WHITE);   // Large Desc
                const fontDate = await loadFont(FONT_SANS_64_WHITE);   // Medium Date

                const maxWidth = image.bitmap.width * 0.9; // Increased width usage
                const dateStr = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

                // Calculate position (bottom-right with margin)
                const margin = 80; // Increased margin for larger scale
                let currentY = image.bitmap.height - margin;

                // Description (bottom-most)
                if (description) {
                    console.log(`[Jimp] Legger til beskrivelse: "${description}"`);
                    const descHeight = measureTextHeight(fontDesc, description, maxWidth);
                    currentY -= descHeight;

                    image.print({
                        font: fontDesc,
                        x: image.bitmap.width - margin - maxWidth,
                        y: currentY,
                        text: {
                            text: description,
                            alignmentX: ALIGN_RIGHT,
                            alignmentY: ALIGN_BOTTOM
                        },
                        maxWidth: maxWidth,
                        maxHeight: descHeight
                    });
                    currentY -= 20; // increased spacing
                }

                // Title and Date
                if (title) {
                    console.log(`[Jimp] Legger til tittel: "${title}" og dato: "${dateStr}"`);
                    const titleHeight = measureTextHeight(fontTitle, title, maxWidth);
                    currentY -= titleHeight;

                    // Print Title
                    image.print({
                        font: fontTitle,
                        x: image.bitmap.width - margin - maxWidth,
                        y: currentY,
                        text: {
                            text: title,
                            alignmentX: ALIGN_RIGHT,
                            alignmentY: ALIGN_BOTTOM
                        },
                        maxWidth: maxWidth,
                        maxHeight: titleHeight
                    });

                    const dateHeight = measureTextHeight(fontDate, dateStr, maxWidth);
                    currentY -= (dateHeight + 10);
                    image.print({
                        font: fontDate,
                        x: image.bitmap.width - margin - maxWidth,
                        y: currentY,
                        text: {
                            text: dateStr,
                            alignmentX: ALIGN_RIGHT,
                            alignmentY: ALIGN_BOTTOM
                        },
                        maxWidth: maxWidth,
                        maxHeight: dateHeight
                    });
                }

                // Write back to file path
                console.log('[Jimp] Lagrer endret bilde...');
                await image.write(file.path);
                console.log('✅ [Upload] Text overlay lagret suksessfullt.');

            } catch (jimpError) {
                console.error('❌ Jimp processing failed:', jimpError);
            }
        } else {
            console.log('[Upload] Ingen tekst eller ikke bilde, skipper Jimp.');
        }

        // Beregn utløpstidspunkt (nå + 1 time)
        const expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + 1);

        // Lagre metadata i Supabase 'files' tabellen
        console.log('[Upload] Lagrer metadata i Supabase...');
        const { data, error } = await supabase
            .from('files')
            .insert({
                user_id: user.id,
                filename: file.originalname,
                size: file.size,
                path: file.path,
                expires_at: expiresAt.toISOString(),
                title: title || null,
                description: description || null
            })
            .select('id, title, description')
            .single();

        if (error) {
            console.error('❌ Databasefeil ved lagring av fil-metadata:', error);
            return res.status(500).json({ error: 'Kunne ikke lagre fil-metadata', details: error.message });
        }

        console.log(`✅ Metadata lagret i DB, ID: ${data.id}`);

        // Send WebSocket-varsel dersom brukeren er tilkoblet (f.eks. på PC)
        console.log(`[Upload] Varsler bruker via WebSocket: ${user.id}`);
        const sent = socketService.sendToUser(user.id, 'file_received', {
            fileId: data.id,
            filename: file.originalname,
            size: file.size,
            title: data.title,
            description: data.description
        });
        console.log(`[Upload] WebSocket varsel sendt: ${sent ? 'Suksess' : 'Bruker ikke online'}`);

        // Returner suksess med fileId
        console.log('[Upload] Sender suksess-respons til mobil app');
        return res.status(201).json({
            message: 'Fil lastet opp og metadata lagret',
            fileId: data.id,
            expiresAt: expiresAt.toISOString(),
        });

    } catch (error: any) {
        console.error('❌ Uventet feil ved opplasting:', error);
        return res.status(500).json({
            error: 'En uventet feil oppstod under opplasting',
            details: error?.message || 'Ukjent feil'
        });
    }
};
