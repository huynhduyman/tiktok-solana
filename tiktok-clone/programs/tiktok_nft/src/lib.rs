use anchor_lang::prelude::*;
use anchor_lang::prelude::Program;
use anchor_spl::token::{self, Token};
use std::mem::size_of;
use anchor_lang::solana_program::log::{
    sol_log_compute_units
};

declare_id!("Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS");

// Video and comment text length
const TEXT_LENGTH: usize = 1024;
// Username length
const USER_NAME_LENGTH: usize = 100;
// User profile image url length
const USER_URL_LENGTH: usize = 255;
const VIDEO_URL_LENGTH: usize = 255;

const NUMBER_OF_ALLOWED_LIKES_SPACE: usize = 5;
const NUMBER_OF_ALLOWED_LIKES: u8 = 5;

#[program]
pub mod tiktok_nft {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        let state = &mut ctx.accounts.state;
        // Save authority to state
        state.authority = ctx.accounts.authority.key();
        // Set video count as 0 when initializing
        state.video = 0;
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize<'info> {
    // Authenticating state account
    #[account(     
        init,
        seeds = [b"state".as_ref()],
        bump,
        payer = authority,
        space = size_of::<StateAccount>() + 8
    )]
    pub state: Account<'info, StateAccount>,

    // Authority (this is signer who paid transaction fee)
    #[account(mut)]
    pub authority: Signer<'info>,

    /// System program
    /// CHECK: Simple test account for tiktok
    pub system_program: UncheckedAccount<'info>,

    // Token program
    #[account(constraint = token_program.key == &token::ID)]
    pub token_program: Program<'info, Token>,
}

// State Account Structure
#[account]
pub struct StateAccount {
    // Signer address
    pub authority: Pubkey,

    // Video count
    pub video: u64,
}
