use anchor_lang::prelude::*;
use anchor_lang::solana_program::system_instruction;
use anchor_lang::solana_program::program::invoke;

pub mod constants;
pub mod errors;
pub mod helpers;
pub mod state;

use constants::*;
use errors::SemsPayError;
use helpers::*;
use state::*;

declare_id!("FXgwKkCBThKpEtk4Vs22MJCJbBUEmJvMvKGJaLCuxgED");

#[program]
pub mod sems_pay {
    use super::*;

    /// Initialize the global program configuration.
    pub fn initialize_master(
        ctx: Context<InitializeMaster>,
        resolution_fee: u64,
        support: Pubkey,
    ) -> Result<()> {
        let master_config = &mut ctx.accounts.master_config;
        master_config.admin = ctx.accounts.admin.key();
        master_config.support = support;
        master_config.resolution_fee = resolution_fee;
        master_config.arbitrator_count = 0;
        master_config.bump = ctx.bumps.master_config;
        Ok(())
    }

    /// Register a user as an anonymous arbitrator in the global pool.
    pub fn register_arbitrator(ctx: Context<RegisterArbitrator>) -> Result<()> {
        let master_config = &mut ctx.accounts.master_config;
        let arbitrator_registry = &mut ctx.accounts.arbitrator_registry;

        arbitrator_registry.arbitrator = ctx.accounts.arbitrator.key();
        arbitrator_registry.is_active = true;
        arbitrator_registry.index = master_config.arbitrator_count;
        arbitrator_registry.bump = ctx.bumps.arbitrator_registry;

        master_config.arbitrator_count = master_config
            .arbitrator_count
            .checked_add(1)
            .ok_or(SemsPayError::InvalidAmount)?;

        Ok(())
    }

    /// Create a freelance escrow contract with encrypted wage rates and milestones.
    pub fn create_contract(
        ctx: Context<CreateContract>,
        contract_index: u64,
        total_milestones: u8,
        period_start: i64,
        period_end: i64,
        encrypted_rate: Vec<u8>,
        encrypted_total_milestone_amount: Vec<u8>,
        encrypted_remaining_budget: Vec<u8>,
        funding_amount_lamports: u64,
    ) -> Result<()> {
        let contract = &mut ctx.accounts.contract;
        let clock = Clock::get()?;

        contract.client = ctx.accounts.client.key();
        contract.contractor = ctx.accounts.contractor.key();
        contract.contract_index = contract_index;
        contract.status = ContractStatus::Active;
        contract.total_milestones = total_milestones;
        contract.current_milestone = 0;
        contract.last_accrual_time = if period_start > clock.unix_timestamp {
            period_start
        } else {
            clock.unix_timestamp
        };
        contract.period_start = period_start;
        contract.period_end = period_end;
        contract.is_delegated = false;
        contract.bump = ctx.bumps.contract;

        // FHE Handles registration
        let signer = ctx.accounts.client.to_account_info();
        let inco_lightning = ctx.accounts.inco_lightning_program.to_account_info();

        let rate_handle = inco_new_euint128(&signer, &inco_lightning, encrypted_rate, 0, None)?;
        let milestone_handle = inco_new_euint128(&signer, &inco_lightning, encrypted_total_milestone_amount, 0, None)?;
        let budget_handle = inco_new_euint128(&signer, &inco_lightning, encrypted_remaining_budget, 0, None)?;

        contract.encrypted_rate = u128_to_handle(rate_handle);
        contract.encrypted_total_milestone_amount = u128_to_handle(milestone_handle);
        contract.encrypted_remaining_budget = u128_to_handle(budget_handle);
        contract.encrypted_accrued = u128_to_handle(inco_as_euint128(&signer, &inco_lightning, 0, None)?);

        // Dispute default state
        contract.dispute_arbitrator = Pubkey::default();
        contract.dispute_assigned_time = 0;
        contract.dispute_escalated = false;
        contract.dispute_fee_paid = false;

        // Transfer funding amount from client to the escrow contract PDA
        if funding_amount_lamports > 0 {
            let transfer_ix = system_instruction::transfer(
                &ctx.accounts.client.key(),
                &contract.key(),
                funding_amount_lamports,
            );
            invoke(
                &transfer_ix,
                &[
                    ctx.accounts.client.to_account_info(),
                    contract.to_account_info(),
                    ctx.accounts.system_program.to_account_info(),
                ],
            )?;
        }

        Ok(())
    }

    /// Accrue streaming wages in real-time (can be cranked on Ephemeral Rollup).
    pub fn crank_accrue(ctx: Context<CrankAccrue>) -> Result<()> {
        let contract = &mut ctx.accounts.contract;
        let clock = Clock::get()?;
        let current_time = clock.unix_timestamp;

        require!(contract.status == ContractStatus::Active, SemsPayError::StreamPaused);

        let mut effective_to = current_time;
        if contract.period_end > 0 && effective_to > contract.period_end {
            effective_to = contract.period_end;
        }
        let effective_from = contract.last_accrual_time;
        if effective_to <= effective_from {
            return Ok(());
        }
        let elapsed = (effective_to - effective_from) as u128;

        let signer = ctx.accounts.caller.to_account_info();
        let inco_lightning = ctx.accounts.inco_lightning_program.to_account_info();

        let rate_handle = handle_to_u128(&contract.encrypted_rate);
        let accrued_handle = handle_to_u128(&contract.encrypted_accrued);
        let milestone_amount_handle = handle_to_u128(&contract.encrypted_total_milestone_amount);

        // delta = rate * elapsed
        let delta = inco_binary_op_u128(&signer, &inco_lightning, "e_mul", rate_handle, elapsed, 1, None)?;

        // potential_accrued = accrued + delta
        let potential_accrued = inco_add_u128(&signer, &inco_lightning, accrued_handle, delta, None)?;

        // cap accrued at milestone_amount
        let cap_reached = inco_e_ge(&signer, &inco_lightning, potential_accrued, milestone_amount_handle, None)?;
        let final_accrued = inco_e_select(&signer, &inco_lightning, cap_reached, milestone_amount_handle, potential_accrued, None)?;

        contract.encrypted_accrued = u128_to_handle(final_accrued);
        contract.last_accrual_time = effective_to;

        Ok(())
    }

    /// Pause the streaming contract (e.g. client raises concern or contractor pauses).
    pub fn pause_contract(ctx: Context<PauseContract>) -> Result<()> {
        let contract = &mut ctx.accounts.contract;
        require!(
            ctx.accounts.caller.key() == contract.client || ctx.accounts.caller.key() == contract.contractor,
            SemsPayError::Unauthorized
        );
        require!(contract.status == ContractStatus::Active, SemsPayError::StreamPaused);

        contract.status = ContractStatus::Paused;
        Ok(())
    }

    /// Resume the streaming contract.
    pub fn resume_contract(ctx: Context<ResumeContract>) -> Result<()> {
        let contract = &mut ctx.accounts.contract;
        require_keys_eq!(ctx.accounts.caller.key(), contract.client, SemsPayError::Unauthorized);
        require!(contract.status == ContractStatus::Paused, SemsPayError::Unauthorized);

        contract.status = ContractStatus::Active;
        contract.last_accrual_time = Clock::get()?.unix_timestamp;
        Ok(())
    }

    /// Approve a milestone completion, payout the milestone funds, and advance to next.
    pub fn approve_milestone(
        ctx: Context<ApproveMilestone>,
        payout_amount_lamports: u64,
    ) -> Result<()> {
        let contract = &mut ctx.accounts.contract;
        require_keys_eq!(ctx.accounts.client.key(), contract.client, SemsPayError::Unauthorized);
        require!(
            contract.status == ContractStatus::Active || contract.status == ContractStatus::Paused,
            SemsPayError::ContractAlreadyResolved
        );

        // Send public payout amount to contractor
        if payout_amount_lamports > 0 {
            let contract_lamports = contract.to_account_info().lamports();
            let safe_payout = payout_amount_lamports.min(contract_lamports);
            **contract.to_account_info().try_borrow_mut_lamports()? -= safe_payout;
            **ctx.accounts.contractor.try_borrow_mut_lamports()? += safe_payout;
        }

        // Reset accrued for the next milestone
        let signer = ctx.accounts.client.to_account_info();
        let inco_lightning = ctx.accounts.inco_lightning_program.to_account_info();
        contract.encrypted_accrued = u128_to_handle(inco_as_euint128(&signer, &inco_lightning, 0, None)?);

        contract.current_milestone = contract.current_milestone.checked_add(1).unwrap_or(contract.current_milestone);
        if contract.current_milestone >= contract.total_milestones {
            contract.status = ContractStatus::Resolved;
        } else {
            contract.last_accrual_time = Clock::get()?.unix_timestamp;
        }

        Ok(())
    }

    /// Raise a dispute on an active or paused contract, pausing the stream and selecting an anonymous arbitrator.
    pub fn dispute_contract(ctx: Context<DisputeContract>) -> Result<()> {
        let contract = &mut ctx.accounts.contract;
        let master_config = &ctx.accounts.master_config;

        require!(
            ctx.accounts.caller.key() == contract.client || ctx.accounts.caller.key() == contract.contractor,
            SemsPayError::Unauthorized
        );
        require!(
            contract.status == ContractStatus::Active || contract.status == ContractStatus::Paused,
            SemsPayError::ContractAlreadyResolved
        );

        contract.status = ContractStatus::Disputed;
        contract.dispute_assigned_time = Clock::get()?.unix_timestamp;
        contract.dispute_escalated = false;
        contract.dispute_fee_paid = false;

        // Select an arbitrator randomly from the registered pool using the block slot
        if master_config.arbitrator_count > 0 {
            let slot = Clock::get()?.slot;
            let target_index = slot % master_config.arbitrator_count;
            contract.dispute_arbitrator = ctx.accounts.arbitrator_registry.arbitrator;
            require!(
                ctx.accounts.arbitrator_registry.index == target_index,
                SemsPayError::Unauthorized
            );
        } else {
            // Fallback to support address if pool is empty
            contract.dispute_arbitrator = master_config.support;
        }

        Ok(())
    }

    /// Pay the dispute resolution fee to the assigned arbitrator.
    pub fn pay_dispute_fee(ctx: Context<PayDisputeFee>) -> Result<()> {
        let contract = &mut ctx.accounts.contract;
        let master_config = &ctx.accounts.master_config;

        require!(contract.status == ContractStatus::Disputed, SemsPayError::ContractNotDisputed);
        require!(!contract.dispute_fee_paid, SemsPayError::Unauthorized);

        let fee = master_config.resolution_fee;
        if fee > 0 {
            let transfer_ix = system_instruction::transfer(
                &ctx.accounts.payer.key(),
                &ctx.accounts.arbitrator.key(),
                fee,
            );
            invoke(
                &transfer_ix,
                &[
                    ctx.accounts.payer.to_account_info(),
                    ctx.accounts.arbitrator.to_account_info(),
                    ctx.accounts.system_program.to_account_info(),
                ],
            )?;
        }

        contract.dispute_fee_paid = true;
        Ok(())
    }

    /// Resolve a disputed contract, splitting the escrow balance between client and contractor.
    pub fn resolve_dispute(
        ctx: Context<ResolveDispute>,
        client_payout_lamports: u64,
        contractor_payout_lamports: u64,
    ) -> Result<()> {
        let contract = &mut ctx.accounts.contract;
        let caller = ctx.accounts.caller.key();

        require!(contract.status == ContractStatus::Disputed, SemsPayError::ContractNotDisputed);
        
        // Ensure resolver is the assigned arbitrator or the support address (if escalated)
        if contract.dispute_escalated {
            require_keys_eq!(caller, ctx.accounts.master_config.support, SemsPayError::NotArbitrator);
        } else {
            require_keys_eq!(caller, contract.dispute_arbitrator, SemsPayError::NotArbitrator);
        }

        let total_payout = client_payout_lamports
            .checked_add(contractor_payout_lamports)
            .ok_or(SemsPayError::InvalidAmount)?;

        let contract_balance = contract.to_account_info().lamports();
        require!(total_payout <= contract_balance, SemsPayError::InvalidAmount);

        // Distribute funds
        if client_payout_lamports > 0 {
            **contract.to_account_info().try_borrow_mut_lamports()? -= client_payout_lamports;
            **ctx.accounts.client.try_borrow_mut_lamports()? += client_payout_lamports;
        }

        if contractor_payout_lamports > 0 {
            **contract.to_account_info().try_borrow_mut_lamports()? -= contractor_payout_lamports;
            **ctx.accounts.contractor.try_borrow_mut_lamports()? += contractor_payout_lamports;
        }

        // Return remaining funds to client
        let remaining = contract.to_account_info().lamports();
        if remaining > 0 {
            **contract.to_account_info().try_borrow_mut_lamports()? -= remaining;
            **ctx.accounts.client.try_borrow_mut_lamports()? += remaining;
        }

        contract.status = ContractStatus::Resolved;
        Ok(())
    }

    /// Escalate the dispute to support if the assigned arbitrator fails to resolve it within 5 hours.
    pub fn escalate_dispute(ctx: Context<EscalateDispute>) -> Result<()> {
        let contract = &mut ctx.accounts.contract;
        let master_config = &ctx.accounts.master_config;
        let clock = Clock::get()?;

        require!(contract.status == ContractStatus::Disputed, SemsPayError::ContractNotDisputed);
        require!(!contract.dispute_escalated, SemsPayError::ContractAlreadyResolved);

        let elapsed = clock.unix_timestamp - contract.dispute_assigned_time;
        require!(elapsed >= TIMEOUT_5_HOURS, SemsPayError::ArbitratorTimeoutNotReached);

        contract.dispute_escalated = true;
        contract.dispute_arbitrator = master_config.support;
        contract.dispute_assigned_time = clock.unix_timestamp;

        Ok(())
    }
}

// ============================================================
// Context Structs
// ============================================================

#[derive(Accounts)]
pub struct InitializeMaster<'info> {
    #[account(mut)]
    pub admin: Signer<'info>,

    #[account(
        init,
        payer = admin,
        space = MasterConfig::LEN,
        seeds = [MASTER_CONFIG_SEED],
        bump
    )]
    pub master_config: Account<'info, MasterConfig>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct RegisterArbitrator<'info> {
    #[account(mut)]
    pub arbitrator: Signer<'info>,

    #[account(
        mut,
        seeds = [MASTER_CONFIG_SEED],
        bump = master_config.bump
    )]
    pub master_config: Account<'info, MasterConfig>,

    #[account(
        init,
        payer = arbitrator,
        space = ArbitratorRegistry::LEN,
        seeds = [ARBITRATOR_SEED, &master_config.arbitrator_count.to_le_bytes()],
        bump
    )]
    pub arbitrator_registry: Account<'info, ArbitratorRegistry>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(contract_index: u64)]
pub struct CreateContract<'info> {
    #[account(mut)]
    pub client: Signer<'info>,

    /// CHECK: contractor receiver key
    pub contractor: AccountInfo<'info>,

    #[account(
        seeds = [MASTER_CONFIG_SEED],
        bump = master_config.bump
    )]
    pub master_config: Account<'info, MasterConfig>,

    #[account(
        init,
        payer = client,
        space = FreelanceContract::LEN,
        seeds = [CONTRACT_SEED, client.key().as_ref(), &contract_index.to_le_bytes()],
        bump
    )]
    pub contract: Account<'info, FreelanceContract>,

    /// CHECK: Inco Lightning Program
    #[account(address = INCO_LIGHTNING_ID)]
    pub inco_lightning_program: AccountInfo<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct CrankAccrue<'info> {
    #[account(mut)]
    pub caller: Signer<'info>,

    #[account(mut)]
    pub contract: Account<'info, FreelanceContract>,

    /// CHECK: Inco Lightning Program
    #[account(address = INCO_LIGHTNING_ID)]
    pub inco_lightning_program: AccountInfo<'info>,
}

#[derive(Accounts)]
pub struct PauseContract<'info> {
    #[account(mut)]
    pub caller: Signer<'info>,

    #[account(mut)]
    pub contract: Account<'info, FreelanceContract>,
}

#[derive(Accounts)]
pub struct ResumeContract<'info> {
    #[account(mut)]
    pub caller: Signer<'info>,

    #[account(mut)]
    pub contract: Account<'info, FreelanceContract>,
}

#[derive(Accounts)]
pub struct ApproveMilestone<'info> {
    #[account(mut)]
    pub client: Signer<'info>,

    /// CHECK: contractor receiving wallet
    #[account(mut)]
    pub contractor: AccountInfo<'info>,

    #[account(
        mut,
        constraint = contract.client == client.key(),
        constraint = contract.contractor == contractor.key()
    )]
    pub contract: Account<'info, FreelanceContract>,

    /// CHECK: Inco Lightning Program
    #[account(address = INCO_LIGHTNING_ID)]
    pub inco_lightning_program: AccountInfo<'info>,
}

#[derive(Accounts)]
pub struct DisputeContract<'info> {
    #[account(mut)]
    pub caller: Signer<'info>,

    #[account(
        seeds = [MASTER_CONFIG_SEED],
        bump = master_config.bump
    )]
    pub master_config: Account<'info, MasterConfig>,

    #[account(mut)]
    pub contract: Account<'info, FreelanceContract>,

    /// CHECK: Registry account matching the selected arbitrator index
    pub arbitrator_registry: Account<'info, ArbitratorRegistry>,
}

#[derive(Accounts)]
pub struct PayDisputeFee<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,

    #[account(
        seeds = [MASTER_CONFIG_SEED],
        bump = master_config.bump
    )]
    pub master_config: Account<'info, MasterConfig>,

    #[account(mut)]
    pub contract: Account<'info, FreelanceContract>,

    /// CHECK: Arbitrator wallet
    #[account(mut, address = contract.dispute_arbitrator)]
    pub arbitrator: AccountInfo<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct ResolveDispute<'info> {
    #[account(mut)]
    pub caller: Signer<'info>,

    #[account(
        seeds = [MASTER_CONFIG_SEED],
        bump = master_config.bump
    )]
    pub master_config: Account<'info, MasterConfig>,

    #[account(mut)]
    pub contract: Account<'info, FreelanceContract>,

    /// CHECK: client receiving wallet
    #[account(mut, address = contract.client)]
    pub client: AccountInfo<'info>,

    /// CHECK: contractor receiving wallet
    #[account(mut, address = contract.contractor)]
    pub contractor: AccountInfo<'info>,
}

#[derive(Accounts)]
pub struct EscalateDispute<'info> {
    #[account(mut)]
    pub caller: Signer<'info>,

    #[account(
        seeds = [MASTER_CONFIG_SEED],
        bump = master_config.bump
    )]
    pub master_config: Account<'info, MasterConfig>,

    #[account(mut)]
    pub contract: Account<'info, FreelanceContract>,
}
