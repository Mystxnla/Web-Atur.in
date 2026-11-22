import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';

import { latency } from './middleware/latency.js';
import { errorHandler } from './middleware/errorHandler.js';
import { initDatabase } from './store/database.js';

// Routes
import authRouter     from './routes/auth.js';
import ordersRouter   from './routes/orders.js';
import paymentsRouter from './routes/payments.js';
import lookupRouter   from './routes/lookup.js';
import leadsRouter    from './routes/leads.js';
import demoRouter     from './routes/demo.js';
import uploadRouter   from './routes/upload.js';
import packagesRouter from './routes/packages.js';
import adminRouter    from './routes/admin.js';

const app  = express();
const PORT = parseInt(process.env.PORT ?? '4000', 10);
const IS_PROD = process.env.NODE_ENV === 'production';

// Trust proxy on Vercel / reverse proxies for rate-limit & secure cookies
app.set('trust proxy', 1);

// ─── Security headers ─────────────────────────────────────────────────────────
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));

// ─── CORS ─────────────────────────────────────────────────────────────────────
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS ?? 'http://localhost:5173,http://localhost:5174')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

app.use(cors({
  origin: (origin, cb) => {
    if (
      !origin ||
      ALLOWED_ORIGINS.includes(origin) ||
      origin.endsWith('.vercel.app')
    ) {
      return cb(null, true);
    }
    cb(new Error(`CORS: origin ${origin} tidak diizinkan.`));
  },
  credentials: true,
}));

// ─── Rate limiting ────────────────────────────────────────────────────────────
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Terlalu banyak request. Coba lagi dalam 15 menit.' },
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { error: 'Terlalu banyak percobaan login. Coba lagi dalam 15 menit.' },
});

app.use(globalLimiter);
app.use(express.json({ limit: '2mb' }));
app.use(cookieParser());

if (!IS_PROD) app.use(latency);

// Lazy one-time DB schema initialization (safe for both local server & Vercel serverless cold start)
let dbInitPromise = null;
export function ensureDbInitialized() {
  if (!dbInitPromise) {
    dbInitPromise = initDatabase().catch((err) => {
      dbInitPromise = null;
      throw err;
    });
  }
  return dbInitPromise;
}

app.use(async (req, res, next) => {
  try {
    await ensureDbInitialized();
    next();
  } catch (err) {
    next(err);
  }
});

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use('/api/auth',     authLimiter, authRouter);
app.use('/api/packages', packagesRouter);
app.use('/api/orders',   ordersRouter);
app.use('/api/orders',   paymentsRouter); // handles POST /api/orders/:id/payments
app.use('/api/payments', paymentsRouter); // handles GET/POST /api/payments/:id/*
app.use('/api/lookup',   lookupRouter);
app.use('/api/leads',    leadsRouter);
app.use('/api/upload',   uploadRouter);
app.use('/api/demo',     demoRouter);
app.use('/api/admin',    adminRouter);

app.get('/api/health', (req, res) => res.json({
  status: 'ok',
  db: 'supabase-postgres',
  ts: new Date().toISOString(),
  env: process.env.NODE_ENV ?? 'development',
}));

// ─── Error handler ────────────────────────────────────────────────────────────
app.use(errorHandler);

export { app };
export default app;

// Only start standalone HTTP listener when not running inside Vercel serverless runtime
if (!process.env.VERCEL) {
  ensureDbInitialized()
    .then(() => {
      app.listen(PORT, () => {
        console.log(`[api] Atur.in API (Supabase PostgreSQL) running at http://localhost:${PORT}`);
        console.log(`[api] Admin: ${process.env.ADMIN_EMAIL ?? 'admin@atur-in.id'}`);
      });
    })
    .catch((err) => {
      console.error('[api] Failed to initialize database:', err);
      process.exit(1);
    });
}
