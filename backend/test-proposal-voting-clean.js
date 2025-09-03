#!/usr/bin/env node

// Test script to create a proposal and test voting functionality
const { ethers } = require("ethers");

// Import the actual ABI from compiled artifacts
const CONTRACT_ADDRESS = "0xF177Bfc7e806515eB4a966978e1c7ed498E16753";
const { abi: VOTING_DAO_ABI } = require("./artifacts/contracts/FHEVoting.sol/ConfidentialVotingDAO.json");

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
    const inputProof = "0x" + "aaaa" + "b".repeat(60); // YES vote pattern

    const voteTx = await contract.vote(proposalId, encryptedChoice, inputProof);
    console.log("Vote transaction sent:", voteTx.hash);
    await voteTx.wait();
    console.log("✅ Vote submitted successfully!");

    // Check if user has voted
    const hasVoted = await contract.hasVoted(proposalId, wallet.address);
    console.log("Has voted:", hasVoted);

    console.log("\n🎉 All tests completed successfully!");
  } catch (error) {
    console.error("❌ Error during testing:", error);
    console.error("Error details:");
    console.error({
      message: error.message,
      code: error.code,
      data: error.data,
      reason: error.reason,
      transaction: error.transaction,
    });
  }
}

main()
  .then(() => {
    console.log("✅ Test completed");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Test failed:", error);
    process.exit(1);
  });
