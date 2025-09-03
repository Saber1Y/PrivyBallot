#!/usr/bin/env node

// Complete test script: create proposal, vote, and test reveal
const { ethers } = require("ethers");

// Contract ABI - using the correct functions based on our contract
const VOTING_DAO_ABI = [
  {
    type: "function",
    name: "createProposal",
    inputs: [
      { name: "ipfsHash", type: "bytes32" },
      { name: "durationSeconds", type: "uint64" },
    ],
    outputs: [{ name: "id", type: "uint256" }],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "vote",
    inputs: [
      { name: "id", type: "uint256" },
      { name: "encChoice", type: "bytes32" },
      { name: "inputProof", type: "bytes" },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "requestReveal",
    inputs: [{ name: "id", type: "uint256" }],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "nextProposalId",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getProposalPublic",
    inputs: [{ name: "id", type: "uint256" }],
    outputs: [
      { name: "ipfsHash", type: "bytes32" },
      { name: "creator", type: "address" },
      { name: "deadline", type: "uint64" },
      { name: "revealed", type: "bool" },
      { name: "decryptionPending", type: "bool" },
      { name: "yes", type: "uint128" },
      { name: "no", type: "uint128" },
    ],
    stateMutability: "view",
  },
  {
    type: "event",
    name: "ProposalCreated",
    inputs: [
      { indexed: true, name: "id", type: "uint256" },
      { indexed: true, name: "creator", type: "address" },
      { name: "ipfsHash", type: "bytes32" },
      { name: "deadline", type: "uint64" },
    ],
  },
  {
    type: "event",
    name: "VoteCast",
    inputs: [
      { indexed: true, name: "id", type: "uint256" },
      { indexed: true, name: "voter", type: "address" },
    ],
  },
  {
    type: "event",
    name: "Revealed",
    inputs: [
      { indexed: true, name: "id", type: "uint256" },
      { name: "yes", type: "uint128" },
      { name: "no", type: "uint128" },
    ],
  },
];

const CONTRACT_ADDRESS = "0xF177Bfc7e806515eB4a966978e1c7ed498E16753";
const RPC_URL = "http://127.0.0.1:8545";

async function main() {
  console.log("🚀 Testing complete proposal lifecycle with reveal...");

  // Connect to local Hardhat node
  const provider = new ethers.JsonRpcProvider(RPC_URL);

  // Get the first account from Hardhat
  const [signer] = await provider.listAccounts();
  const wallet = signer;

  const contract = new ethers.Contract(CONTRACT_ADDRESS, VOTING_DAO_ABI, wallet);

  console.log("📊 Current proposal count:");
  const proposalCount = await contract.nextProposalId();
  console.log("Proposal count:", proposalCount.toString());

  // Step 1: Create a test proposal with short duration for quick testing
  console.log("\n📝 Step 1: Creating new test proposal...");
  const testMetadataHash = "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef";
  const durationSeconds = 10; // 10 seconds for quick testing

  try {
    const createTx = await contract.createProposal(testMetadataHash, durationSeconds);
    console.log("Transaction sent:", createTx.hash);
    const createReceipt = await createTx.wait();
    console.log("✅ Proposal created successfully!");

    // Get proposal ID - it should be the current count since we just created one
    const newProposalCount = await contract.nextProposalId();
    const proposalId = newProposalCount - BigInt(1); // Latest proposal ID
    console.log("📋 Proposal ID:", proposalId.toString());

    // Step 2: Vote on the proposal
    console.log("\n🗳️ Step 2: Submitting votes...");

    // Generate proper mock encrypted data with vote choice encoding
    const encryptedChoiceYes = "0x" + "a".repeat(64); // 32 bytes - voting YES
    const encryptedChoiceNo = "0x" + "b".repeat(64); // 32 bytes - voting NO

    // InputProof with vote choice markers (like the frontend sends)
    const inputProofYes = "0xaaaa" + "c".repeat(124); // YES vote marker + random data
    const inputProofNo = "0xbbbb" + "c".repeat(124); // NO vote marker + random data

    // Cast a YES vote
    console.log("Voting YES...");
    const voteYesTx = await contract.vote(proposalId, encryptedChoiceYes, inputProofYes);
    await voteYesTx.wait();
    console.log("✅ YES vote submitted!");

    // Get another signer for NO vote
    const accounts = await provider.listAccounts();
    const wallet2 = accounts[1];
    const contract2 = new ethers.Contract(CONTRACT_ADDRESS, VOTING_DAO_ABI, wallet2);

    console.log("Voting NO...");
    const voteNoTx = await contract2.vote(proposalId, encryptedChoiceNo, inputProofNo);
    await voteNoTx.wait();
    console.log("✅ NO vote submitted!");

    // Step 3: Wait for voting period to end
    console.log("\n⏰ Step 3: Waiting for voting period to end...");
    console.log("Waiting 12 seconds for proposal to expire...");
    await new Promise((resolve) => setTimeout(resolve, 12000));

    // Step 4: Request reveal
    console.log("\n🔍 Step 4: Requesting reveal...");

    // First check the current state before requesting reveal
    let preRevealData = await contract.getProposalPublic(proposalId);
    console.log("Before reveal request:");
    console.log("- Revealed:", preRevealData.revealed);
    console.log("- Decryption pending:", preRevealData.decryptionPending);

    if (preRevealData.revealed) {
      console.log("✅ Proposal already revealed! (immediate localhost reveal)");
    } else {
      const revealTx = await contract.requestReveal(proposalId);
      console.log("Reveal transaction sent:", revealTx.hash);
      const revealReceipt = await revealTx.wait();
      console.log("✅ Reveal requested!");
    }

    // Check if reveal was successful (for localhost, it should be immediate)
    console.log("\n📊 Step 5: Checking reveal results...");
    const finalProposalData = await contract.getProposalPublic(proposalId);

    console.log("📋 Final proposal state:");
    console.log("- IPFS hash:", finalProposalData.ipfsHash);
    console.log("- Creator:", finalProposalData.creator);
    console.log("- Deadline:", new Date(Number(finalProposalData.deadline) * 1000).toISOString());
    console.log("- Revealed:", finalProposalData.revealed);
    console.log("- Decryption pending:", finalProposalData.decryptionPending);
    console.log("- YES votes:", finalProposalData.yes.toString());
    console.log("- NO votes:", finalProposalData.no.toString());

    if (finalProposalData.revealed) {
      console.log("\n🎉 SUCCESS: Reveal worked! Results are available.");
      console.log(`Winner: ${finalProposalData.yes > finalProposalData.no ? "YES" : "NO"}`);
    } else {
      console.log("\n❌ Reveal is still pending or failed.");
    }
  } catch (error) {
    console.error("❌ Error:", error.message);
    if (error.data) {
      console.error("Error data:", error.data);
    }
  }
}

main().catch(console.error);
