/**
 * @sems-pay/sdk — Type Definitions
 */
import { PublicKey } from '@solana/web3.js';

// ─── Enums ────────────────────────────────────────────────────
export enum ContractStatus {
  Active = 'Active',
  Paused = 'Paused',
  Disputed = 'Disputed',
  Resolved = 'Resolved',
  Cancelled = 'Cancelled',
}

// ─── On-Chain Account Shapes ─────────────────────────────────

export interface MasterConfig {
  admin: PublicKey;
  support: PublicKey;
  resolutionFee: bigint;
  arbitratorCount: bigint;
  bump: number;
}

export interface ArbitratorRegistryAccount {
  arbitrator: PublicKey;
  isActive: boolean;
  index: bigint;
  bump: number;
}

export interface FreelanceContractAccount {
  client: PublicKey;
  contractor: PublicKey;
  contractIndex: bigint;
  status: ContractStatus;
  totalMilestones: number;
  currentMilestone: number;
  lastAccrualTime: bigint;
  periodStart: bigint;
  periodEnd: bigint;
  isDelegated: boolean;
  bump: number;
  // FHE handle fields (32-byte arrays — decrypt client-side)
  encryptedRate: Uint8Array;
  encryptedAccrued: Uint8Array;
  encryptedTotalMilestoneAmount: Uint8Array;
  encryptedRemainingBudget: Uint8Array;
  // Dispute
  disputeArbitrator: PublicKey;
  disputeAssignedTime: bigint;
  disputeEscalated: boolean;
  disputeFeePaid: boolean;
}

// ─── SDK Input Types ─────────────────────────────────────────

export interface CreateContractParams {
  /** Client (employer) wallet */
  client: PublicKey;
  /** Contractor (freelancer) wallet */
  contractor: PublicKey;
  /** Unique sequential index for this client's contracts */
  contractIndex: bigint;
  /** Total number of milestones */
  totalMilestones: number;
  /** Contract start unix timestamp */
  periodStart: bigint;
  /** Contract end unix timestamp (0 = open-ended) */
  periodEnd: bigint;
  /** Encrypted hourly/sec rate bytes (from Inco client encryption) */
  encryptedRate: Uint8Array;
  /** Encrypted total milestone amount bytes */
  encryptedTotalMilestoneAmount: Uint8Array;
  /** Encrypted total budget bytes */
  encryptedRemainingBudget: Uint8Array;
  /** Initial SOL funding amount in lamports to pre-load the escrow */
  fundingAmountLamports: bigint;
}

export interface ApproveMilestoneParams {
  client: PublicKey;
  contractor: PublicKey;
  contractIndex: bigint;
  /** Gross payout in lamports for this milestone */
  payoutAmountLamports: bigint;
}

export interface DisputeContractParams {
  caller: PublicKey;
  contractIndex: bigint;
  /** ArbitratorRegistry account for the randomly selected arbitrator */
  arbitratorRegistryAddress: PublicKey;
}

export interface ResolveDisputeParams {
  caller: PublicKey;
  contractAddress: PublicKey;
  clientPayoutLamports: bigint;
  contractorPayoutLamports: bigint;
}

// ─── B2B SDK Payout Result ────────────────────────────────────

/**
 * B2B SDK resolution result.
 * The integrating platform receives this and handles the on-chain transfer themselves.
 */
export interface PayoutResolution {
  /** Who should be paid (contractor address) */
  payee: PublicKey;
  /** Who gets a refund if applicable (client address) */
  refundRecipient: PublicKey;
  /** Amount to pay the contractor in lamports */
  contractorAmountLamports: bigint;
  /** Amount to refund the client in lamports */
  clientRefundLamports: bigint;
  /** Recommended target token mint for payout (contractor preference) */
  payoutMint?: PublicKey;
}
