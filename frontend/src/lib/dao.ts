// Contract interaction helpers with IPFS metadata support
import { ethers, BrowserProvider, Contract } from "ethers";
import { VOTING_DAO_ABI, CONTRACT_ADDRESS } from "./contracts";

export interface ProposalMetadata {
  title: string;
  description: string;
  options: string[]; // e.g., ["Yes", "No"]
  creator: string;
  createdAt: number;
  tags?: string[];
}

export type PublicProposal = {
  id: number;
  ipfsHash: string;
  metadata: ProposalMetadata | null;
  creator: string;
  deadline: number; // ms
  revealed: boolean;
  decryptionPending: boolean;
  yes: number;
  no: number;
  hasVoted?: boolean;
};

// Mock IPFS for development
class MockIPFS {
  private store = new Map<string, ProposalMetadata>();

  async upload(metadata: ProposalMetadata): Promise<string> {
    const hash = `Qm${Math.random().toString(36).substring(2, 15)}`;
    this.store.set(hash, metadata);

    // Persist to localStorage for demo persistence
    if (typeof window !== "undefined") {
      const stored = JSON.parse(localStorage.getItem("ipfs-proposals") || "{}");
      stored[hash] = metadata;
      localStorage.setItem("ipfs-proposals", JSON.stringify(stored));
    }

    return hash;
  }

  async fetch(hash: string): Promise<ProposalMetadata | null> {
    // Try memory first
    if (this.store.has(hash)) {
      return this.store.get(hash)!;
    }

    // Try localStorage
    if (typeof window !== "undefined") {
      const stored = JSON.parse(localStorage.getItem("ipfs-proposals") || "{}");
      if (stored[hash]) {
        this.store.set(hash, stored[hash]);
        return stored[hash];
      }
    }

    return null;
  }
}

const mockIPFS = new MockIPFS();

// Contract helper functions
function getContract(provider: BrowserProvider): Contract {
  if (!CONTRACT_ADDRESS) {
    throw new Error("NEXT_PUBLIC_VOTING_ADDRESS not set in environment");
  }
  return new ethers.Contract(CONTRACT_ADDRESS, VOTING_DAO_ABI, provider);
}

function stringToBytes32(str: string): string {
  // Convert IPFS hash to bytes32 (simplified for demo)
  const bytes = ethers.toUtf8Bytes(str.padEnd(32, "\0").slice(0, 32));
  return ethers.hexlify(bytes);
}

function bytes32ToString(bytes32: string): string {
  try {
    return ethers.toUtf8String(bytes32).replace(/\0+$/, "");
  } catch {
    return bytes32; // Return raw hex if not valid UTF-8
  }
}

// Real contract integration
export async function fetchProposals(
  account?: string
): Promise<PublicProposal[]> {
  if (!CONTRACT_ADDRESS || typeof window === "undefined" || !window.ethereum) {
    // Fallback to mock data when contract not configured
    return getMockProposals(account);
  }

  try {
    const provider = new ethers.BrowserProvider(window.ethereum);

    // Check network first
    const network = await provider.getNetwork();
    console.log("Connected network:", {
      name: network.name,
      chainId: Number(network.chainId),
    });

    // Check if we're on the expected network (localhost)
    const expectedChainId = 31337; // localhost
    if (Number(network.chainId) !== expectedChainId) {
      console.warn(
        `⚠️  Wrong network! Connected to ${network.name} (chainId: ${network.chainId}), but contract is deployed on localhost (chainId: ${expectedChainId})`
      );
      console.log("Please switch to localhost network in your wallet");
      console.log("Network details:");
      console.log("- Network Name: Localhost");
      console.log("- RPC URL: http://localhost:8545");
      console.log("- Chain ID: 31337");
      console.log("- Currency Symbol: ETH");
      console.log("Falling back to mock data");
      return getMockProposals(account);
    }

    // Check if contract exists at the address
    const code = await provider.getCode(CONTRACT_ADDRESS);
    console.log("Contract code length:", code.length);

    if (code === "0x") {
      console.error(
        `No contract found at ${CONTRACT_ADDRESS} on network ${network.name} (chainId: ${network.chainId})`
      );
      console.log("Falling back to mock data");
      return getMockProposals(account);
    }

    const contract = getContract(provider);

    const total = Number(await contract.nextProposalId());
    console.log(`Found ${total} proposals on-chain`);

    if (total === 0) {
      return [];
    }

    const proposals = await Promise.all(
      [...Array(total).keys()].map(async (id) => {
        try {
          const [
            ipfsHash,
            creator,
            deadline,
            revealed,
            decryptionPending,
            yes,
            no,
          ] = await contract.getProposalPublic(id);

          const voted = account ? await contract.hasVoted(id, account) : false;

          // Convert bytes32 back to IPFS hash
          const hashString = bytes32ToString(ipfsHash);

          // Fetch metadata from IPFS
          let metadata: ProposalMetadata | null = null;
          try {
            metadata = await mockIPFS.fetch(hashString);
          } catch (error) {
            console.warn(`Failed to fetch metadata for proposal ${id}:`, error);
          }

          return {
            id,
            ipfsHash: hashString,
            metadata,
            creator,
            deadline: Number(deadline) * 1000, // Convert to ms
            revealed: Boolean(revealed),
            decryptionPending: Boolean(decryptionPending),
            yes: Number(yes),
            no: Number(no),
            hasVoted: Boolean(voted),
          } as PublicProposal;
        } catch (error) {
          console.error(`Failed to fetch proposal ${id}:`, error);
          return null;
        }
      })
    );

    // Filter out failed proposals and sort newest first
    return proposals
      .filter(Boolean)
      .sort((a, b) => b!.id - a!.id) as PublicProposal[];
  } catch (error) {
    console.error("Failed to fetch proposals from contract:", error);
    console.error("Error details:", {
      message: error instanceof Error ? error.message : "Unknown error",
      code: (error as { code?: string })?.code,
      action: (error as { action?: string })?.action,
      reason: (error as { reason?: string })?.reason,
    });
    // Fallback to mock data
    return getMockProposals(account);
  }
}

// Mock data fallback
function getMockProposals(account?: string): PublicProposal[] {
  const mockProposals: PublicProposal[] = [
    {
      id: 0,
      ipfsHash: "QmExample1",
      metadata: {
        title: "Should we adopt confidential voting for all governance?",
        description:
          "This proposal suggests implementing FHE-based voting for all future governance decisions.",
        options: ["Yes", "No"],
        creator: "0x1234...",
        createdAt: Date.now() - 86400000,
        tags: ["governance", "privacy"],
      },
      creator: "0x1234567890123456789012345678901234567890",
      deadline: Date.now() + 45 * 60 * 1000,
      revealed: false,
      decryptionPending: false,
      yes: 0,
      no: 0,
      hasVoted: account ? false : undefined,
    },
    {
      id: 1,
      ipfsHash: "QmExample2",
      metadata: {
        title: "Fund ZK research sprint Q4?",
        description:
          "Allocate 50,000 USDC for zero-knowledge research initiatives.",
        options: ["Yes", "No"],
        creator: "0x5678...",
        createdAt: Date.now() - 172800000,
        tags: ["funding", "research"],
      },
      creator: "0x5678901234567890123456789012345678901234",
      deadline: Date.now() - 5 * 60 * 1000,
      revealed: true,
      decryptionPending: false,
      yes: 12,
      no: 7,
      hasVoted: account ? true : undefined,
    },
  ];

  return mockProposals;
}

export async function createProposalTx(
  metadata: ProposalMetadata,
  durationSeconds: number
) {
  // Upload metadata to IPFS first
  const ipfsHash = await mockIPFS.upload(metadata);

  if (!CONTRACT_ADDRESS || typeof window === "undefined" || !window.ethereum) {
    console.log("Mock proposal created:", { ipfsHash, durationSeconds });
    return { ipfsHash };
  }

  try {
    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    const contract = new ethers.Contract(
      CONTRACT_ADDRESS,
      VOTING_DAO_ABI,
      signer
    );

    console.log("Creating proposal on-chain with IPFS hash:", ipfsHash);
    const bytes32Hash = stringToBytes32(ipfsHash);

    const tx = await contract.createProposal(bytes32Hash, durationSeconds);
    console.log("Transaction sent:", tx.hash);

    const receipt = await tx.wait();
    console.log("Transaction confirmed:", receipt.hash);

    return { ipfsHash, txHash: receipt.hash };
  } catch (error) {
    console.error("Failed to create proposal on-chain:", error);
    throw error;
  }
}

export async function voteTx(proposalId: number, choice: boolean) {
  // TODO: Implement FHE voting in phase 2 - requires fhevmjs integration
  console.log("Mock vote:", { proposalId, choice });
  throw new Error("FHE voting not yet implemented - see docs/ui-flow.md");
}

export async function requestRevealTx(proposalId: number) {
  if (!CONTRACT_ADDRESS || typeof window === "undefined" || !window.ethereum) {
    console.log("Mock reveal requested:", { proposalId });
    return {};
  }

  try {
    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    const contract = new ethers.Contract(
      CONTRACT_ADDRESS,
      VOTING_DAO_ABI,
      signer
    );

    const tx = await contract.requestReveal(proposalId);
    const receipt = await tx.wait();

    return { txHash: receipt.hash };
  } catch (error) {
    console.error("Failed to request reveal:", error);
    throw error;
  }
}
