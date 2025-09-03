#!/usr/bin/env node

// Script to check proposal reveal status
const { ethers } = require("ethers");

const CONTRACT_ADDRESS = "0xF177Bfc7e806515eB4a966978e1c7ed498E16753";
const { abi: VOTING_DAO_ABI } = require("./artifacts/contracts/FHEVoting.sol/ConfidentialVotingDAO.json");
const RPC_URL = "http://127.0.0.1:8545";

async function checkProposalStatus() {
  console.log("🔍 Checking proposal reveal status...");

  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const privateKey = "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";
  const wallet = new ethers.Wallet(privateKey, provider);
  const contract = new ethers.Contract(CONTRACT_ADDRESS, VOTING_DAO_ABI, wallet);

  try {
    const total = Number(await contract.nextProposalId());
    console.log(`Total proposals: ${total}`);

    for (let id = 0; id < total; id++) {
      console.log(`\n📋 Proposal ${id}:`);

      // Get proposal details
      const proposal = await contract.proposals(id);
      console.log("- IPFS hash:", proposal.ipfsHash);
      console.log("- Creator:", proposal.creator);
      console.log("- Deadline:", new Date(Number(proposal.deadline) * 1000).toISOString());
      console.log("- Revealed:", proposal.revealed);
      console.log("- Decryption pending:", proposal.decryptionPending);
      console.log("- Yes votes:", proposal.yes.toString());
      console.log("- No votes:", proposal.no.toString());

      // Also check via getProposalPublic
      const [ipfsHash, creator, deadline, revealed, decryptionPending, yes, no] = await contract.getProposalPublic(id);
      console.log("\nVia getProposalPublic:");
      console.log("- Revealed:", revealed);
      console.log("- Decryption pending:", decryptionPending);
      console.log("- Yes votes:", yes.toString());
      console.log("- No votes:", no.toString());
    }
  } catch (error) {
    console.error("❌ Error checking proposals:", error);
  }
}

checkProposalStatus()
  .then(() => {
    console.log("✅ Status check completed");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Status check failed:", error);
    process.exit(1);
  });
