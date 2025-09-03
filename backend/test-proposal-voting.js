#!/usr/bin/env node

// Test script to create a proposal and test voting functionality
const { ethers } = require("ethers");

// Contract ABI (simplified for testing)
const VOTING_DAO_ABI = [
  {
    type: "function",
    name: "createProposal",
    inputs: [
      { name: "metadataHash", type: "bytes32" },
      { name: "durationSeconds", type: "uint256" },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "vote",
    inputs: [
      { name: "proposalId", type: "uint256" },
      { name: "encChoice", type: "bytes32" },
      { name: "inputProof", type: "bytes" },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "getProposalCount",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "proposals",
    inputs: [{ name: "", type: "uint256" }],
    outputs: [
      { name: "metadataHash", type: "bytes32" },
      { name: "deadline", type: "uint256" },
      { name: "voteCount", type: "uint256" },
      { name: "revealed", type: "bool" },
    ],
    stateMutability: "view",
  },
];

const CONTRACT_ADDRESS = "0xF177Bfc7e806515eB4a966978e1c7ed498E16753";
const RPC_URL = "http://127.0.0.1:8545";

async function main() {
  console.log("🚀 Testing proposal creation and voting...");

  // Connect to local Hardhat node
  const provider = new ethers.JsonRpcProvider(RPC_URL);

  // Use first account from Hardhat
  const privateKey = "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";
  const wallet = new ethers.Wallet(privateKey, provider);

  const contract = new ethers.Contract(CONTRACT_ADDRESS, VOTING_DAO_ABI, wallet);

  console.log("📊 Current proposal count:");
  const proposalCount = await contract.nextProposalId();
  console.log("Proposal count:", proposalCount.toString());

  // Create a test proposal with a longer duration (1 week)
  console.log("\n📝 Creating new test proposal...");
  const testMetadataHash = "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef"; // 32 bytes
  const durationSeconds = 7 * 24 * 60 * 60; // 1 week

  try {
    const createTx = await contract.createProposal(testMetadataHash, durationSeconds);
    console.log("Transaction sent:", createTx.hash);
    await createTx.wait();
    console.log("✅ Proposal created successfully!");

    // Get new proposal count
    const newProposalCount = await contract.nextProposalId();
    console.log("New proposal count:", newProposalCount.toString());

    const proposalId = newProposalCount - BigInt(1); // Latest proposal ID

    // Get proposal details
    const proposal = await contract.proposals(proposalId);
    console.log("📋 Proposal details:");
    console.log("- IPFS hash:", proposal.ipfsHash);
    console.log("- Creator:", proposal.creator);
    console.log("- Deadline:", new Date(Number(proposal.deadline) * 1000).toISOString());
    console.log("- Revealed:", proposal.revealed);
    console.log("- Decryption pending:", proposal.decryptionPending);

    // Test voting
    console.log("\n🗳️ Testing vote submission...");

    // Generate proper mock encrypted data (32 bytes each)
    const encryptedChoice = "0x" + "a".repeat(64); // 32 bytes of 'a'
    const inputProof = "0x" + "b".repeat(128); // 64 bytes of 'b'

    console.log("Encrypted choice (bytes32):", encryptedChoice);
    console.log("Input proof length:", inputProof.length - 2, "hex chars");

    const voteTx = await contract.vote(proposalId, encryptedChoice, inputProof);
    console.log("Vote transaction sent:", voteTx.hash);
    await voteTx.wait();
    console.log("✅ Vote submitted successfully!");

    // Check updated proposal
    const updatedProposal = await contract.proposals(proposalId);
    console.log("📊 Updated proposal after vote:");
    console.log("- Yes count (encrypted):", updatedProposal.yesCt.toString());
    console.log("- No count (encrypted):", updatedProposal.noCt.toString());
  } catch (error) {
    console.error("❌ Error:", error.message);
    if (error.data) {
      console.error("Error data:", error.data);
    }
  }
}

main().catch(console.error);
