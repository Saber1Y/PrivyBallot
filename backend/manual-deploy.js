const { ethers } = require("hardhat");

async function main() {
  console.log("🚀 Deploying ConfidentialVotingDAO...");

  // Get the contract factory
  const ConfidentialVotingDAO = await ethers.getContractFactory("ConfidentialVotingDAO");

  // Deploy the contract
  const contract = await ConfidentialVotingDAO.deploy();
  await contract.waitForDeployment();

  const address = await contract.getAddress();
  console.log("✅ ConfidentialVotingDAO deployed to:", address);

  // Test the contract by calling a simple method
  try {
    const nextId = await contract.nextProposalId();
    console.log("📊 Next proposal ID:", nextId.toString());
    console.log("✅ Contract is working!");
  } catch (error) {
    console.error("❌ Error testing contract:", error.message);
  }

  return address;
}

main()
  .then((address) => {
    console.log(`\n🎉 Deployment complete!`);
    console.log(`Contract address: ${address}`);
    console.log(`\nUpdate your frontend .env.local file:`);
    console.log(`NEXT_PUBLIC_VOTING_ADDRESS=${address}`);
  })
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });
