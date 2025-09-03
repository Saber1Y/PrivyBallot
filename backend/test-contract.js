const { ethers } = require("hardhat");

async function main() {
  // Get the deployed contract
  const contractAddress = "0xF177Bfc7e806515eB4a966978e1c7ed498E16753";
  const ConfidentialVotingDAO = await ethers.getContractFactory("ConfidentialVotingDAO");
  const contract = ConfidentialVotingDAO.attach(contractAddress);
  
  console.log("Contract attached at:", contractAddress);
  
  // Get signers
  const [deployer] = await ethers.getSigners();
  console.log("Deployer address:", deployer.address);
  
  try {
    // Test a simple read operation first
    const proposalCount = await contract.proposalCount();
    console.log("Current proposal count:", proposalCount.toString());
    
    // Test creating a proposal
    const testHash = ethers.utils.formatBytes32String("test-hash");
    const durationSeconds = 3600; // 1 hour
    
    console.log("Attempting to create proposal with hash:", testHash);
    
    const tx = await contract.createProposal(testHash, durationSeconds);
    console.log("Transaction hash:", tx.hash);
    
    const receipt = await tx.wait();
    console.log("Transaction confirmed in block:", receipt.blockNumber);
    console.log("Gas used:", receipt.gasUsed.toString());
    
  } catch (error) {
    console.error("Error:", error.message);
    if (error.data) {
      console.error("Error data:", error.data);
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
