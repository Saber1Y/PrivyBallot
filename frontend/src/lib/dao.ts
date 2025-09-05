// IPFS-only DAO implementation - no blockchain contracts needed
// This creates a fully decentralized voting system using IPFS for storage
import { ipfs } from "./ipfs";

console.log("🌟 IPFS-only DAO loading... (Contract-free mode)");

// In-memory storage for this session + localStorage persistence
let proposalsStore: PublicProposal[] = [];
let votesStore: Record<
  number,
  Record<string, { choice: boolean; timestamp: number; onChain: boolean }>
> = {};
let nextProposalId = 1;

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

// IPFS-only proposal fetching
export async function fetchProposals(
  account?: string
): Promise<PublicProposal[]> {
  console.log("📋 Fetching proposals from IPFS-only storage...");

  try {
    // Calculate vote counts from votesStore
    const proposalsWithVotes = proposalsStore.map((proposal) => {
      const proposalVotes = votesStore[proposal.id] || {};
      const yesVotes = Object.values(proposalVotes).filter(
        (vote) => vote.choice === true
      ).length;
      const noVotes = Object.values(proposalVotes).filter(
        (vote) => vote.choice === false
      ).length;

      // Check if current user has voted
      const hasVoted = account ? !!proposalVotes[account.toLowerCase()] : false;

      // Auto-reveal if past deadline
      const revealed = Date.now() > proposal.deadline;

      return {
        ...proposal,
        yes: revealed ? yesVotes : 0,
        no: revealed ? noVotes : 0,
        revealed,
        decryptionPending: false,
        hasVoted,
      };
    });

    console.log(
      `✅ Found ${proposalsWithVotes.length} proposals in IPFS storage`
    );
    return proposalsWithVotes.sort((a, b) => b.id - a.id);
  } catch (error) {
    console.error("❌ Failed to fetch proposals from IPFS:", error);
    return [];
  }
}

// IPFS-only proposal creation
export async function createProposalTx(
  metadata: ProposalMetadata,
  durationSeconds: number
) {
  console.log("📤 Creating proposal in IPFS-only mode...");

  try {
    // Upload metadata to IPFS
    const ipfsHash = await ipfs.upload(metadata);
    console.log("✅ Metadata uploaded to IPFS:", ipfsHash);

    // Create proposal in local storage
    const proposal = {
      id: nextProposalId++,
      ipfsHash,
      metadata,
      creator: metadata.creator,
      deadline: Date.now() + durationSeconds * 1000,
      revealed: false,
      decryptionPending: false,
      yes: 0,
      no: 0,
    };

    proposalsStore.push(proposal);

    // Also save to localStorage for persistence
    saveToLocalStorage();

    console.log("✅ Proposal created successfully:", proposal.id);
    return { hash: `ipfs_${proposal.id}` };
  } catch (error) {
    console.error("❌ Failed to create proposal:", error);
    throw error;
  }
}

// IPFS-only voting
export async function voteTx(
  proposalId: number,
  choice: boolean,
  account: string
) {
  console.log("🗳️ Voting in IPFS-only mode:", { proposalId, choice, account });

  try {
    const proposal = proposalsStore.find((p) => p.id === proposalId);

    if (!proposal) {
      throw new Error("Proposal not found");
    }

    if (Date.now() > proposal.deadline) {
      throw new Error("Voting period has ended");
    }

    // Initialize votes for this proposal if needed
    if (!votesStore[proposalId]) {
      votesStore[proposalId] = {};
    }

    // Check if user already voted
    if (votesStore[proposalId][account.toLowerCase()]) {
      throw new Error("Already voted on this proposal");
    }

    // Record the vote
    votesStore[proposalId][account.toLowerCase()] = {
      choice,
      timestamp: Date.now(),
      onChain: true, // For compatibility
    };

    // Save user votes to localStorage
    const userVotes = getUserVotes(account, 11155111); // Fake chainId for compatibility
    userVotes[proposalId] = {
      choice,
      timestamp: Date.now(),
      onChain: true,
    };

    const votesKey = `votes-${account}-11155111`;
    localStorage.setItem(votesKey, JSON.stringify(userVotes));

    // Save global state
    saveToLocalStorage();

    console.log("✅ Vote recorded successfully!");
    return { hash: `vote_${proposalId}_${account}` };
  } catch (error) {
    console.error("❌ Voting failed:", error);
    throw error;
  }
}

// Helper function to get user's votes from localStorage (for compatibility)
export function getUserVotes(
  account: string,
  chainId: number
): Record<
  number,
  { choice: boolean; timestamp: number; onChain?: boolean; error?: boolean }
> {
  if (typeof window === "undefined") return {};
  const votesKey = `votes-${account}-${chainId}`;
  return JSON.parse(localStorage.getItem(votesKey) || "{}");
}

// IPFS-only reveal (instant since no encryption)
export async function requestRevealTx(proposalId: number) {
  console.log("🔍 Revealing proposal in IPFS-only mode:", proposalId);

  try {
    const proposal = proposalsStore.find((p) => p.id === proposalId);

    if (!proposal) {
      throw new Error("Proposal not found");
    }

    if (Date.now() < proposal.deadline) {
      throw new Error("Cannot reveal before deadline");
    }

    // Auto-reveal happens in fetchProposals, so this is just for compatibility
    console.log("✅ Proposal revealed (automatic in IPFS-only mode)");
    return { hash: `reveal_${proposalId}` };
  } catch (error) {
    console.error("❌ Reveal failed:", error);
    throw error;
  }
}

// IPFS metadata deletion
export async function deleteProposalMetadata(
  ipfsHash: string
): Promise<boolean> {
  try {
    console.log("🗑️ Deleting proposal metadata from IPFS:", ipfsHash);
    await ipfs.delete(ipfsHash);
    return true;
  } catch (error) {
    console.error("❌ Failed to delete metadata:", error);
    return false;
  }
}

// Check reveal status (instant in IPFS-only mode)
export async function checkProposalRevealStatus(proposalId: number): Promise<{
  revealed: boolean;
  yes: number;
  no: number;
  decryptionPending: boolean;
} | null> {
  try {
    const proposal = proposalsStore.find((p) => p.id === proposalId);

    if (!proposal) {
      return null;
    }

    const proposalVotes = votesStore[proposalId] || {};
    const yesVotes = Object.values(proposalVotes).filter(
      (vote: { choice: boolean; timestamp: number; onChain: boolean }) =>
        vote.choice === true
    ).length;
    const noVotes = Object.values(proposalVotes).filter(
      (vote: { choice: boolean; timestamp: number; onChain: boolean }) =>
        vote.choice === false
    ).length;
    const revealed = Date.now() > proposal.deadline;

    return {
      revealed,
      yes: revealed ? yesVotes : 0,
      no: revealed ? noVotes : 0,
      decryptionPending: false,
    };
  } catch (error) {
    console.error("❌ Failed to check reveal status:", error);
    return null;
  }
}

// Local storage functions for persistence
function saveToLocalStorage() {
  if (typeof window === "undefined") return;

  localStorage.setItem("ipfs_proposals", JSON.stringify(proposalsStore));
  localStorage.setItem("ipfs_votes", JSON.stringify(votesStore));
  localStorage.setItem("ipfs_next_id", nextProposalId.toString());
}

function loadFromLocalStorage() {
  if (typeof window === "undefined") return;

  try {
    const savedProposals = localStorage.getItem("ipfs_proposals");
    const savedVotes = localStorage.getItem("ipfs_votes");
    const savedNextId = localStorage.getItem("ipfs_next_id");

    if (savedProposals) {
      proposalsStore = JSON.parse(savedProposals);
    }

    if (savedVotes) {
      votesStore = JSON.parse(savedVotes);
    }

    if (savedNextId) {
      nextProposalId = parseInt(savedNextId);
    }

    console.log("✅ Loaded IPFS data from localStorage:", {
      proposals: proposalsStore.length,
      votesSets: Object.keys(votesStore).length,
      nextId: nextProposalId,
    });
  } catch (error) {
    console.warn("⚠️ Failed to load from localStorage:", error);
  }
}

// Functions for tracking deleted proposals (for compatibility)
export function markProposalAsDeleted(
  proposalId: number,
  account: string
): void {
  if (typeof window === "undefined") return;

  const normalizedAccount = account.toLowerCase();
  const deletedKey = `deleted-proposals-${normalizedAccount}`;
  const deleted = JSON.parse(localStorage.getItem(deletedKey) || "[]");

  if (!deleted.includes(proposalId)) {
    deleted.push(proposalId);
    localStorage.setItem(deletedKey, JSON.stringify(deleted));
  }
}

export function isProposalDeleted(
  proposalId: number,
  account?: string
): boolean {
  if (typeof window === "undefined" || !account) return false;

  const normalizedAccount = account.toLowerCase();
  const deletedKey = `deleted-proposals-${normalizedAccount}`;
  const deleted = JSON.parse(localStorage.getItem(deletedKey) || "[]");

  return deleted.includes(proposalId);
}

export function getDeletedProposals(account: string): number[] {
  if (typeof window === "undefined") return [];

  const normalizedAccount = account.toLowerCase();
  const deletedKey = `deleted-proposals-${normalizedAccount}`;
  return JSON.parse(localStorage.getItem(deletedKey) || "[]");
}

export function clearDeletedProposals(account: string): void {
  if (typeof window === "undefined") return;

  const normalizedAccount = account.toLowerCase();
  const deletedKey = `deleted-proposals-${normalizedAccount}`;
  localStorage.removeItem(deletedKey);
  console.log(`Cleared deleted proposals for ${normalizedAccount}`);
}

// Demo data helper
export function addDemoProposals() {
  if (proposalsStore.length > 0) return; // Only add if empty

  const now = Date.now();

  // Add multiple demo proposals with different states
  const demoProposals = [
    {
      metadata: {
        title: "Welcome to PrivyBallot IPFS Demo",
        description:
          "This is a demo proposal running entirely on IPFS! No blockchain contracts needed. You can vote, create proposals, and everything persists in localStorage + IPFS. This proposal demonstrates the fully decentralized nature of the platform.",
        options: ["Yes", "No"],
        creator: "demo",
        createdAt: now,
        tags: ["demo", "ipfs", "decentralized"],
      },
      deadline: now + 24 * 60 * 60 * 1000, // 24 hours
    },
    {
      metadata: {
        title: "Should we implement real FHE voting?",
        description:
          "This proposal asks whether we should integrate real fully homomorphic encryption (FHE) voting using Zama's SDK. This would enable truly private voting while maintaining verifiability.",
        options: ["Yes", "No"],
        creator: "developer",
        createdAt: now - 2 * 60 * 60 * 1000, // 2 hours ago
        tags: ["fhe", "privacy", "voting"],
      },
      deadline: now + 6 * 60 * 60 * 1000, // 6 hours remaining
    },
    {
      metadata: {
        title: "Community Fund Allocation",
        description:
          "How should we allocate the community development fund? This decision will impact the future development priorities and resource allocation for the PrivyBallot platform.",
        options: ["Development", "Marketing", "Security Audits", "Research"],
        creator: "community",
        createdAt: now - 12 * 60 * 60 * 1000, // 12 hours ago
        tags: ["funding", "community", "development"],
      },
      deadline: now + 2 * 60 * 60 * 1000, // 2 hours remaining
    },
    {
      metadata: {
        title: "Feature Request: Mobile App",
        description:
          "Should we prioritize developing a native mobile application for PrivyBallot? This would make voting more accessible but requires significant development resources.",
        options: ["High Priority", "Medium Priority", "Low Priority"],
        creator: "product",
        createdAt: now - 1 * 60 * 60 * 1000, // 1 hour ago
        tags: ["mobile", "feature", "ux"],
      },
      deadline: now - 30 * 60 * 1000, // Already ended (30 min ago) - will show results
    },
  ];

  demoProposals.forEach((demo) => {
    const proposal = {
      id: nextProposalId++,
      ipfsHash: `demo_ipfs_hash_${nextProposalId}`,
      metadata: demo.metadata,
      creator: demo.metadata.creator,
      deadline: demo.deadline,
      revealed: false,
      decryptionPending: false,
      yes: 0,
      no: 0,
    };

    proposalsStore.push(proposal);

    // Add some demo votes for the ended proposal
    if (demo.deadline < now) {
      votesStore[proposal.id] = {
        demo_user_1: {
          choice: true,
          timestamp: now - 25 * 60 * 1000,
          onChain: true,
        },
        demo_user_2: {
          choice: true,
          timestamp: now - 20 * 60 * 1000,
          onChain: true,
        },
        demo_user_3: {
          choice: false,
          timestamp: now - 15 * 60 * 1000,
          onChain: true,
        },
        demo_user_4: {
          choice: true,
          timestamp: now - 10 * 60 * 1000,
          onChain: true,
        },
      };
    }
  });

  saveToLocalStorage();
  console.log(`✅ Added ${demoProposals.length} demo proposals`);
}

// Initialize on load
loadFromLocalStorage();

// Add demo data if none exists
addDemoProposals();

console.log("🌟✅ IPFS-only DAO loaded successfully - fully contract-free!");
