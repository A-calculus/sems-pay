use anchor_lang::prelude::*;

// ============================================================
// Encrypted Value Handle
// ============================================================

/// Handle to an encrypted 128-bit value stored in Inco Lightning.
#[derive(AnchorSerialize, AnchorDeserialize, Clone, Default, Debug)]
pub struct EncryptedHandle {
    pub handle: [u8; 32],
}

// ============================================================
// Contract Status Enum
// ============================================================

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq, Debug)]
pub enum ContractStatus {
    Active,
    Paused,
    Disputed,
    Resolved,
    Cancelled,
}

// ============================================================
// Program Configuration Account
// ============================================================

#[account]
pub struct MasterConfig {
    /// Admin address allowed to configure system parameters and register support.
    pub admin: Pubkey,
    /// Support address allowed to resolve escalated disputes.
    pub support: Pubkey,
    /// Fee (in lamports) required to resolve a dispute.
    pub resolution_fee: u64,
    /// Total count of registered arbitrators.
    pub arbitrator_count: u64,
    /// PDA bump.
    pub bump: u8,
}

impl MasterConfig {
    pub const LEN: usize = 8 + // discriminator
        32 + // admin
        32 + // support
        8 +  // resolution_fee
        8 +  // arbitrator_count
        1 +  // bump
        32;  // padding
}

// ============================================================
// Arbitrator Registry Account
// ============================================================

#[account]
pub struct ArbitratorRegistry {
    /// Arbitrator's wallet address.
    pub arbitrator: Pubkey,
    /// Flag indicating whether arbitrator is active.
    pub is_active: bool,
    /// Sequential index of the arbitrator in the registry.
    pub index: u64,
    /// PDA bump.
    pub bump: u8,
}

impl ArbitratorRegistry {
    pub const LEN: usize = 8 + // discriminator
        32 + // arbitrator
        1 +  // is_active
        8 +  // index
        1 +  // bump
        16;  // padding
}

// ============================================================
// Freelance Contract Account
// ============================================================

#[account]
pub struct FreelanceContract {
    /// Client (employer) public key.
    pub client: Pubkey,
    /// Contractor (employee) public key.
    pub contractor: Pubkey,
    /// Unique index of this contract for the client.
    pub contract_index: u64,
    /// Current status of the contract.
    pub status: ContractStatus,
    /// Total number of milestones in the contract.
    pub total_milestones: u8,
    /// Index of the current milestone (0-indexed).
    pub current_milestone: u8,
    /// Last timestamp salary stream was accrued.
    pub last_accrual_time: i64,
    /// Start timestamp of contract.
    pub period_start: i64,
    /// End timestamp of contract (0 = infinite).
    pub period_end: i64,
    /// Flag indicating whether contract state is delegated to TEE.
    pub is_delegated: bool,
    /// PDA bump.
    pub bump: u8,

    // Encrypted FHE Handles (USD values)
    /// FHE-encrypted streaming rate (USD per second).
    pub encrypted_rate: EncryptedHandle,
    /// FHE-encrypted accrued balance for current milestone.
    pub encrypted_accrued: EncryptedHandle,
    /// FHE-encrypted total amount allocated for the current milestone.
    pub encrypted_total_milestone_amount: EncryptedHandle,
    /// FHE-encrypted remaining budget for the entire contract.
    pub encrypted_remaining_budget: EncryptedHandle,

    // Dispute Resolution Fields
    /// Current assigned arbitrator address for dispute.
    pub dispute_arbitrator: Pubkey,
    /// Timestamp when arbitrator was assigned to dispute.
    pub dispute_assigned_time: i64,
    /// Flag indicating if the dispute was escalated to Support.
    pub dispute_escalated: bool,
    /// Flag indicating if the dispute resolution fee was paid.
    pub dispute_fee_paid: bool,
}

impl FreelanceContract {
    pub const LEN: usize = 8 + // discriminator
        32 + // client
        32 + // contractor
        8 +  // contract_index
        1 +  // status
        1 +  // total_milestones
        1 +  // current_milestone
        8 +  // last_accrual_time
        8 +  // period_start
        8 +  // period_end
        1 +  // is_delegated
        1 +  // bump
        32 + // encrypted_rate
        32 + // encrypted_accrued
        32 + // encrypted_total_milestone_amount
        32 + // encrypted_remaining_budget
        32 + // dispute_arbitrator
        8 +  // dispute_assigned_time
        1 +  // dispute_escalated
        1 +  // dispute_fee_paid
        64;  // padding
}
