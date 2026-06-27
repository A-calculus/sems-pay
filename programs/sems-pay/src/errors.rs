use anchor_lang::prelude::*;

#[error_code]
pub enum SemsPayError {
    #[msg("You are not authorized to perform this action.")]
    Unauthorized,

    #[msg("Invalid input amount.")]
    InvalidAmount,

    #[msg("Invalid FHE ciphertext provided.")]
    InvalidCiphertext,

    #[msg("Ciphertext exceeds maximum accepted length.")]
    CiphertextTooLarge,

    #[msg("The stream is currently paused.")]
    StreamPaused,

    #[msg("The stream is currently delegated to TEE.")]
    StreamDelegated,

    #[msg("The contract is not in a disputed state.")]
    ContractNotDisputed,

    #[msg("The contract has already been resolved.")]
    ContractAlreadyResolved,

    #[msg("The 5-hour arbitrator timeout has not been reached yet.")]
    ArbitratorTimeoutNotReached,

    #[msg("Only the assigned arbitrator or support can perform this action.")]
    NotArbitrator,

    #[msg("Escalation to support is not allowed under current conditions.")]
    EscalationNotAllowed,

    #[msg("Invalid milestone index specified.")]
    InvalidMilestone,

    #[msg("Milestone has already been approved.")]
    MilestoneAlreadyApproved,

    #[msg("The contract is not delegated.")]
    ContractNotDelegated,
}
