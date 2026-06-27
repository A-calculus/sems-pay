/**
 * @sems-pay/sdk — Constants
 * Shared program IDs, PDA seeds, and network config.
 */
import { PublicKey } from '@solana/web3.js';

export const SEMS_PAY_PROGRAM_ID = new PublicKey(
  'FXgwKkCBThKpEtk4Vs22MJCJbBUEmJvMvKGJaLCuxgED'
);

export const DEVNET_RPC = 'https://api.devnet.solana.com';

// PDA seed constants (must match programs/sems-pay/src/constants.rs)
export const MASTER_CONFIG_SEED = 'master_config';
export const CONTRACT_SEED = 'contract';
export const ARBITRATOR_SEED = 'arbitrator';

// Timeouts
export const FIVE_HOURS_SECONDS = 5 * 60 * 60;

// USDC mint (devnet)
export const USDC_MINT = new PublicKey('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v');
