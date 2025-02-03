import * as anchor from '@coral-xyz/anchor';
import { Program } from '@coral-xyz/anchor';
import { Keypair, PublicKey } from "@solana/web3.js";
import { Voting } from '../target/types/voting';
import { BankrunProvider, startAnchor } from "anchor-bankrun";

const IDL = require('../target/idl/voting.json');

const votingAddress = new PublicKey("6z68wfurCMYkZG51s1Et9BJEd9nJGUusjHXNt4dGbNNF");

describe('Voting', () => {
  // Configure the client to use the local cluster.

  it('Initialize Poll', async () => {
    
    const context = await startAnchor("", [{name: "voting", programId: votingAddress}], []);

	  const provider = new BankrunProvider(context);

    const votingProgram = new Program<Voting>(
      IDL,
      provider,
    );

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
    
  })

  it("Initialize candidate", async () => {
    
  })
  
});
