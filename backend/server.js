import dotenv from 'dotenv';
import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';

import authRoutes from './routes/auth.js';
import letterRoutes from './routes/letters.js';
import shareRoutes from './routes/share.js';
import uploadRoutes from './routes/upload.js';

// Resolve dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env variables relative to server.js
dotenv.config({ path: path.join(__dirname, '.env') });

// 1. Environment Validation
const requiredEnv = ['JWT_SECRET', 'OWNER_PASSWORD'];
const missingEnv = requiredEnv.filter(key => !process.env[key]);
const dbUri = process.env.MONGODB_URI || process.env.MONGO_URI;

if (missingEnv.length > 0 || !dbUri) {
  const allMissing = [...missingEnv];
  if (!dbUri) allMissing.push('MONGODB_URI');
  console.error(`\n❌ CRITICAL ERROR: Missing required environment variables: ${allMissing.join(', ')}`);
  console.error('Please configure them in your environment settings.\n');
  process.exit(1);
}

const app = express();
const PORT = process.env.PORT || 5000;

// Production Security & Middleware
app.use(helmet({
  crossOriginResourcePolicy: false, // Permits cross-origin audio/image loading from static paths
}));
app.use(compression());

// CORS Whitelisting Setup
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:5174',
  process.env.FRONTEND_URL
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    const cleanOrigin = origin.trim().replace(/\/$/, '');
    const isAllowed = allowedOrigins.some(allowed => allowed.trim().replace(/\/$/, '') === cleanOrigin);
    if (isAllowed) {
      callback(null, true);
    } else {
      callback(new Error(`Not allowed by CORS: ${origin}`));
    }
  },
  credentials: true
}));

// Limit request sizes to 10MB
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Log every failed response (status >= 400)
app.use((req, res, next) => {
  const originalJson = res.json;
  const originalSend = res.send;
  let errorPayload = null;

  res.json = function (body) {
    if (res.statusCode >= 400) {
      errorPayload = body;
    }
    return originalJson.apply(this, arguments);
  };

  res.send = function (body) {
    if (res.statusCode >= 400) {
      errorPayload = body;
    }
    return originalSend.apply(this, arguments);
  };

  res.on('finish', () => {
    if (res.statusCode >= 400) {
      console.warn(`[FAILED REQUEST] Route: ${req.method} ${req.originalUrl} | Status: ${res.statusCode} | Response:`, JSON.stringify(errorPayload));
    }
  });
  next();
});

// Rate limiter on authentication endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many login attempts from this IP, please try again after 15 minutes.'
});
app.use('/api/auth', authLimiter);

// Static file serving for uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Database connection readiness check middleware
const checkDbConnection = (req, res, next) => {
  if (mongoose.connection.readyState !== 1) {
    return res.status(503).json({
      message: 'Database unavailable'
    });
  }
  next();
};

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/letters', checkDbConnection, letterRoutes);
app.use('/api/share', checkDbConnection, shareRoutes);
app.use('/api/upload', checkDbConnection, uploadRoutes);

// Enhanced Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    time: new Date(),
    environment: process.env.NODE_ENV || 'production'
  });
});

// Database connection with retry logic
const connectWithRetry = (retries = 5, delay = 5000) => {
  const dbUri = process.env.MONGODB_URI || process.env.MONGO_URI;
  if (!dbUri) {
    console.error('\n❌ CRITICAL ERROR: MONGODB_URI (or MONGO_URI) is not defined in environment variables.\n');
    process.exit(1);
  }

  const maskedUri = dbUri.replace(/:([^@]+)@/, ':******@');
  console.log(`Connecting to MongoDB at: ${maskedUri}...`);

  mongoose
    .connect(dbUri)
    .then(() => {
      console.log('Successfully connected to MongoDB.');
    })
    .catch((error) => {
      const maskedError = error.message.replace(dbUri, maskedUri);
      console.error(`\n⚠️  WARNING: MongoDB connection failed: ${maskedError}`);
      if (retries > 0) {
        console.log(`Retrying connection in ${delay / 1000} seconds... (${retries} retries left)`);
        setTimeout(() => connectWithRetry(retries - 1, delay), delay);
      } else {
        console.error('❌ Could not connect to MongoDB after multiple retries. Exiting server.\n');
        process.exit(1);
      }
    });
};

connectWithRetry();

// Global unhandled error handling middleware
app.use((err, req, res, next) => {
  const statusCode = err.status || err.statusCode || 500;
  
  // Clear and detailed logging of failed request
  console.error(`\n=== UNHANDLED EXCEPTION ===`);
  console.error(`Route: ${req.method} ${req.originalUrl}`);
  console.error(`Status Code: ${statusCode}`);
  console.error(`Original Error: ${err.message || err}`);
  if (err.stack) {
    console.error(`Stack Trace:\n${err.stack}`);
  }
  console.error(`===========================\n`);

  if (err.message && err.message.startsWith('Not allowed by CORS')) {
    return res.status(403).json({
      message: err.message
    });
  }

  const message = process.env.NODE_ENV === 'production' && statusCode === 500
    ? 'An unexpected error occurred. Please try again later.'
    : err.message;
    
  res.status(statusCode).json({
    message,
    error: process.env.NODE_ENV === 'production' ? {} : {
      message: err.message,
      stack: err.stack
    }
  });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
