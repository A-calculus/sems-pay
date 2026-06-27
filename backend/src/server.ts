import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';

import { swapRouter } from './routes/swap';
import { arbitratorRouter } from './routes/arbitrator';
import { contractRouter } from './routes/contract';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// ─── Middleware ───────────────────────────────────────────────
app.use(helmet());
app.use(cors({ origin: process.env.CORS_ORIGIN || '*' }));
app.use(express.json());

// ─── Health ───────────────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'sems-pay-api', ts: Date.now() });
});

// ─── Routes ───────────────────────────────────────────────────
app.use('/api/swap', swapRouter);
app.use('/api/arbitrator', arbitratorRouter);
app.use('/api/contract', contractRouter);

// ─── Global Error Handler ─────────────────────────────────────
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('[ERROR]', err.message);
  res.status(500).json({ error: err.message });
});

app.listen(PORT, () => {
  console.log(`🚀 Sems-Pay API running on http://localhost:${PORT}`);
  console.log(`   RPC: ${process.env.SOLANA_RPC_URL || 'devnet'}`);
});

export default app;
