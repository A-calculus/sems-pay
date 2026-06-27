import * as anchor from '@coral-xyz/anchor';
import { Program, BN } from '@coral-xyz/anchor';
import { PublicKey, SystemProgram, Keypair, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { assert } from 'chai';

// NOTE: This type will be auto-generated after `anchor build`
// For now we use `any` until the IDL is produced.
type SemsPay = any;

const FIVE_HOURS = 5 * 60 * 60;
const INCO_LIGHTNING_ID = new PublicKey('5s4BYUXLZAMRCLPNtBBgJwFhMXPjhcKNBZFaHBMZaejk');

describe('sems-pay', () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.SemsPay as Program<SemsPay>;
  const admin = provider.wallet as anchor.Wallet;

  // ─── PDAs ─────────────────────────────────────────────────
  const [masterConfigPda, masterConfigBump] = PublicKey.findProgramAddressSync(
    [Buffer.from('master_config')],
    program.programId
  );

  const client = Keypair.generate();
  const contractor = Keypair.generate();
  const arbitratorWallet = Keypair.generate();

  const CONTRACT_INDEX = new BN(0);
  const contractIndexBuffer = Buffer.alloc(8);
  contractIndexBuffer.writeBigUInt64LE(BigInt(CONTRACT_INDEX.toString()));

  const [contractPda] = PublicKey.findProgramAddressSync(
    [Buffer.from('contract'), client.publicKey.toBuffer(), contractIndexBuffer],
    program.programId
  );

  const arbitratorIndexBuffer = Buffer.alloc(8);
  arbitratorIndexBuffer.writeBigUInt64LE(0n);
  const [arbitratorPda] = PublicKey.findProgramAddressSync(
    [Buffer.from('arbitrator'), arbitratorIndexBuffer],
    program.programId
  );

  // ─── Setup ────────────────────────────────────────────────
  before(async () => {
    // Airdrop SOL to all actors
    await Promise.all([
      provider.connection.confirmTransaction(
        await provider.connection.requestAirdrop(client.publicKey, 2 * LAMPORTS_PER_SOL)
      ),
      provider.connection.confirmTransaction(
        await provider.connection.requestAirdrop(contractor.publicKey, LAMPORTS_PER_SOL)
      ),
      provider.connection.confirmTransaction(
        await provider.connection.requestAirdrop(arbitratorWallet.publicKey, LAMPORTS_PER_SOL)
      ),
    ]);
  });

  // ─── Test: Initialize Master Config ─────────────────────
  it('initializes the master config', async () => {
    await program.methods
      .initializeMaster(
        new BN(5000), // resolution fee = 5000 lamports
        admin.publicKey // support address
      )
      .accounts({
        admin: admin.publicKey,
        masterConfig: masterConfigPda,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    const config = await program.account.masterConfig.fetch(masterConfigPda);
    assert.ok(config.admin.equals(admin.publicKey), 'Admin set correctly');
    assert.equal(config.resolutionFee.toNumber(), 5000, 'Resolution fee set');
    assert.equal(config.arbitratorCount.toNumber(), 0, 'Arbitrator count starts at 0');
    console.log('  ✓ MasterConfig initialized at', masterConfigPda.toBase58());
  });

  // ─── Test: Register Arbitrator ───────────────────────────
  it('registers an arbitrator', async () => {
    await program.methods
      .registerArbitrator()
      .accounts({
        arbitrator: arbitratorWallet.publicKey,
        masterConfig: masterConfigPda,
        arbitratorRegistry: arbitratorPda,
        systemProgram: SystemProgram.programId,
      })
      .signers([arbitratorWallet])
      .rpc();

    const registry = await program.account.arbitratorRegistry.fetch(arbitratorPda);
    assert.ok(registry.arbitrator.equals(arbitratorWallet.publicKey), 'Arbitrator key stored');
    assert.isTrue(registry.isActive, 'Arbitrator is active');

    const config = await program.account.masterConfig.fetch(masterConfigPda);
    assert.equal(config.arbitratorCount.toNumber(), 1, 'Arbitrator count incremented');
    console.log('  ✓ Arbitrator registered:', arbitratorWallet.publicKey.toBase58());
  });

  // ─── Test: Create Contract ───────────────────────────────
  it('creates a freelance contract', async () => {
    const now = Math.floor(Date.now() / 1000);
    const periodEnd = now + 30 * 24 * 3600; // 30 days

    // Mock FHE-encrypted payloads (in production these come from Inco SDK)
    const mockEncryptedRate = new Uint8Array(32).fill(1);
    const mockEncryptedMilestone = new Uint8Array(32).fill(2);
    const mockEncryptedBudget = new Uint8Array(32).fill(3);

    await program.methods
      .createContract(
        CONTRACT_INDEX,
        3, // 3 milestones
        new BN(now),
        new BN(periodEnd),
        Buffer.from(mockEncryptedRate),
        Buffer.from(mockEncryptedMilestone),
        Buffer.from(mockEncryptedBudget),
        new BN(0.5 * LAMPORTS_PER_SOL) // 0.5 SOL initial funding
      )
      .accounts({
        client: client.publicKey,
        contractor: contractor.publicKey,
        masterConfig: masterConfigPda,
        contract: contractPda,
        incoLightningProgram: INCO_LIGHTNING_ID,
        systemProgram: SystemProgram.programId,
      })
      .signers([client])
      .rpc();

    const contract = await program.account.freelanceContract.fetch(contractPda);
    assert.ok(contract.client.equals(client.publicKey), 'Client key stored');
    assert.ok(contract.contractor.equals(contractor.publicKey), 'Contractor key stored');
    assert.equal(contract.totalMilestones, 3, '3 milestones');
    assert.equal(contract.currentMilestone, 0, 'Starts at milestone 0');
    // Status should be Active (0)
    assert.deepEqual(contract.status, { active: {} }, 'Status is Active');
    console.log('  ✓ Contract created at', contractPda.toBase58());
  });

  // ─── Test: Pause & Resume ─────────────────────────────────
  it('can pause and resume the contract', async () => {
    await program.methods
      .pauseContract()
      .accounts({ caller: client.publicKey, contract: contractPda })
      .signers([client])
      .rpc();

    let contract = await program.account.freelanceContract.fetch(contractPda);
    assert.deepEqual(contract.status, { paused: {} }, 'Status is Paused');

    await program.methods
      .resumeContract()
      .accounts({ caller: client.publicKey, contract: contractPda })
      .signers([client])
      .rpc();

    contract = await program.account.freelanceContract.fetch(contractPda);
    assert.deepEqual(contract.status, { active: {} }, 'Status is Active again');
    console.log('  ✓ Pause/Resume works');
  });

  // ─── Test: Approve Milestone ──────────────────────────────
  it('approves a milestone and advances the counter', async () => {
    const contractorBalanceBefore = await provider.connection.getBalance(contractor.publicKey);

    await program.methods
      .approveMilestone(new BN(0.1 * LAMPORTS_PER_SOL))
      .accounts({
        client: client.publicKey,
        contractor: contractor.publicKey,
        contract: contractPda,
        incoLightningProgram: INCO_LIGHTNING_ID,
      })
      .signers([client])
      .rpc();

    const contract = await program.account.freelanceContract.fetch(contractPda);
    assert.equal(contract.currentMilestone, 1, 'Milestone advanced to 1');

    const contractorBalanceAfter = await provider.connection.getBalance(contractor.publicKey);
    assert.isAbove(contractorBalanceAfter, contractorBalanceBefore, 'Contractor received payment');
    console.log('  ✓ Milestone 0 approved, contractor paid');
  });

  // ─── Test: Dispute Flow ───────────────────────────────────
  it('raises a dispute and resolves it', async () => {
    // First pause the contract
    await program.methods
      .pauseContract()
      .accounts({ caller: client.publicKey, contract: contractPda })
      .signers([client])
      .rpc();

    // Raise dispute
    await program.methods
      .disputeContract()
      .accounts({
        caller: client.publicKey,
        masterConfig: masterConfigPda,
        contract: contractPda,
        arbitratorRegistry: arbitratorPda,
      })
      .signers([client])
      .rpc();

    let contract = await program.account.freelanceContract.fetch(contractPda);
    assert.deepEqual(contract.status, { disputed: {} }, 'Status is Disputed');
    assert.ok(
      contract.disputeArbitrator.equals(arbitratorWallet.publicKey),
      'Arbitrator assigned correctly'
    );
    console.log('  ✓ Dispute raised, arbitrator:', contract.disputeArbitrator.toBase58());

    // Arbitrator resolves: 60/40 split
    const contractBalance = await provider.connection.getBalance(contractPda);
    const contractorShare = Math.floor(contractBalance * 0.4);
    const clientShare = Math.floor(contractBalance * 0.6);

    await program.methods
      .resolveDispute(new BN(clientShare), new BN(contractorShare))
      .accounts({
        caller: arbitratorWallet.publicKey,
        masterConfig: masterConfigPda,
        contract: contractPda,
        client: client.publicKey,
        contractor: contractor.publicKey,
      })
      .signers([arbitratorWallet])
      .rpc();

    contract = await program.account.freelanceContract.fetch(contractPda);
    assert.deepEqual(contract.status, { resolved: {} }, 'Status is Resolved');
    console.log('  ✓ Dispute resolved by arbitrator');
  });
});
