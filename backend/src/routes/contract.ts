/**
 * Contract Read Route
 *
 * On-chain read-only endpoints for contract and arbitrator state.
 * These are convenience wrappers for the frontend dashboard.
 *
 * Routes:
 *   GET /api/contract/:client/:index   — Fetch a FreelanceContract PDA account
 *   GET /api/contract/config           — Fetch MasterConfig
 *   GET /api/contract/arbitrator/:idx  — Fetch ArbitratorRegistry at index
 */
import { Router, Request, Response } from 'express';
import { PublicKey, AccountInfo } from '@solana/web3.js';
import { connection, deriveContractPda, deriveMasterConfigPda, deriveArbitratorPda } from '../solana';

export const contractRouter = Router();

/**
 * GET /api/contract/config
 * Returns the on-chain MasterConfig account raw data.
 */
contractRouter.get('/config', async (_req, res) => {
  try {
    const [configPda] = deriveMasterConfigPda();
    const info = await connection.getAccountInfo(configPda);
    if (!info) return res.status(404).json({ error: 'MasterConfig not found. Program may not be initialized.' });

    res.json({
      address: configPda.toBase58(),
      lamports: info.lamports,
      owner: info.owner.toBase58(),
      // Raw data — frontend/SDK parses with Anchor IDL
      dataBase64: info.data.toString('base64'),
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/contract/:client/:index
 * Returns on-chain FreelanceContract data for a given client address + index.
 */
contractRouter.get('/:client/:index', async (req: Request, res: Response) => {
  try {
    const { client, index } = req.params;
    const clientKey = new PublicKey(client);
    const contractIndex = BigInt(index);

    const [contractPda] = await deriveContractPda(clientKey, contractIndex);
    const info = await connection.getAccountInfo(contractPda);

    if (!info) {
      return res.status(404).json({ error: `Contract #${index} for client ${client} not found on-chain.` });
    }

    return res.json({
      address: contractPda.toBase58(),
      client,
      contractIndex: index,
      lamports: info.lamports,
      dataBase64: info.data.toString('base64'),
    });
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
});

/**
 * GET /api/contract/arbitrator/:idx
 * Returns on-chain ArbitratorRegistry data at a given pool index.
 */
contractRouter.get('/arbitrator/:idx', async (req: Request, res: Response) => {
  try {
    const idx = BigInt(req.params.idx);
    const [pda] = deriveArbitratorPda(idx);
    const info = await connection.getAccountInfo(pda);

    if (!info) return res.status(404).json({ error: `Arbitrator at index ${idx} not found.` });

    return res.json({
      address: pda.toBase58(),
      index: req.params.idx,
      lamports: info.lamports,
      dataBase64: info.data.toString('base64'),
    });
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
});
