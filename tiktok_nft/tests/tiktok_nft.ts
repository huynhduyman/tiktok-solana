import { expect, assert } from 'chai';
import * as anchor from "@project-serum/anchor";
import { Program } from "@project-serum/anchor";
import { TiktokNft } from "../target/types/tiktok_nft";
import BN from 'bn.js';
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";


// const assert = require("assert");
const { SystemProgram, PublicKey } = anchor.web3;
const utf8 = anchor.utils.bytes.utf8;
import _ from 'lodash';
//const _ = require('lodash')

describe('tiktok_nft', () => {

  // Use a local provider.
  const provider = anchor.AnchorProvider.env();

  const defaultAccounts = {
    tokenProgram: TOKEN_PROGRAM_ID,
    clock: anchor.web3.SYSVAR_CLOCK_PUBKEY,
    systemProgram: SystemProgram.programId,
    // rent: anchor.web3.SYSVAR_RENT_PUBKEY,
  }

  // Configure the client to use the local cluster.
  anchor.setProvider(provider);
  const program = anchor.workspace.TiktokNft as Program<TiktokNft>;
  const _myAccount = anchor.web3.Keypair.generate();
  let creatorKey = provider.wallet.publicKey
  // let stateSigner = _myAccount.publicKey
  let stateSigner
  let videoSigner

  it('Create State', async () => {
    [stateSigner] = await anchor.web3.PublicKey.findProgramAddress(
      [utf8.encode('state')],
      program.programId,
    )

    console.log(stateSigner)

    try {
      const stateInfo = await program.account.stateAccount.fetch(stateSigner)
    } catch {
      await program.rpc.createState({
        accounts: {
          state: stateSigner,
          authority: creatorKey,
          ...defaultAccounts,
        },
      })

      const stateInfo = await program.account.stateAccount.fetch(stateSigner)
      assert(
        stateInfo.authority.toString() === creatorKey.toString(),
        'State Creator is Invalid',
      )
    }
  })

  it("Create User", async () => {
    // const myAccount = _myAccount
    // const stateInfo = await program.account.stateAccount.fetch(myAccount.publicKey);
    // console.log(stateInfo.userName);

    let [userSigner] = await anchor.web3.PublicKey.findProgramAddress(
      [utf8.encode('state')],
      program.programId,
    )

    console.log(userSigner)

    try {
      const stateInfo = await program.account.stateAccount.fetch(userSigner)
    } catch {
      await program.rpc.createUser("username", "https://img.first.com", {
        accounts: {
          user: userSigner,
          authority: creatorKey,
          ...defaultAccounts
        },
      })

      // Fetch the newly created account from the cluster.
      const userInfo = await program.account.userAccount.fetch(userSigner);

      // Check it's state was initialized.
      assert.ok(userInfo.userWalletAddress.equals(provider.wallet.publicKey))
    }

  });

  it("Create First Video", async () => {
    const stateInfo = await program.account.stateAccount.fetch(stateSigner);
    console.log(stateInfo.videoCount);

    if (stateInfo.videoCount.toNumber() > 0) {
      return;
    }

    [videoSigner] = await anchor.web3.PublicKey.findProgramAddress(
      [utf8.encode('video'), stateInfo.videoCount.toBuffer("be", 8)],
      program.programId
    );

    try{
      const videoInfo = await program.account.videoAccount.fetch(videoSigner);
      console.log(videoInfo);
    }
    catch{
      await program.rpc.createVideo("this is first video", "dummy_url","first", "https://first.com", {
        accounts: {
          state: stateSigner,
          video: videoSigner,
          authority: creatorKey,
          ...defaultAccounts
        },
      })

      const videoInfo = await program.account.videoAccount.fetch(videoSigner);
      console.log(videoInfo);
      assert(videoInfo.authority.toString() === creatorKey.toString(), "Video Creator is Invalid");
    }
  });

  it("Fetch All Videos",async () => {
    try{
      const videoInfo = await program.account.videoAccount.all();
      console.log(videoInfo);
    }
    catch (e) {
      console.log(e);
    }
  });

  it("Create Second Video", async () => {
    const stateInfo = await program.account.stateAccount.fetch(stateSigner);
    console.log(stateInfo.videoCount);

    if (stateInfo.videoCount.toNumber() > 1) {
      return;
    }

    [videoSigner] = await anchor.web3.PublicKey.findProgramAddress(
      [utf8.encode('video'), stateInfo.videoCount.toBuffer("be", 8)],
      program.programId
    );

    try{
      const videoInfo = await program.account.videoAccount.fetch(videoSigner);
      console.log(videoInfo);
    }
    catch{
      await program.rpc.createVideo("this is second video", "dummy_url", "second", "https://second.com", {
        accounts: {
          state: stateSigner,
          video: videoSigner,
          authority: creatorKey,
          ...defaultAccounts
        },
      })

      const videoInfo = await program.account.videoAccount.fetch(videoSigner);
      console.log(videoInfo);
      assert(videoInfo.authority.toString() === creatorKey.toString(), "Video Creator is Invalid");
    }
  });

  it("Create Comment to first", async () => {
    [videoSigner] = await anchor.web3.PublicKey.findProgramAddress(
      [utf8.encode('video'), new BN(0).toBuffer("be", 8)],
      program.programId
    );

    try{
      const videoInfo = await program.account.videoAccount.fetch(videoSigner);
      console.log(videoInfo);

      let [commentSigner] = await anchor.web3.PublicKey.findProgramAddress(
        [utf8.encode('comment'), videoInfo.index.toBuffer("be", 8), videoInfo.commentCount.toBuffer("be", 8)],
        program.programId
      );

      console.log(commentSigner);

      await program.rpc.createComment("this is great", "second", "https://second.com", {
        accounts: {
          video: videoSigner,
          comment: commentSigner,
          authority: creatorKey,
          ...defaultAccounts
        },
      });

      const commentInfo = await program.account.commentAccount.fetch(commentSigner);
      console.log(commentInfo);
      assert(videoInfo.authority.toString() === creatorKey.toString(), "Comment Creator is Invalid");
    }
    catch{
      assert(false, "Comment create failed")
    }
  });

  it("Fetch All Comments",async () => {
    try{
      const commentList = await program.account.commentAccount.all();
      console.log(commentList);
    }
    catch (e) {
      console.log(e);
    }
  });

  it("Videos can be liked correctly", async () => {
    const stateInfo = await program.account.stateAccount.fetch(stateSigner);
    console.log(stateInfo.videoCount);

    if (stateInfo.videoCount.toNumber() > 0) {
      return;
    }

    [videoSigner] = await anchor.web3.PublicKey.findProgramAddress(
      [utf8.encode('video'), stateInfo.videoCount.toBuffer("be", 8)],
      program.programId
    );

    try{
      const videoInfo = await program.account.videoAccount.fetch(videoSigner);
      console.log(videoInfo);
    }
    catch{
      await program.rpc.createVideo("this is first video", "dummy_url","first", "https://first.com", {
        accounts: {
          state: stateSigner,
          video: videoSigner,
          authority: creatorKey,
          ...defaultAccounts
        },
      })

      let videoInfo = await program.account.videoAccount.fetch(videoSigner);
      console.log(videoInfo);
      assert(videoInfo.authority.toString() === creatorKey.toString(), "Video Creator is Invalid");
      expect(videoInfo.likes).to.equal(0);

      await program.rpc.likeVideo({
        accounts: {
          video: videoSigner,          
          authority: creatorKey,
          ...defaultAccounts
        },
      });

      videoInfo = await program.account.videoAccount.fetch(videoSigner);
      expect(videoInfo.likes).to.equal(1);
      expect(videoInfo.peopleWhoLiked[0].toString()).to.equal(creatorKey.toString());

      await program.rpc.likeVideo({
        accounts: {
          video: videoSigner,          
          authority: creatorKey,
          ...defaultAccounts
        },
      });

      try {
        await program.rpc.likeVideo({
          accounts: {
            video: videoSigner,          
            authority: creatorKey,
            ...defaultAccounts
          },
        });
        assert.ok(false);
      } catch (error) {
        console.log('error ', error.toString());
        assert.equal(error.toString().toString(), 'User has already liked the tweet');
      }
      

    }
  });


  it('should not allow writting an empty description', async () => {
    const stateInfo = await program.account.stateAccount.fetch(stateSigner);
    console.log(stateInfo.videoCount);

    if (stateInfo.videoCount.toNumber() > 0) {
      return;
    }

    [videoSigner] = await anchor.web3.PublicKey.findProgramAddress(
      [utf8.encode('video'), stateInfo.videoCount.toBuffer("be", 8)],
      program.programId
    );

    try{

      await program.rpc.createVideo("", "dummy_url","first", "https://first.com", {
        accounts: {
          state: stateSigner,
          video: videoSigner,
          authority: creatorKey,
          ...defaultAccounts
        },
      })
      assert.ok(false);
    } catch (error) {
      assert.equal(error.toString().toString(), 'Video cannot be created updated, missing data');
    }
  });

  ////////////////////////////////////////////////////

  // it("Create User", async () => {
  //   const myAccount = _myAccount
  //   const stateInfo = await program.account.stateAccount.fetch(myAccount.publicKey);
  //   console.log(stateInfo.userName);

  
  //   // const authorityKeypair = anchor.web3.Keypair.generate();
  //   await program.methods
  //   .createUser("Man Huynh", "https://img.first.com")
  //   .accounts({
  //     user: myAccount.publicKey,
  //     authority: creatorKey,
  //     ...defaultAccounts
  //   })
  //   .signers([myAccount])
  //   .rpc();

  //   // Fetch the newly created account from the cluster.
  //   const userInfo = await program.account.userAccount.fetch(myAccount.publicKey);

  //   // Check it's state was initialized.
  //   assert.ok(userInfo.userWalletAddress.equals(provider.wallet.publicKey))

  //   // const videoInfo = await program.account.videoAccount.fetch(videoSigner);
  //   // console.log(videoInfo);
  //   // assert(videoInfo.authority.toString() === creatorKey.toString(), "Video Creator is Invalid");
   
  // });

  

  // it("Create First Video", async () => {
  //   const myAccount = _myAccount
  //   const stateInfo = await program.account.stateAccount.fetch(myAccount.publicKey);
  //   console.log(stateInfo.videoCount);

  //   if (stateInfo.videoCount.toNumber() > 0) {
  //     return;
  //   }

  //   [videoSigner] = await anchor.web3.PublicKey.findProgramAddress(
  //     [utf8.encode('video'), stateInfo.videoCount.toBuffer("be", 8)],
  //     program.programId
  //   );

  //   // const videoInfo = await program.account.videoAccount.fetch(videoSigner);
  //   // console.log(tx);

  
  //   // const authorityKeypair = anchor.web3.Keypair.generate();
  //   await program.methods
  //   .createVideo("this is first video", "dummy_url","first", "https://first.com")
  //   .accounts({
  //     state: myAccount.publicKey,
  //     video: videoSigner,
  //     authority: creatorKey,
  //     ...defaultAccounts
  //   })
  //   .signers([myAccount])
  //   .rpc();
   

  //   const videoInfo = await program.account.videoAccount.fetch(videoSigner);
  //   console.log(videoInfo);
  //   assert(videoInfo.authority.toString() === creatorKey.toString(), "Video Creator is Invalid");
  
  // });
 

  // it("Creates and initializes an account in a single atomic transaction (simplified)", async () => {
  //   // const program = anchor.workspace.TiktokNft;
    

  //   // Create the new account and initialize it with the program.
  //   // #region code-simplified
  //   // await program.methods.initialize(new anchor.BN(1234), {
  //   //   accounts: {
  //   //     myAccount: myAccount.publicKey,
  //   //     user: provider.wallet.publicKey,
  //   //     systemProgram: SystemProgram.programId,
  //   //   },
  //   //   signers: [myAccount],
  //   // });
  //   await program.methods
  //     .initialize(new anchor.BN(1234),provider.wallet.publicKey)
  //     .accounts({
  //       myAccount: myAccount.publicKey,
  //       user: provider.wallet.publicKey,
  //       systemProgram: SystemProgram.programId,
  //     })
  //     .signers([myAccount])
  //     .rpc();
  //   // #endregion code-simplified

  //   // Fetch the newly created account from the cluster.
  //   const account = await program.account.myAccount.fetch(myAccount.publicKey);

  //   // Check it's state was initialized.
  //   assert.ok(account.data.eq(new anchor.BN(1234)));
  //   assert.ok(account.user.equals(provider.wallet.publicKey))
    
  // });

  // it("Updates a previously created account", async () => {

  //   // #region update-test

  //   // The program to execute.
  //   const program = anchor.workspace.TiktokNft;

  //   // Invoke the update rpc.
  //   await program.rpc.update(new anchor.BN(4321), {
  //     accounts: {
  //       myAccount: myAccount.publicKey,
  //     },
  //   });

  //   // Fetch the newly updated account.
  //   const account = await program.account.myAccount.fetch(myAccount.publicKey);

  //   // Check it's state was mutated.
  //   assert.ok(account.data.eq(new anchor.BN(4321)));

  //   // #endregion update-test
  // });

})
