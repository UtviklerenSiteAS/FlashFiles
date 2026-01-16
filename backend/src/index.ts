import express from 'express';
import cors from 'cors';
import uploadRoutes from './routes/uploadRoutes';
import downloadRoutes from './routes/downloadRoutes';

const app = express();

// CORS is enabled for all origins
app.use(cors());

// Enable JSON body parsing
app.use(express.json());

// API Routes
app.use('/api', uploadRoutes);
app.use('/api', downloadRoutes);

// Basic health check route
app.get('/', (req, res) => {
    res.send('FlashFiles Backend Running 🚀');
});

export default app;
