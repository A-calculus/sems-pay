/**
 * @sems-pay/sdk — SemsPayClient
 *
 * The primary SDK class. B2B integrators instantiate this with an Anchor Program
 * and call the helper methods to build, send, and resolve contracts.
 *
 * Usage:
 *   const client = new SemsPayClient(program, connection);
 *   const tx = await client.createContract({...});
 *   const resolution = await client.getPayoutResolution(contractAddress);
 */
import { PublicKey, Connection, Transaction, SystemProgram } from '@solana/web3.js';
import { Program, BN, AnchorProvider } from '@coral-xyz/anchor';
import { getMasterConfigPda, getContractPda, getArbitratorPda } from './pda';
import {
  CreateContractParams,
  ApproveMilestoneParams,
  DisputeContractParams,
  ResolveDisputeParams,
  PayoutResolution,
  FreelanceContractAccount,
  ContractStatus,
} from './types';
import { SEMS_PAY_PROGRAM_ID } from './constants';

// Inco Lightning Program ID (Devnet)
const INCO_LIGHTNING_ID = new PublicKey('5s4BYUXLZAMRCLPNtBBgJwFhMXPjhcKNBZFaHBMZaejk');

export class SemsPayClient {
  constructor(
    public readonly program: Program<any>,
    public readonly connection: Connection
  ) {}

  // ─── Contract Lifecycle ───────────────────────────────────

  /**
   * Build and return the instruction to create a new FreelanceContract.
   * The caller signs and sends the transaction.
   */
  async createContractIx(params: CreateContractParams) {
    const [masterConfigPda] = getMasterConfigPda();
    const [contractPda] = getContractPda(params.client, params.contractIndex);

    return this.program.methods
      .createContract(
        new BN(params.contractIndex.toString()),
        params.totalMilestones,
        new BN(params.periodStart.toString()),
        new BN(params.periodEnd.toString()),
        Buffer.from(params.encryptedRate),
        Buffer.from(params.encryptedTotalMilestoneAmount),
        Buffer.from(params.encryptedRemainingBudget),
        new BN(params.fundingAmountLamports.toString())
      )
      .accounts({
        client: params.client,
        contractor: params.contractor,
        masterConfig: masterConfigPda,
        contract: contractPda,
        incoLightningProgram: INCO_LIGHTNING_ID,
        systemProgram: SystemProgram.programId,
      })
      .instruction();
  }

  /**
   * Build the ApproveMilestone instruction.
   */
  async approveMilestoneIx(params: ApproveMilestoneParams) {
    const [contractPda] = getContractPda(params.client, params.contractIndex);

    return this.program.methods
      .approveMilestone(new BN(params.payoutAmountLamports.toString()))
      .accounts({
        client: params.client,
        contractor: params.contractor,
        contract: contractPda,
        incoLightningProgram: INCO_LIGHTNING_ID,
      })
      .instruction();
  }

  /**
   * Build the PauseContract instruction.
   */
  async pauseContractIx(caller: PublicKey, client: PublicKey, contractIndex: bigint) {
    const [contractPda] = getContractPda(client, contractIndex);
    return this.program.methods
      .pauseContract()
      .accounts({ caller, contract: contractPda })
      .instruction();
  }

  /**
   * Build the ResumeContract instruction.
   */
  async resumeContractIx(caller: PublicKey, client: PublicKey, contractIndex: bigint) {
    const [contractPda] = getContractPda(client, contractIndex);
    return this.program.methods
      .resumeContract()
      .accounts({ caller, contract: contractPda })
      .instruction();
  }

  /**
   * Build the DisputeContract instruction.
   * The B2B integrator should call their backend first to get a randomly
   * selected arbitratorRegistryAddress.
   */
  async disputeContractIx(params: DisputeContractParams) {
    const [masterConfigPda] = getMasterConfigPda();
    const [contractPda] = getContractPda(params.caller, params.contractIndex);

    return this.program.methods
      .disputeContract()
      .accounts({
        caller: params.caller,
        masterConfig: masterConfigPda,
        contract: contractPda,
        arbitratorRegistry: params.arbitratorRegistryAddress,
      })
      .instruction();
  }

  /**
   * Build the ResolveDispute instruction.
   * The arbitrator calls this with their split decision.
   */
  async resolveDisputeIx(params: ResolveDisputeParams) {
    const [masterConfigPda] = getMasterConfigPda();
    const contractInfo = await this.fetchContract(params.contractAddress);

    return this.program.methods
      .resolveDispute(
        new BN(params.clientPayoutLamports.toString()),
        new BN(params.contractorPayoutLamports.toString())
      )
      .accounts({
        caller: params.caller,
        masterConfig: masterConfigPda,
        contract: params.contractAddress,
        client: contractInfo.client,
        contractor: contractInfo.contractor,
      })
      .instruction();
  }

  /**
   * Build the EscalateDispute instruction.
   * Can be called by anyone after the 5-hour timeout.
   */
  async escalateDisputeIx(caller: PublicKey, contractAddress: PublicKey) {
    const [masterConfigPda] = getMasterConfigPda();
    return this.program.methods
      .escalateDispute()
      .accounts({
        caller,
        masterConfig: masterConfigPda,
        contract: contractAddress,
      })
      .instruction();
  }

  // ─── On-Chain Reads ───────────────────────────────────────

  /**
   * Fetch and decode a FreelanceContract account.
   */
  async fetchContract(address: PublicKey): Promise<FreelanceContractAccount> {
    const raw = await this.program.account.freelanceContract.fetch(address);
    return raw as unknown as FreelanceContractAccount;
  }

  /**
   * Fetch a contract by client + index.
   */
  async fetchContractByIndex(client: PublicKey, contractIndex: bigint): Promise<FreelanceContractAccount> {
    const [pda] = getContractPda(client, contractIndex);
    return this.fetchContract(pda);
  }

  // ─── B2B Payout Resolution ────────────────────────────────

  /**
   * For B2B integrators: returns who should be paid and how much,
   * based on the current state of a resolved or disputed contract.
   *
   * Integrators call this to get payout directions and handle
   * the actual transfer themselves within their own platform.
   */
  async getPayoutResolution(
    contractAddress: PublicKey,
    clientPayoutLamports: bigint,
    contractorPayoutLamports: bigint,
    payoutMint?: PublicKey
  ): Promise<PayoutResolution> {
    const contract = await this.fetchContract(contractAddress);

    return {
      payee: contract.contractor,
      refundRecipient: contract.client,
      contractorAmountLamports: contractorPayoutLamports,
      clientRefundLamports: clientPayoutLamports,
      payoutMint,
    };
  }

  /**
   * Register an arbitrator on-chain.
   */
  async registerArbitratorIx(arbitrator: PublicKey) {
    const [masterConfigPda] = getMasterConfigPda();
    const config = await this.program.account.masterConfig.fetch(masterConfigPda);
    const [arbitratorPda] = getArbitratorPda(BigInt(config.arbitratorCount.toString()));

    return this.program.methods
      .registerArbitrator()
      .accounts({
        arbitrator,
        masterConfig: masterConfigPda,
        arbitratorRegistry: arbitratorPda,
        systemProgram: SystemProgram.programId,
      })
      .instruction();
  }
}
