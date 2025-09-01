import { DeployFunction } from "hardhat-deploy/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployer } = await hre.getNamedAccounts();
  const { deploy } = hre.deployments;

  // Deploy ConfidentialVotingDAO
  const deployedVotingDAO = await deploy("ConfidentialVotingDAO", {
    from: deployer,
    log: true,
  });

  console.log(`ConfidentialVotingDAO contract: `, deployedVotingDAO.address);
};
export default func;
func.id = "deploy_votingDAO"; // id required to prevent reexecution
func.tags = ["ConfidentialVotingDAO"];
