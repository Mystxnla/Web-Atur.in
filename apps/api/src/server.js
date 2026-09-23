import express from 'express';
import cors from 'cors';
import { latency } from './middleware/latency.js';
import { errorHandler } from './middleware/errorHandler.js';
import packagesRouter from './routes/packages.js';
import ordersRouter from './routes/orders.js';
import paymentsRouter from './routes/payments.js';
import lookupRouter from './routes/lookup.js';
import leadsRouter from './routes/leads.js';
import demoRouter from './routes/demo.js';
import uploadRouter from './routes/upload.js';

const app = express();
const PORT = parseInt(process.env.PORT ?? '4000', 10);

app.use(cors({ origin: ['http://localhost:5173', 'http://127.0.0.1:5173'] }));
app.use(express.json());
app.use(latency);

app.use('/api/packages', packagesRouter);
app.use('/api/orders', ordersRouter);
app.use('/api/payments', paymentsRouter);
app.use('/api/lookup', lookupRouter);
app.use('/api/leads', leadsRouter);
app.use('/api/demo', demoRouter);
app.use('/api/upload', uploadRouter);

app.get('/api/health', (req, res) => res.json({ status: 'ok', ts: new Date().toISOString() }));

app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`[api] Mock API running at http://localhost:${PORT}`);
});
