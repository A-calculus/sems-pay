/**
 * @sems-pay/sdk — PDA Utilities
 * Derives all program PDAs consistently on the client side.
 */
import { PublicKey } from '@solana/web3.js';
import { SEMS_PAY_PROGRAM_ID, MASTER_CONFIG_SEED, CONTRACT_SEED, ARBITRATOR_SEED } from './constants';

function u64ToLE(n: bigint): Buffer {
  const buf = Buffer.alloc(8);
  buf.writeBigUInt64LE(n);
  return buf;
}

/** Derive the MasterConfig PDA. */
export function getMasterConfigPda(): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from(MASTER_CONFIG_SEED)],
    SEMS_PAY_PROGRAM_ID
  );
}

/** Derive the FreelanceContract PDA for a client + index pair. */
export function getContractPda(client: PublicKey, contractIndex: bigint): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from(CONTRACT_SEED), client.toBuffer(), u64ToLE(contractIndex)],
    SEMS_PAY_PROGRAM_ID
  );
}

/** Derive the ArbitratorRegistry PDA for a given pool index. */
export function getArbitratorPda(index: bigint): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from(ARBITRATOR_SEED), u64ToLE(index)],
    SEMS_PAY_PROGRAM_ID
  );
}
