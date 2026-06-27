/**
 * Jupiter Ultra Swap Route
 *
 * POST /api/swap/quote   — Get a Jupiter Ultra swap quote (token → USDC or USDC → token)
 * POST /api/swap/execute — Fetch the serialized swap transaction from Jupiter
 *
 * Jupiter Ultra API: https://ultra-api.jup.ag
 * Docs: https://station.jup.ag/docs/ultra-api
 */
import { Router, Request, Response } from 'express';
import axios from 'axios';
import { z } from 'zod';

export const swapRouter = Router();

const JUPITER_API = process.env.JUPITER_API_URL || 'https://ultra-api.jup.ag';

// USDC mint on Devnet (official Jupiter devnet USDC)
const USDC_MINT = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v';

// ─── Schemas ──────────────────────────────────────────────────
const QuoteSchema = z.object({
  inputMint: z.string(),        // Token mint to swap FROM
  outputMint: z.string(),       // Token mint to swap TO (use USDC_MINT for deposit)
  amount: z.string(),           // Amount in smallest units (lamports/tokens)
  slippageBps: z.number().optional().default(50),
});

const ExecuteSchema = z.object({
  userPublicKey: z.string(),
  inputMint: z.string(),
  outputMint: z.string(),
  amount: z.string(),
  slippageBps: z.number().optional().default(50),
});

// ─── Routes ───────────────────────────────────────────────────

/**
 * GET /api/swap/usdc-mint
 * Returns the USDC mint address being used as the USD anchor.
 */
swapRouter.get('/usdc-mint', (_req, res) => {
  res.json({ usdcMint: USDC_MINT });
});

/**
 * POST /api/swap/quote
 * Returns a Jupiter Ultra quote for a token swap.
 * Clients use this to see rates before committing.
 */
swapRouter.post('/quote', async (req: Request, res: Response) => {
  try {
    const { inputMint, outputMint, amount, slippageBps } = QuoteSchema.parse(req.body);

    const params = new URLSearchParams({
      inputMint,
      outputMint,
      amount,
      slippageBps: slippageBps.toString(),
    });

    const { data } = await axios.get(`${JUPITER_API}/order?${params.toString()}`);
    res.json(data);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

/**
 * POST /api/swap/deposit-quote
 * Convenience: returns a quote for swapping ANY token → USDC (escrow deposit).
 */
swapRouter.post('/deposit-quote', async (req: Request, res: Response) => {
  try {
    const { inputMint, amount, slippageBps } = QuoteSchema.omit({ outputMint: true }).parse(req.body);

    const params = new URLSearchParams({
      inputMint,
      outputMint: USDC_MINT,
      amount,
      slippageBps: (slippageBps ?? 50).toString(),
    });

    const { data } = await axios.get(`${JUPITER_API}/order?${params.toString()}`);
    res.json(data);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

/**
 * POST /api/swap/withdraw-quote
 * Convenience: returns a quote for USDC → ANY payout token (contractor withdrawal).
 */
swapRouter.post('/withdraw-quote', async (req: Request, res: Response) => {
  try {
    const { outputMint, amount, slippageBps } = QuoteSchema.omit({ inputMint: true }).parse(req.body);

    const params = new URLSearchParams({
      inputMint: USDC_MINT,
      outputMint,
      amount,
      slippageBps: (slippageBps ?? 50).toString(),
    });

    const { data } = await axios.get(`${JUPITER_API}/order?${params.toString()}`);
    res.json(data);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

/**
 * POST /api/swap/execute
 * Fetches a serialized swap transaction from Jupiter Ultra.
 * The client receives the base64 tx, signs it, and submits to Solana RPC.
 *
 * NOTE: Jupiter Ultra /execute actually requires a signed order.
 * Here we return the swap tx bytes for client-side signing.
 */
swapRouter.post('/execute', async (req: Request, res: Response) => {
  try {
    const body = ExecuteSchema.parse(req.body);

    const { data: order } = await axios.get(
      `${JUPITER_API}/order?inputMint=${body.inputMint}&outputMint=${body.outputMint}&amount=${body.amount}&slippageBps=${body.slippageBps}`
    );

    // Return the swap transaction for client to sign
    const { data: swapTx } = await axios.post(`${JUPITER_API}/execute`, {
      ...order,
      userPublicKey: body.userPublicKey,
    });

    res.json(swapTx);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});
