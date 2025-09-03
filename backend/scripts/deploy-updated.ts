import hre, { ethers } from "hardhat";

async function main() {
  console.log("Deploying ConfidentialVotingDAO with updated IPFS structure...");

  // Get the ContractFactory and Signers here.
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying contracts with the account:", deployer.address);
  console.log("Account balance:", hre.ethers.formatEther(await hre.ethers.provider.getBalance(deployer.address)));

  // Deploy the contract
  const ConfidentialVotingDAO = await hre.ethers.getContractFactory("ConfidentialVotingDAO");
  const votingDAO = await ConfidentialVotingDAO.deploy();

  await votingDAO.waitForDeployment();
  const address = await votingDAO.getAddress();

  console.log("ConfidentialVotingDAO deployed to:", address);

  // Test basic interface (skip FHE operations for hardhat network)
  console.log("Testing contract interface...");
  console.log("Next proposal ID:", await votingDAO.nextProposalId());

  console.log("\n=== Deployment Summary ===");
  console.log("Contract Address:", address);
  console.log("Network:", await hre.ethers.provider.getNetwork());
  console.log("Block Number:", await hre.ethers.provider.getBlockNumber());
  console.log("\n⚠️  FHE operations require Zama's FHEVM network.");
  console.log("✅ Contract deployed successfully with IPFS structure!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
