import { ActionGetResponse, ActionPostRequest, ACTIONS_CORS_HEADERS, createPostResponse } from "@solana/actions";
import { Connection, PublicKey, Transaction } from "@solana/web3.js";
import { Voting } from "@/../anchor/target/types/voting";
import { BN, Program } from "@coral-xyz/anchor";

const IDL = require ("@/../anchor/target/idl/voting.json");

export const OPTIONS = GET;
// this get response is used to create the action
export async function GET(request: Request) {

  // check solana docs for the params needed for the action get response 
  const actionMetaData: ActionGetResponse = {
    icon: "https://images.getrecipekit.com/20230102102018-peanut_butter_01_520x500.webp?aspect_ratio=1:1&quality=90&",
    title: "Vote for your favorite type of peanut butter",
    description : "Vote between Crunchy and Smooth peanut butter",
    label: "Vote", // this is the label that goes on the button for the action
    // make sure to look at the solana docs to see what params are needed for the action get response
    links: {
      actions: [

        {
          href: "/api/vote?candidate=Crunchy",
          label: "Vote for Crunchy",
        },
        {
          href: "/api/vote?candidate=Smooth",
          label: "Vote for Smooth",
        },
          
      ]
    }
  };

  return Response.json(actionMetaData, { headers: ACTIONS_CORS_HEADERS });
}

export async function POST(request: Request) {

  const url = new URL(request.url);
  const candidate = url.searchParams.get("candidate");

  // handling client side error

  if (candidate != "Crunchy" && candidate != "Smooth") {

    return new Response("Invalid candidate", {status: 400, headers: ACTIONS_CORS_HEADERS});

  }

  // now we need the transaction to send back
  // block hash, message, signatures needed

  const connection = new Connection("http://127.0.0.1:8899", "confirmed");
  // program ensured after connnection
  const program: Program<Voting> = new Program(IDL, {connection});

  const body: ActionPostRequest = await request.json();
  let voter = new PublicKey(body.account)

  try {

    voter = new PublicKey(body.account);

  } catch (error) {

    return new Response("Invalid account", {status: 400, headers: ACTIONS_CORS_HEADERS});

  }

  const instruction = await program.methods
  .vote(candidate, new BN(1))
  .accounts({
    signer: voter,
  })
  .instruction();

  // get the latest blockhash to use in the transaction
  const blockhash = await connection.getLatestBlockhash();

  const transaction = new Transaction({
    feePayer: voter,
    blockhash: blockhash.blockhash,
    lastValidBlockHeight: blockhash.lastValidBlockHeight,
  }).add(instruction);

  const response = await createPostResponse({
    fields: {
      transaction: transaction,

    }
  });

  return Response.json(response, { headers: ACTIONS_CORS_HEADERS });

}
