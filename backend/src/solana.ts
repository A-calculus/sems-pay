/**
 * Solana / Anchor connection singleton.
 * All backend services use this shared client.
 */
import { Connection, PublicKey } from '@solana/web3.js';
import { AnchorProvider, Program, Idl } from '@coral-xyz/anchor';
import dotenv from 'dotenv';

dotenv.config();

export const RPC_URL = process.env.SOLANA_RPC_URL || 'https://api.devnet.solana.com';
export const PROGRAM_ID = new PublicKey(
  process.env.SEMS_PAY_PROGRAM_ID || 'FXgwKkCBThKpEtk4Vs22MJCJbBUEmJvMvKGJaLCuxgED'
);

/** Shared read-only connection (no wallet needed for reads). */
export const connection = new Connection(RPC_URL, 'confirmed');

/**
 * Derive the FreelanceContract PDA for a given client and contract index.
 */
export async function deriveContractPda(
  clientPubkey: PublicKey,
  contractIndex: bigint
): Promise<[PublicKey, number]> {
  const indexBuffer = Buffer.alloc(8);
  indexBuffer.writeBigUInt64LE(contractIndex);
  return PublicKey.findProgramAddressSync(
    [Buffer.from('contract'), clientPubkey.toBuffer(), indexBuffer],
    PROGRAM_ID
  );
}

/**
 * Derive the MasterConfig PDA.
 */
export function deriveMasterConfigPda(): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from('master_config')],
    PROGRAM_ID
  );
}

/**
 * Derive the ArbitratorRegistry PDA for a given index.
 */
export function deriveArbitratorPda(index: bigint): [PublicKey, number] {
  const indexBuffer = Buffer.alloc(8);
  indexBuffer.writeBigUInt64LE(index);
  return PublicKey.findProgramAddressSync(
    [Buffer.from('arbitrator'), indexBuffer],
    PROGRAM_ID
  );
}
