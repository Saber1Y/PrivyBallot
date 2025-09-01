export const VOTING_DAO_ADDRESS = '0xF177Bfc7e806515eB4a966978e1c7ed498E16753'; // Update with your deployed address

export const VOTING_DAO_ABI = [
  // Events
  "event ProposalCreated(uint256 indexed id, string title, uint64 deadline)",
  "event VoteCast(uint256 indexed id, address indexed voter)",
  "event RevealRequested(uint256 indexed id, uint256 requestId)",
  "event Revealed(uint256 indexed id, uint128 yes, uint128 no)",
  
  // Read functions
  "function nextProposalId() view returns (uint256)",
  "function proposals(uint256) view returns (string title, uint64 deadline, uint128 yes, uint128 no, bool revealed, bool decryptionPending)",
  "function hasVoted(uint256, address) view returns (bool)",
  
  // Write functions
  "function createProposal(string calldata title, uint64 durationSeconds) external returns (uint256 id)",
  "function vote(uint256 id, bytes32 encChoice, bytes calldata inputProof) external",
  "function requestReveal(uint256 id) external",
] as const;

export const NETWORK_CONFIG = {
  hardhat: {
    chainId: 31337,
    name: 'Hardhat Local',
    rpcUrl: 'http://127.0.0.1:8545',
  },
  sepolia: {
    chainId: 11155111,
    name: 'Sepolia Testnet',
    rpcUrl: 'https://sepolia.infura.io/v3/YOUR_INFURA_KEY',
  },
};
