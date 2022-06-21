// import type { TiktokClone } from '../target/types/tiktok_clone'
// import BN from 'bn.js';

const assert = require("assert");
const anchor = require("@project-serum/anchor");
const { SystemProgram, PublicKey } = anchor.web3;
const { TOKEN_PROGRAM_ID } = require('@solana/spl-token');
const utf8 = anchor.utils.bytes.utf8;

describe('tiktok-clone', () => {  

  const provider = anchor.AnchorProvider.local();

  // Configure the client to use the local cluster.
  anchor.setProvider(provider);

  // Program for the tests.
  const program = anchor.workspace.TikTokClone ;
  // Assign a new account to a program
  const state = anchor.web3.Keypair.generate();

  // const defaultAccounts = {
  //   tokenProgram: TOKEN_PROGRAM_ID,
  //   clock: anchor.web3.SYSVAR_CLOCK_PUBKEY,
  //   systemProgram: SystemProgram.programId,
  //   // rent: anchor.web3.SYSVAR_RENT_PUBKEY,
  // }

  it('Create State initialize', async () => {

    const authority = provider.wallet.publicKey;
    await program.rpc.initialize({
      accounts: {
        state: anchor.web3.Keypair.generate().publicKey,
        authority: provider.wallet.publicKey,
        tokenProgram: TOKEN_PROGRAM_ID,
        clock: anchor.web3.SYSVAR_CLOCK_PUBKEY,
        systemProgram: SystemProgram.programId,
      },
    })
    
    const stateInfo = await program.account.stateAccount.fetch(state.publicKey)
    assert.ok(
      stateInfo.authority.toString() === provider.wallet.publicKey.toString()
    )
  });
});
