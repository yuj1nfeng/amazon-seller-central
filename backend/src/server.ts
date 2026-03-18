import express from 'express';
import cors from 'cors';
import path from 'path';

// Import port configuration
const { PORTS, CORS_ORIGINS } = require('../../config/ports');

// Import routes
import storeRoutes from './routes/store';
import productRoutes from './routes/product';
import salesRoutes from './routes/sales';
import dashboardRoutes from './routes/dashboard';
import userRoutes from './routes/users';
import vocRoutes from './routes/voc';
import authRoutes from './routes/auth';
import communicationsRoutes from './routes/communications';
import accountHealthRoutes from './routes/accountHealth';

// Import middleware
import { errorHandler } from './middleware/errorHandler';
import { requestLogger } from './middleware/requestLogger';
import { hostname } from 'os';

const app = express();
const PORT = process.env.PORT || PORTS.BACKEND;

// Middleware
app.use(cors({
  origin: CORS_ORIGINS,
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(requestLogger);

// Static file serving for uploaded images
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/store', storeRoutes);  // Legacy route for backward compatibility
app.use('/api/stores', storeRoutes); // New plural route for enhanced API
app.use('/api/products', productRoutes);
app.use('/api/sales', salesRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/users', userRoutes);
app.use('/api/voc', vocRoutes);
app.use('/api/communications', communicationsRoutes);
app.use('/api/account-health', accountHealthRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Error handling middleware (must be last)
app.use(errorHandler);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.originalUrl} not found`
  });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Backend server running on http://localhost:${PORT}`);
  console.log(`📁 Uploads directory: ${path.join(__dirname, '../uploads')}`);
  console.log(`📊 API endpoints available at http://localhost:${PORT}/api`);
});

export = app;