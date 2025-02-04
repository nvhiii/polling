use anchor_lang::prelude::*;

declare_id!("6z68wfurCMYkZG51s1Et9BJEd9nJGUusjHXNt4dGbNNF");

#[program]
pub mod voting {
    use super::*;

    // we use the underscore to show that we arent really using the variable, so errors arent thrown

    pub fn initialize_poll(ctx: Context<InitializePoll>, poll_id: u64, description: String, poll_start: u64, poll_end: u64) -> Result<()> {
        let poll = &mut ctx.accounts.poll;
        poll.poll_id = poll_id;
        poll.description = description;
        poll.poll_start = poll_start;
        poll.poll_end = poll_end;
        poll.candidate_amount = 0; // setting it to 0, will inc later
        Ok(())
    }

    pub fn initialize_candidate(ctx: Context<InitializeCandidate>, candidate_name: String, _poll_id: u64) -> Result<()> {
        // stuff
        let candidate = &mut ctx.accounts.candidate;
        // also need to increment the poll amt
        let poll = &mut ctx.accounts.poll;
        poll.candidate_amount += 1;

        candidate.candidate_name = candidate_name;
        candidate.candidate_votes = 0;
        Ok(())
    }

    // voting instruction
    // need candidate to vote for, 
    pub fn vote(ctx: Context<Vote>, _candidate_name: String, _poll_id: u64) -> Result<()> {

        let candidate = &mut ctx.accounts.candidate;
        candidate.candidate_votes += 1;
        Ok(())

    }

}

#[derive(Accounts)]
#[instruction(candidate_name: String, poll_id: u64)]
// since we dont need to crate account for hte voting, we just use all accounts from init candidate aside sys program
pub struct Vote<'info> { 
    pub signer: Signer<'info>,

    // poll acc
    // since we dont ref init, paper, space, only need seeds and bump
    #[account(
        // seeds
        seeds = [poll_id.to_le_bytes().as_ref()],
        bump,
    )]
    pub poll: Account<'info, Poll>,

    // candidate acc
    #[account(
        mut, // need this to change value
        // seeds
        seeds = [poll_id.to_le_bytes().as_ref(), candidate_name.as_bytes()],
        bump,
    )]
    pub candidate: Account<'info, Candidate>,

}

#[derive(Accounts)]
#[instruction(candidate_name: String, poll_id: u64)]
pub struct InitializeCandidate<'info> {

    #[account(mut)]
    pub signer: Signer<'info>,

    // poll acc
    // since we dont ref init, paper, space, only need seeds and bump
    #[account(
        mut, // need this to change value
        // seeds
        seeds = [poll_id.to_le_bytes().as_ref()],
        bump,
    )]
    pub poll: Account<'info, Poll>,

    // candidate acc
    #[account(
        init,
        payer = signer,
        space = 8 + Poll::INIT_SPACE,
        // seeds
        seeds = [poll_id.to_le_bytes().as_ref(), candidate_name.as_bytes()],
        bump,
    )]
    pub candidate: Account<'info, Candidate>,


    pub system_program: Program<'info, System>,

}

#[account]
#[derive(InitSpace)]
pub struct Candidate {

    #[max_len(32)]
    pub candidate_name: String,
    pub candidate_votes: u64,

}

// basically a list of all the account types for poll
// aka validation struct, constructor
#[derive(Accounts)]
// the way to poll in different parameters
#[instruction(poll_id: u64)]
pub struct InitializePoll<'info> {

    #[account(mut)]
    pub signer: Signer<'info>,
    #[account(
        init,
        payer = signer,
        space = 8 + Poll::INIT_SPACE,
        // seeds
        seeds = [poll_id.to_le_bytes().as_ref()],
        bump,
    )]
    pub poll: Account<'info, Poll>,

    pub system_program: Program<'info, System>,

}

// define the accounts here
#[account]
#[derive(InitSpace)]
pub struct Poll {

    pub poll_id: u64,
    #[max_len(280)]
    pub description: String,
    pub poll_start: u64,
    pub poll_end: u64,
    pub candidate_amount: u64,

}
