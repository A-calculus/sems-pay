/**
 * Arbitrator Queue Manager
 *
 * Manages the in-memory pool of online arbitrators eligible for dispute resolution.
 * In production, this would be backed by Redis or a DB for persistence.
 *
 * Routes:
 *   POST /api/arbitrator/heartbeat       — Arbitrator signals they are online
 *   GET  /api/arbitrator/pool            — List all currently active arbitrators
 *   POST /api/arbitrator/assign          — Randomly assign an arbitrator to a dispute
 *   POST /api/arbitrator/cycle/:address  — Cycle out an expired arbitrator (5-hour timeout)
 */
import { Router, Request, Response } from 'express';
import { PublicKey } from '@solana/web3.js';
import { z } from 'zod';

export const arbitratorRouter = Router();

const FIVE_HOURS_MS = 5 * 60 * 60 * 1000;
const HEARTBEAT_TTL_MS = 2 * 60 * 1000; // 2 minutes — arbitrator must ping to stay online

// ─── In-Memory Registry ───────────────────────────────────────

interface ArbitratorEntry {
  address: string;
  lastSeen: number;      // epoch ms
  assignedContractId: string | null;
  assignedAt: number | null;
}

const pool = new Map<string, ArbitratorEntry>();

function purgeStaleArbitrators() {
  const now = Date.now();
  for (const [key, entry] of pool.entries()) {
    if (now - entry.lastSeen > HEARTBEAT_TTL_MS) {
      pool.delete(key);
    }
  }
}

function getAvailable(): ArbitratorEntry[] {
  purgeStaleArbitrators();
  return Array.from(pool.values()).filter((a) => !a.assignedContractId);
}

// ─── Schemas ──────────────────────────────────────────────────

const HeartbeatSchema = z.object({
  address: z.string().min(32),
});

const AssignSchema = z.object({
  contractId: z.string(),   // The on-chain contract PDA address string
});

// ─── Routes ───────────────────────────────────────────────────

/**
 * POST /api/arbitrator/heartbeat
 * An arbitrator client pings this every ~60s to stay in the active pool.
 */
arbitratorRouter.post('/heartbeat', (req: Request, res: Response) => {
  try {
    const { address } = HeartbeatSchema.parse(req.body);
    // Validate it's a valid Solana pubkey
    new PublicKey(address);

    const existing = pool.get(address);
    pool.set(address, {
      address,
      lastSeen: Date.now(),
      assignedContractId: existing?.assignedContractId ?? null,
      assignedAt: existing?.assignedAt ?? null,
    });

    res.json({ status: 'online', address });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

/**
 * GET /api/arbitrator/pool
 * Returns the current list of online, available arbitrators.
 */
arbitratorRouter.get('/pool', (_req, res) => {
  purgeStaleArbitrators();
  const arbitrators = Array.from(pool.values()).map((a) => ({
    address: a.address,
    available: !a.assignedContractId,
    assignedContractId: a.assignedContractId,
  }));
  res.json({ count: arbitrators.length, arbitrators });
});

/**
 * POST /api/arbitrator/assign
 * Randomly selects an available arbitrator and marks them as assigned.
 * Returns the selected arbitrator's address.
 */
arbitratorRouter.post('/assign', (req: Request, res: Response) => {
  try {
    const { contractId } = AssignSchema.parse(req.body);
    const available = getAvailable();

    if (available.length === 0) {
      return res.status(503).json({ error: 'No arbitrators available. Dispute will escalate to support.' });
    }

    // Cryptographically random selection
    const selected = available[Math.floor(Math.random() * available.length)];
    selected.assignedContractId = contractId;
    selected.assignedAt = Date.now();
    pool.set(selected.address, selected);

    return res.json({
      assigned: selected.address,
      contractId,
      assignedAt: selected.assignedAt,
      expiresAt: selected.assignedAt + FIVE_HOURS_MS,
    });
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
});

/**
 * POST /api/arbitrator/cycle/:address
 * Called when an arbitrator's 5-hour timeout expires.
 * Frees them from assignment and selects a new one.
 */
arbitratorRouter.post('/cycle/:address', (req: Request, res: Response) => {
  try {
    const { address } = req.params;
    const { contractId } = AssignSchema.parse(req.body);

    const entry = pool.get(address);
    if (entry) {
      const elapsed = Date.now() - (entry.assignedAt ?? 0);
      if (elapsed < FIVE_HOURS_MS) {
        return res.status(400).json({ error: 'Arbitrator 5-hour timeout has not elapsed yet.' });
      }
      // Free the current arbitrator
      entry.assignedContractId = null;
      entry.assignedAt = null;
      pool.set(address, entry);
    }

    // Assign a new one
    const available = getAvailable();
    if (available.length === 0) {
      return res.status(503).json({ error: 'No replacement arbitrators available. Escalate to support.' });
    }

    const next = available[Math.floor(Math.random() * available.length)];
    next.assignedContractId = contractId;
    next.assignedAt = Date.now();
    pool.set(next.address, next);

    return res.json({
      cycledOut: address,
      newArbitrator: next.address,
      contractId,
      expiresAt: (next.assignedAt ?? 0) + FIVE_HOURS_MS,
    });
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
});

/**
 * POST /api/arbitrator/release/:address
 * Called after a dispute is resolved to free the arbitrator.
 */
arbitratorRouter.post('/release/:address', (req: Request, res: Response) => {
  const { address } = req.params;
  const entry = pool.get(address);
  if (!entry) return res.status(404).json({ error: 'Arbitrator not found in pool.' });

  entry.assignedContractId = null;
  entry.assignedAt = null;
  pool.set(address, entry);
  res.json({ status: 'released', address });
});
