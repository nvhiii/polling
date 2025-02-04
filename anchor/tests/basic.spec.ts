import * as anchor from '@coral-xyz/anchor';
import { Program } from '@coral-xyz/anchor';
import { Keypair, PublicKey } from "@solana/web3.js";
import { Voting } from '../target/types/voting';
import { BankrunProvider, startAnchor } from "anchor-bankrun";

const IDL = require('../target/idl/voting.json');

const votingAddress = new PublicKey("6z68wfurCMYkZG51s1Et9BJEd9nJGUusjHXNt4dGbNNF");

describe('Voting', () => {
  // Configure the client to use the local cluster.

  let context;
  let provider;
  let votingProgram: Program<Voting>; // need to define type or else we get any type error

  beforeAll(async () => {

    context = await startAnchor("", [{name: "voting", programId: votingAddress}], []);

	  provider = new BankrunProvider(context);

    votingProgram = new Program<Voting>(
      IDL,
      provider,
    );
    
  })

  it('Initialize Poll', async () => {
    
    // context = await startAnchor("", [{name: "voting", programId: votingAddress}], []);

	  // provider = new BankrunProvider(context);

    // votingProgram = new Program<Voting>(
    //   IDL,
    //   provider,
    // );

    // instruction handler for init from lib.rs
    await votingProgram.methods.initializePoll(

      new anchor.BN(1), // poll id
      "What is your favorite type of peanut butter?", // desc
      new anchor.BN(0), // start
      new anchor.BN(1838547225), // end

    ).rpc(); // execute the instruction
  
    // find the poll address
    const [pollAddress] = PublicKey.findProgramAddressSync(
      [new anchor.BN(1).toArrayLike(Buffer, 'le', 8)],
      votingAddress,
    )

    // fetch the poll
    const poll = await votingProgram.account.poll.fetch(pollAddress);

    // log the poll
    console.log(poll);

    // testing via expected values
    expect(poll.pollId.toNumber()).toEqual(1);
    expect(poll.description).toEqual("What is your favorite type of peanut butter?");
    expect(poll.pollStart.toNumber()).toBeLessThan(poll.pollEnd.toNumber());


  })

  // it = init test
  it("Initialize candidate", async () => {
    
    // we setting both candidates here for the poll
    // when calling this method in the test, we need to pass both poll id and candidate name as params
    // needs to be the same param order as the instruction method
    await votingProgram.methods.initializeCandidate(
      "Smooth",
      new anchor.BN(1),
    ).rpc();

    await votingProgram.methods.initializeCandidate(
      "Crunchy",
      new anchor.BN(1),
    ).rpc();

    // when setting up acc, make sure params are in the same order as the contract in lib.rs
    // poll address must be in the same format as before in the test specified as well
    const [crunchyAddress] = PublicKey.findProgramAddressSync(
      [new anchor.BN(1).toArrayLike(Buffer, 'le', 8), Buffer.from("Crunchy")],
      votingAddress,
    );

    const crunchyCandidate = await votingProgram.account.candidate.fetch(crunchyAddress);
    console.log(crunchyCandidate);
    // do a test to check initialized values, if they are tested and are what we expect
    expect(crunchyCandidate.candidateVotes.toNumber()).toEqual(0);

    const [smoothAddress] = PublicKey.findProgramAddressSync(
      [new anchor.BN(1).toArrayLike(Buffer, 'le', 8), Buffer.from("Smooth")],
      votingAddress,
    );

    const smoothCandidate = await votingProgram.account.candidate.fetch(smoothAddress);
    console.log(smoothCandidate);
    expect(smoothCandidate.candidateVotes.toNumber()).toEqual(0);

  })

  it("Vote", async () => {
    
    await votingProgram.methods.vote(

      "Smooth",
      new anchor.BN(1),

    ).rpc();

    const [smoothAddress] = PublicKey.findProgramAddressSync(
      [new anchor.BN(1).toArrayLike(Buffer, 'le', 8), Buffer.from("Smooth")],
      votingAddress,
    );

    const smoothCandidate = await votingProgram.account.candidate.fetch(smoothAddress);
    console.log(smoothCandidate);
    expect(smoothCandidate.candidateVotes.toNumber()).toEqual(1);

  })
  
});
