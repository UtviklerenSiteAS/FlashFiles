import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import { downloadFile } from '../controllers/downloadController';

const router = Router();

// GET /download/:fileId
// Beskyttet rute som streamer filen dersom alt er i orden
router.get('/download/:fileId', authenticateToken, downloadFile);

export default router;
