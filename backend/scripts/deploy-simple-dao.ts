const hre = require("hardhat");

async function main() {
  console.log("Deploying SimpleVotingDAO to Sepolia...");

  const SimpleVotingDAO = await hre.ethers.getContractFactory("SimpleVotingDAO");
  const dao = await SimpleVotingDAO.deploy();

  console.log("Waiting for deployment...");
  await dao.waitForDeployment();

  const address = await dao.getAddress();
  console.log("SimpleVotingDAO deployed to:", address);
  console.log("Transaction hash:", dao.deploymentTransaction()?.hash);

  // Verify deployment
  const nextId = await dao.nextProposalId();
  console.log("Next proposal ID:", nextId.toString());

  console.log("\n🔧 To use this contract:");
  console.log(`1. Update NEXT_PUBLIC_VOTING_ADDRESS in frontend/.env.local to: ${address}`);
  console.log("2. Update the contract type in the frontend to use simple voting");
  console.log("3. Restart the frontend dev server");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
