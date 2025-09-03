// Import the ABI from the compiled contract artifacts
export const VOTING_DAO_ABI = [
  {
    inputs: [
      {
        internalType: "bytes32",
        name: "ipfsHash",
        type: "bytes32",
      },
      {
        internalType: "uint64",
        name: "durationSeconds",
        type: "uint64",
      },
    ],
    name: "createProposal",
    outputs: [
      {
        internalType: "uint256",
        name: "id",
        type: "uint256",
      },
    ],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "id",
        type: "uint256",
      },
    ],
    name: "getProposalPublic",
    outputs: [
      {
        internalType: "bytes32",
        name: "ipfsHash",
        type: "bytes32",
      },
      {
        internalType: "address",
        name: "creator",
        type: "address",
      },
      {
        internalType: "uint64",
        name: "deadline",
        type: "uint64",
      },
      {
        internalType: "bool",
        name: "revealed",
        type: "bool",
      },
      {
        internalType: "bool",
        name: "decryptionPending",
        type: "bool",
      },
      {
        internalType: "uint128",
        name: "yes",
        type: "uint128",
      },
      {
        internalType: "uint128",
        name: "no",
        type: "uint128",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
      {
        internalType: "address",
        name: "",
        type: "address",
      },
    ],
    name: "hasVoted",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "nextProposalId",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "id",
        type: "uint256",
      },
    ],
    name: "proposalExists",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "uint256",
        name: "id",
        type: "uint256",
      },
      {
        indexed: true,
        internalType: "address",
        name: "creator",
        type: "address",
      },
      {
        indexed: false,
        internalType: "bytes32",
        name: "ipfsHash",
        type: "bytes32",
      },
      {
        indexed: false,
        internalType: "uint64",
        name: "deadline",
        type: "uint64",
      },
    ],
    name: "ProposalCreated",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "uint256",
        name: "id",
        type: "uint256",
      },
      {
        indexed: true,
        internalType: "address",
        name: "voter",
        type: "address",
      },
    ],
    name: "VoteCast",
    type: "event",
  },
] as const;

export const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_VOTING_ADDRESS;
