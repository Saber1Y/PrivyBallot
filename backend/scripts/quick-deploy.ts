import hre, { ethers } from "hardhat";

async function main() {
  console.log("Quick deployment of ConfidentialVotingDAO...");

  const [deployer] = await ethers.getSigners();
  console.log("Deploying with account:", deployer.address);

  const ConfidentialVotingDAO = await ethers.getContractFactory("ConfidentialVotingDAO");
  const contract = await ConfidentialVotingDAO.deploy();

  console.log("Contract deployed to:", await contract.getAddress());
  console.log("Transaction hash:", contract.deploymentTransaction()?.hash);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
