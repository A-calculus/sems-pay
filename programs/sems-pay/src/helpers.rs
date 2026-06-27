use anchor_lang::prelude::*;
use anchor_lang::solana_program::{
    instruction::{AccountMeta, Instruction},
    program::{get_return_data, invoke, invoke_signed},
};

use crate::constants::*;
use crate::errors::SemsPayError;
use crate::state::EncryptedHandle;

// ============================================================
// Handle Conversion Helpers
// ============================================================

pub fn handle_to_u128(handle: &EncryptedHandle) -> u128 {
    let mut bytes = [0u8; 16];
    bytes.copy_from_slice(&handle.handle[..16]);
    u128::from_le_bytes(bytes)
}

pub fn u128_to_handle(value: u128) -> EncryptedHandle {
    let mut out = [0u8; 32];
    out[..16].copy_from_slice(&value.to_le_bytes());
    EncryptedHandle { handle: out }
}

pub fn is_handle_zero(handle: &EncryptedHandle) -> bool {
    handle.handle.iter().all(|b| *b == 0)
}

pub fn magicblock_permission_program() -> Pubkey {
    Pubkey::try_from(MAGICBLOCK_PERMISSION_PROGRAM).unwrap_or(Pubkey::default())
}

pub fn magicblock_delegation_program() -> Pubkey {
    Pubkey::try_from(MAGICBLOCK_DELEGATION_PROGRAM).unwrap_or(Pubkey::default())
}

pub fn derive_permission_pda(permissioned_account: &Pubkey) -> (Pubkey, u8) {
    Pubkey::find_program_address(
        &[PERMISSION_SEED, permissioned_account.as_ref()],
        &magicblock_permission_program(),
    )
}

// ============================================================
// Inco Lightning CPI Helpers
// ============================================================

pub fn inco_sighash(name: &str) -> Result<[u8; 8]> {
    match name {
        "new_euint128" => Ok([0x91, 0x20, 0x66, 0xe3, 0x2f, 0xe7, 0x0a, 0xd6]),
        "as_euint128" => Ok([0x56, 0x3d, 0x17, 0xad, 0xbb, 0x02, 0xf7, 0x60]),
        "e_mul" => Ok([0xe5, 0x99, 0xf5, 0x11, 0x5f, 0x94, 0x3d, 0xf7]),
        "e_add" => Ok([0x14, 0x53, 0x12, 0xa7, 0x78, 0x21, 0xd1, 0xee]),
        "e_sub" => Ok([0xbb, 0x0b, 0x91, 0x1e, 0x32, 0x36, 0x3a, 0xe4]),
        "e_ge"  => Ok([0x81, 0xc4, 0x77, 0x65, 0x51, 0x6c, 0x45, 0xce]),
        "e_lt"  => Ok([0xb9, 0xcd, 0x51, 0xb0, 0x8b, 0x1d, 0xf5, 0x1e]),
        "e_select" => Ok([0xb3, 0xf5, 0x86, 0x85, 0xae, 0xb1, 0xcb, 0xfd]),
        _ => Err(SemsPayError::InvalidCiphertext.into()),
    }
}

pub fn read_inco_u128_return() -> Result<u128> {
    let (program_id, return_data) = get_return_data().ok_or(ProgramError::InvalidAccountData)?;
    require_keys_eq!(program_id, INCO_LIGHTNING_ID, SemsPayError::InvalidCiphertext);
    if return_data.len() < 16 {
        return Err(ProgramError::InvalidAccountData.into());
    }
    let mut out = [0u8; 16];
    out.copy_from_slice(&return_data[..16]);
    Ok(u128::from_le_bytes(out))
}

pub fn inco_new_euint128<'info>(
    signer: &AccountInfo<'info>,
    inco_lightning_program: &AccountInfo<'info>,
    ciphertext: Vec<u8>,
    input_type: u8,
    signer_seeds: Option<&[&[&[u8]]]>,
) -> Result<u128> {
    require!(
        !ciphertext.is_empty() && ciphertext.len() <= MAX_CIPHERTEXT_BYTES,
        SemsPayError::CiphertextTooLarge
    );

    let mut data = Vec::with_capacity(8 + 4 + ciphertext.len() + 1);
    data.extend_from_slice(&inco_sighash("new_euint128")?);
    data.extend_from_slice(&(ciphertext.len() as u32).to_le_bytes());
    data.extend_from_slice(&ciphertext);
    data.push(input_type);

    let ix = Instruction {
        program_id: INCO_LIGHTNING_ID,
        accounts: vec![AccountMeta::new(signer.key(), true)],
        data,
    };

    match signer_seeds {
        Some(seeds) => invoke_signed(&ix, &[signer.clone(), inco_lightning_program.clone()], seeds)?,
        None => invoke(&ix, &[signer.clone(), inco_lightning_program.clone()])?,
    }
    read_inco_u128_return()
}

pub fn inco_as_euint128<'info>(
    signer: &AccountInfo<'info>,
    inco_lightning_program: &AccountInfo<'info>,
    value: u128,
    signer_seeds: Option<&[&[&[u8]]]>,
) -> Result<u128> {
    let mut data = Vec::with_capacity(8 + 16);
    data.extend_from_slice(&inco_sighash("as_euint128")?);
    data.extend_from_slice(&value.to_le_bytes());

    let ix = Instruction {
        program_id: INCO_LIGHTNING_ID,
        accounts: vec![AccountMeta::new(signer.key(), true)],
        data,
    };

    match signer_seeds {
        Some(seeds) => invoke_signed(&ix, &[signer.clone(), inco_lightning_program.clone()], seeds)?,
        None => invoke(&ix, &[signer.clone(), inco_lightning_program.clone()])?,
    }
    read_inco_u128_return()
}

pub fn inco_binary_op_u128<'info>(
    signer: &AccountInfo<'info>,
    inco_lightning_program: &AccountInfo<'info>,
    op_name: &str,
    lhs: u128,
    rhs: u128,
    scalar_byte: u8,
    signer_seeds: Option<&[&[&[u8]]]>,
) -> Result<u128> {
    let mut data = Vec::with_capacity(8 + 16 + 16 + 1);
    data.extend_from_slice(&inco_sighash(op_name)?);
    data.extend_from_slice(&lhs.to_le_bytes());
    data.extend_from_slice(&rhs.to_le_bytes());
    data.push(scalar_byte);

    let ix = Instruction {
        program_id: INCO_LIGHTNING_ID,
        accounts: vec![AccountMeta::new(signer.key(), true)],
        data,
    };

    match signer_seeds {
        Some(seeds) => invoke_signed(&ix, &[signer.clone(), inco_lightning_program.clone()], seeds)?,
        None => invoke(&ix, &[signer.clone(), inco_lightning_program.clone()])?,
    }
    read_inco_u128_return()
}

pub fn inco_add_u128<'info>(
    signer: &AccountInfo<'info>,
    inco_lightning_program: &AccountInfo<'info>,
    lhs: u128,
    rhs: u128,
    signer_seeds: Option<&[&[&[u8]]]>,
) -> Result<u128> {
    inco_binary_op_u128(signer, inco_lightning_program, "e_add", lhs, rhs, 0, signer_seeds)
}

pub fn inco_sub_u128<'info>(
    signer: &AccountInfo<'info>,
    inco_lightning_program: &AccountInfo<'info>,
    lhs: u128,
    rhs: u128,
    signer_seeds: Option<&[&[&[u8]]]>,
) -> Result<u128> {
    inco_binary_op_u128(signer, inco_lightning_program, "e_sub", lhs, rhs, 0, signer_seeds)
}

pub fn inco_mul_u128<'info>(
    signer: &AccountInfo<'info>,
    inco_lightning_program: &AccountInfo<'info>,
    lhs: u128,
    rhs: u128,
    signer_seeds: Option<&[&[&[u8]]]>,
) -> Result<u128> {
    inco_binary_op_u128(signer, inco_lightning_program, "e_mul", lhs, rhs, 0, signer_seeds)
}

pub fn inco_comparison_op_u128<'info>(
    signer: &AccountInfo<'info>,
    inco_lightning_program: &AccountInfo<'info>,
    op_name: &str,
    lhs: u128,
    rhs: u128,
    scalar_byte: u8,
    signer_seeds: Option<&[&[&[u8]]]>,
) -> Result<u128> {
    let mut data = Vec::with_capacity(8 + 16 + 16 + 1);
    data.extend_from_slice(&inco_sighash(op_name)?);
    data.extend_from_slice(&lhs.to_le_bytes());
    data.extend_from_slice(&rhs.to_le_bytes());
    data.push(scalar_byte);

    let ix = Instruction {
        program_id: INCO_LIGHTNING_ID,
        accounts: vec![AccountMeta::new(signer.key(), true)],
        data,
    };

    match signer_seeds {
        Some(seeds) => invoke_signed(&ix, &[signer.clone(), inco_lightning_program.clone()], seeds)?,
        None => invoke(&ix, &[signer.clone(), inco_lightning_program.clone()])?,
    }
    read_inco_u128_return()
}

pub fn inco_e_ge<'info>(
    signer: &AccountInfo<'info>,
    inco_lightning_program: &AccountInfo<'info>,
    lhs: u128,
    rhs: u128,
    signer_seeds: Option<&[&[&[u8]]]>,
) -> Result<u128> {
    inco_comparison_op_u128(signer, inco_lightning_program, "e_ge", lhs, rhs, 0, signer_seeds)
}

pub fn inco_e_select<'info>(
    signer: &AccountInfo<'info>,
    inco_lightning_program: &AccountInfo<'info>,
    condition: u128,
    if_true: u128,
    if_false: u128,
    signer_seeds: Option<&[&[&[u8]]]>,
) -> Result<u128> {
    let mut data = Vec::with_capacity(8 + 16 + 16 + 16 + 1);
    data.extend_from_slice(&inco_sighash("e_select")?);
    data.extend_from_slice(&condition.to_le_bytes());
    data.extend_from_slice(&if_true.to_le_bytes());
    data.extend_from_slice(&if_false.to_le_bytes());
    data.push(0); // scalar_byte

    let ix = Instruction {
        program_id: INCO_LIGHTNING_ID,
        accounts: vec![AccountMeta::new(signer.key(), true)],
        data,
    };

    match signer_seeds {
        Some(seeds) => invoke_signed(&ix, &[signer.clone(), inco_lightning_program.clone()], seeds)?,
        None => invoke(&ix, &[signer.clone(), inco_lightning_program.clone()])?,
    }
    read_inco_u128_return()
}
