import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import { authenticateToken } from '../middleware/auth';
import { uploadFile } from '../controllers/uploadController';

const router = Router();

// Konfigurer Multer lagring
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        // Lagrer filer i /uploads mappen
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        // Genererer et unikt filnavn for å unngå kollisjoner
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 1024 * 1024 * 1024 // 1 GB grense
    }
});

// POST /upload
// Bruker authenticateToken for sikkerhet, og upload.single('file') for å håndtere selve filen
router.post('/upload', authenticateToken, upload.single('file'), uploadFile);

export default router;
