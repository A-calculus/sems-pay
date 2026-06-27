use anchor_lang::prelude::*;

// ============================================================
// External Program IDs (Devnet)
// ============================================================

/// Inco Lightning Program ID: 5sjEbPiqgZrYwR31ahR6Uk9wf5awoX61YGg7jExQSwaj
pub const INCO_LIGHTNING_ID: Pubkey = Pubkey::new_from_array([
    0x48, 0x6d, 0x8a, 0xee, 0xa3, 0x8b, 0xb4, 0xc5,
    0x86, 0x7e, 0x4f, 0x63, 0xc4, 0x5f, 0x41, 0xd4,
    0x57, 0x32, 0x0b, 0xb5, 0xa6, 0x57, 0xc2, 0xd7,
    0xde, 0x66, 0x1c, 0xbe, 0xa3, 0x7e, 0xa7, 0x34,
]);

/// Inco Token Program ID: 4cyJHzecVWuU2xux6bCAPAhALKQT8woBh4Vx3AGEGe5N
pub const INCO_TOKEN_PROGRAM_ID: Pubkey = Pubkey::new_from_array([
    0x35, 0xca, 0x0b, 0xad, 0xfd, 0xf2, 0x84, 0xbe,
    0xaf, 0x06, 0x4b, 0xc1, 0x86, 0xb9, 0x7a, 0x5f,
    0xe3, 0x07, 0x31, 0x54, 0xa6, 0x16, 0xd6, 0xa6,
    0x54, 0x15, 0x33, 0xa0, 0x94, 0xd3, 0xa5, 0xf9,
]);

// Default MagicBlock ER validator identity (Devnet EU).
pub const TEE_VALIDATOR: &str = "MEUGGrYPxKk17hCr7wpT6s8dtNokZj5U2L57vjYMS8e";

/// MagicBlock Permission Program (ACL) - Devnet
pub const MAGICBLOCK_PERMISSION_PROGRAM: &str = "ACLseoPoyC3cBqoUtkbjZ4aDrkurZW86v19pXz2XQnp1";

/// MagicBlock Delegation Program - Devnet
pub const MAGICBLOCK_DELEGATION_PROGRAM: &str = "DELeGGvXpWV2fqJUhqcF5ZSYMS4JTLjteaAMARRSaeSh";

/// MagicBlock Magic Router Program
pub use ephemeral_rollups_sdk::consts::MAGIC_PROGRAM_ID;

// ============================================================
// PDA Seeds
// ============================================================

pub const MASTER_CONFIG_SEED: &[u8] = b"master_config";
pub const ARBITRATOR_SEED: &[u8] = b"arbitrator";
pub const CONTRACT_SEED: &[u8] = b"contract";
pub const PERMISSION_SEED: &[u8] = b"permission:";

pub const MAX_CIPHERTEXT_BYTES: usize = 256;
pub const TIMEOUT_5_HOURS: i64 = 5 * 60 * 60; // 5 hours in seconds
