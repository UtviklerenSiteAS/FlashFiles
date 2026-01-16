import express from 'express';
import cors from 'cors';
import uploadRoutes from './routes/uploadRoutes';
import downloadRoutes from './routes/downloadRoutes';

const app = express();

// CORS is enabled for all origins
app.use(cors());

// Enable JSON body parsing
app.use(express.json());

// Request logging middleware
app.use((req, res, next) => {
    const start = Date.now();
    const timestamp = new Date().toLocaleTimeString('nb-NO', { hour12: false }) + '.' + new Date().getMilliseconds().toString().padStart(3, '0');

    // Log target method and path
    console.log(`[${timestamp}] [REQ] ${req.method} ${req.path} - Started`);

    res.on('finish', () => {
        const duration = Date.now() - start;
        const endTimestamp = new Date().toLocaleTimeString('nb-NO', { hour12: false }) + '.' + new Date().getMilliseconds().toString().padStart(3, '0');
        console.log(`[${endTimestamp}] [RES] ${req.method} ${req.path} - ${res.statusCode} (${duration}ms)`);
    });

    next();
});

// API Routes
app.use('/api', uploadRoutes);
app.use('/api', downloadRoutes);

// Basic health check route
app.get('/', (req, res) => {
    res.send('FlashFiles Backend Running 🚀');
});

export default app;
