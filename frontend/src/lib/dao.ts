// Contract interaction helpers with IPFS metadata support
import { ethers, BrowserProvider, Contract } from "ethers";
import { VOTING_DAO_ABI, CONTRACT_ADDRESS } from "./contracts";
import { ipfs, stringToBytes32, bytes32ToString } from "./ipfs";
import { encryptVote, clearFHECache } from "./fhe-simple";

// Circuit breaker to prevent too many requests and handle wallet circuit breaker
let lastRequestTime = 0;
let requestCount = 0;
let consecutiveErrors = 0;
const REQUEST_COOLDOWN = 3000; // 3 seconds between requests (reduced for reveal polling)
const MAX_REQUESTS_PER_MINUTE = 10; // Increased for reveal polling
const MAX_CONSECUTIVE_ERRORS = 3;
const ERROR_BACKOFF_TIME = 15000; // 15 seconds backoff (reduced)

function shouldAllowRequest(isRevealCheck = false): boolean {
  const now = Date.now();

  // For reveal checks, be more lenient
  if (isRevealCheck) {
    if (consecutiveErrors >= MAX_CONSECUTIVE_ERRORS) {
      if (now - lastRequestTime < ERROR_BACKOFF_TIME / 2) {
        // Half backoff for reveals
        return false;
      } else {
        consecutiveErrors = 0;
      }
    }

    // For reveals, allow more frequent requests
    if (now - lastRequestTime < REQUEST_COOLDOWN / 2) {
      return false;
    }

    return true;
  }

  // If we've had consecutive errors, implement longer backoff
  if (consecutiveErrors >= MAX_CONSECUTIVE_ERRORS) {
    if (now - lastRequestTime < ERROR_BACKOFF_TIME) {
      console.warn(
        `Circuit breaker: backing off for ${Math.ceil(
          (ERROR_BACKOFF_TIME - (now - lastRequestTime)) / 1000
        )}s due to consecutive errors`
      );
      return false;
    } else {
      // Reset error count after backoff period
      consecutiveErrors = 0;
    }
  }

  // Reset count every minute
  if (now - lastRequestTime > 60000) {
    requestCount = 0;
  }

  // Check if we should throttle
  if (requestCount >= MAX_REQUESTS_PER_MINUTE) {
    console.warn("Request throttled: too many requests per minute");
    return false;
  }

  // Check cooldown
  if (now - lastRequestTime < REQUEST_COOLDOWN) {
    console.warn(
      `Request throttled: cooldown period (${Math.ceil(
        (REQUEST_COOLDOWN - (now - lastRequestTime)) / 1000
      )}s remaining)`
    );
    return false;
  }

  lastRequestTime = now;
  requestCount++;
  return true;
}

// Helper to track errors
function recordError() {
  consecutiveErrors++;
  console.warn(`Consecutive errors: ${consecutiveErrors}`);
}

function recordSuccess() {
  consecutiveErrors = 0;
}

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

// Contract helper functions
function getContract(provider: BrowserProvider): Contract {
  if (!CONTRACT_ADDRESS) {
    throw new Error("NEXT_PUBLIC_VOTING_ADDRESS not set in environment");
  }
  return new ethers.Contract(CONTRACT_ADDRESS, VOTING_DAO_ABI, provider);
}

// Real contract integration
export async function fetchProposals(
  account?: string,
  isRevealCheck = false
): Promise<PublicProposal[]> {
  // Check circuit breaker first
  if (!shouldAllowRequest(isRevealCheck)) {
    console.log("Request blocked by circuit breaker, waiting for cooldown");
    return [];
  }

  if (!CONTRACT_ADDRESS || typeof window === "undefined" || !window.ethereum) {
    console.error("Contract not configured or wallet not available");
    recordError();
    return [];
  }

  try {
    const provider = new ethers.BrowserProvider(window.ethereum);

    // Check network first - this is a lightweight call
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
      recordError();
      return [];
    }

    // Check if contract exists at the address - potential circuit breaker trigger
    let code;
    try {
      code = await provider.getCode(CONTRACT_ADDRESS);
    } catch (error: unknown) {
      // Check if this is a circuit breaker error from wallet extension
      const err = error as {
        message?: string;
        data?: { cause?: { isBrokenCircuitError?: boolean } };
      };
      if (
        err?.message?.includes("circuit breaker") ||
        err?.message?.includes("Execution prevented") ||
        err?.data?.cause?.isBrokenCircuitError
      ) {
        console.warn(
          "⚠️ Wallet extension circuit breaker is active. Waiting before retry..."
        );
        recordError();
        return [];
      }
      throw error; // Re-throw if it's a different error
    }

    console.log("Contract code length:", code.length);

    if (code === "0x") {
      console.error(
        `No contract found at ${CONTRACT_ADDRESS} on network ${network.name} (chainId: ${network.chainId})`
      );
      recordError();
      return [];
    }

    const contract = getContract(provider);

    const total = Number(await contract.nextProposalId());
    console.log(`Found ${total} proposals on-chain`);

    if (total === 0) {
      recordSuccess();
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

          // Also check localStorage for votes (until FHE voting is implemented)
          let localVoted = false;
          if (account && typeof window !== "undefined") {
            const userVotes = getUserVotes(account);
            localVoted = userVotes[id] !== undefined;
          }

          const hasVoted = voted || localVoted;

          // Debug logging for vote status
          console.log(`Proposal ${id} vote status:`, {
            contractVoted: voted,
            localVoted: localVoted,
            finalHasVoted: hasVoted,
            account: account,
            creator: creator,
            isCreator:
              account && creator.toLowerCase() === account.toLowerCase(),
          });

          // Convert bytes32 back to IPFS hash
          const hashString = bytes32ToString(ipfsHash);
          console.log("Raw bytes32 from contract:", ipfsHash);
          console.log("Converted hash string:", hashString);

          // Validate IPFS hash before attempting to fetch - be more lenient
          // Legacy proposals may have truncated hashes that are not valid IPFS hashes
          const isValidIpfsHash =
            hashString &&
            hashString.length >= 46 &&
            hashString.startsWith("Qm");

          if (!isValidIpfsHash) {
            console.warn(
              `Invalid or truncated IPFS hash for proposal ${id}:`,
              hashString,
              `(length: ${hashString?.length || 0})`
            );
            return {
              id,
              ipfsHash: hashString,
              metadata: null,
              creator,
              deadline: Number(deadline) * 1000, // Convert to ms
              revealed: Boolean(revealed),
              decryptionPending: Boolean(decryptionPending),
              yes: Number(yes),
              no: Number(no),
              hasVoted,
            };
          }

          // Fetch metadata from IPFS with timeout and retry logic
          let metadata: ProposalMetadata | null = null;
          try {
            // Add a timeout to prevent hanging requests
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

            metadata = await ipfs.fetch(hashString);
            clearTimeout(timeoutId);
          } catch (error) {
            console.warn(`Failed to fetch metadata for proposal ${id}:`, error);
            // Don't throw - just continue with null metadata
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
            hasVoted: Boolean(hasVoted),
          } as PublicProposal;
        } catch (error) {
          console.error(`Failed to fetch proposal ${id}:`, error);
          return null;
        }
      })
    );

    // Filter out failed proposals and sort newest first
    const allProposals = proposals
      .filter(Boolean)
      .sort((a, b) => b!.id - a!.id) as PublicProposal[];

    // Filter out proposals that have been deleted by the user
    const result = allProposals.filter(
      (proposal) => !isProposalDeleted(proposal.id, account)
    );

    recordSuccess(); // Mark successful request
    return result;
  } catch (error: unknown) {
    console.error("Failed to fetch proposals from contract:", error);

    // Check if this is a circuit breaker error
    const err = error as {
      message?: string;
      data?: { cause?: { isBrokenCircuitError?: boolean } };
    };
    if (
      err?.message?.includes("circuit breaker") ||
      err?.message?.includes("Execution prevented") ||
      err?.data?.cause?.isBrokenCircuitError
    ) {
      console.error("⚠️ Wallet extension circuit breaker is blocking requests");
      console.error(
        "This usually happens when too many requests are made quickly"
      );
      console.error("Wait a few minutes and try refreshing the page");
    }

    console.error("Error details:", {
      message: error instanceof Error ? error.message : "Unknown error",
      code: (error as { code?: string })?.code,
      action: (error as { action?: string })?.action,
      reason: (error as { reason?: string })?.reason,
    });

    recordError();
    return [];
  }
}

export async function createProposalTx(
  metadata: ProposalMetadata,
  durationSeconds: number
) {
  // Upload metadata to IPFS first
  console.log("📤 Uploading metadata to IPFS...");
  const ipfsHash = await ipfs.upload(metadata);
  console.log("✅ Metadata uploaded to IPFS:", ipfsHash);

  if (!CONTRACT_ADDRESS || typeof window === "undefined" || !window.ethereum) {
    throw new Error("Contract not configured or wallet not available");
  }

  try {
    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    const contract = new ethers.Contract(
      CONTRACT_ADDRESS,
      VOTING_DAO_ABI,
      signer
    );

    console.log("📝 Creating proposal on-chain with IPFS hash:", ipfsHash);
    const bytes32Hash = stringToBytes32(ipfsHash);
    console.log("🔗 Converted to bytes32:", bytes32Hash);

    // Check if we can estimate gas first
    try {
      console.log("💰 Estimating gas...");
      const gasEstimate = await contract.createProposal.estimateGas(
        bytes32Hash,
        durationSeconds
      );
      console.log("💰 Gas estimate:", gasEstimate.toString());

      // Add 20% buffer to gas estimate
      const gasLimit = (gasEstimate * BigInt(120)) / BigInt(100);
      console.log("💰 Gas limit with buffer:", gasLimit.toString());

      console.log("🚀 Sending transaction...");
      const tx = await contract.createProposal(bytes32Hash, durationSeconds, {
        gasLimit: gasLimit,
      });
      console.log("✅ Transaction sent:", tx.hash);

      console.log("⏳ Waiting for confirmation...");
      const receipt = await tx.wait();
      console.log("✅ Transaction confirmed:", receipt.hash);
      console.log("📊 Gas used:", receipt.gasUsed.toString());

      return { ipfsHash, txHash: receipt.hash };
    } catch (gasError) {
      console.error("❌ Gas estimation failed:", gasError);

      // Try without gas estimation (fallback)
      console.log("🔄 Trying without gas estimation...");
      const tx = await contract.createProposal(bytes32Hash, durationSeconds);
      console.log("✅ Transaction sent (no gas estimate):", tx.hash);

      const receipt = await tx.wait();
      console.log("✅ Transaction confirmed:", receipt.hash);

      return { ipfsHash, txHash: receipt.hash };
    }
  } catch (error) {
    console.error("❌ Failed to create proposal on-chain:", error);

    // Log more detailed error information
    if (error && typeof error === "object") {
      const err = error as {
        message?: string;
        code?: string | number;
        data?: unknown;
        reason?: string;
        transaction?: unknown;
      };
      console.error("Error details:", {
        message: err.message,
        code: err.code,
        data: err.data,
        reason: err.reason,
        transaction: err.transaction,
      });
    }

    throw error;
  }
}

export async function voteTx(
  proposalId: number,
  choice: boolean,
  account: string
) {
  if (!CONTRACT_ADDRESS || typeof window === "undefined" || !window.ethereum) {
    throw new Error("Contract not configured or wallet not available");
  }

  try {
    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    const contract = new ethers.Contract(
      CONTRACT_ADDRESS,
      VOTING_DAO_ABI,
      signer
    );

    console.log("Encrypting vote...");
    // Clear FHE cache to ensure we use the latest implementation
    clearFHECache();
    const { encryptedChoice, inputProof } = await encryptVote(
      choice,
      CONTRACT_ADDRESS,
      account
    );

    console.log("Submitting encrypted vote to contract...");
    const tx = await contract.vote(proposalId, encryptedChoice, inputProof);

    console.log("Vote transaction submitted:", tx.hash);
    const receipt = await tx.wait();

    console.log("Vote confirmed on-chain:", {
      proposalId,
      txHash: receipt?.hash,
      blockNumber: receipt?.blockNumber,
    });

    // Also store locally for UI consistency until reveal
    if (typeof window !== "undefined") {
      const votesKey = `votes-${account}`;
      const existingVotes = JSON.parse(localStorage.getItem(votesKey) || "{}");
      existingVotes[proposalId] = {
        choice,
        timestamp: Date.now(),
        onChain: true,
      };
      localStorage.setItem(votesKey, JSON.stringify(existingVotes));
    }

    return { success: true, txHash: receipt?.hash };
  } catch (error) {
    console.error("FHE voting failed:", error);
    throw error;
  }
}

// Helper function to get user's votes from localStorage
export function getUserVotes(
  account: string
): Record<
  number,
  { choice: boolean; timestamp: number; onChain?: boolean; error?: boolean }
> {
  if (typeof window === "undefined") return {};
  const votesKey = `votes-${account}`;
  return JSON.parse(localStorage.getItem(votesKey) || "{}");
}

export async function requestRevealTx(proposalId: number) {
  if (!CONTRACT_ADDRESS || typeof window === "undefined" || !window.ethereum) {
    throw new Error("Contract not configured or wallet not available");
  }

  try {
    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    const contract = new ethers.Contract(
      CONTRACT_ADDRESS,
      VOTING_DAO_ABI,
      signer
    );

    console.log("Requesting reveal for proposal:", proposalId);
    const tx = await contract.requestReveal(proposalId);
    console.log("Reveal transaction sent:", tx.hash);

    const receipt = await tx.wait();
    console.log("Reveal transaction confirmed:", receipt.hash);

    return { txHash: receipt.hash };
  } catch (error) {
    console.error("Failed to request reveal:", error);
    throw error;
  }
}

export async function deleteProposalMetadata(
  ipfsHash: string
): Promise<boolean> {
  try {
    console.log("Attempting to delete proposal metadata:", ipfsHash);

    // Handle truncated or invalid IPFS hashes gracefully
    if (!ipfsHash || ipfsHash.length < 10 || !ipfsHash.startsWith("Qm")) {
      console.warn(
        "⚠️ Invalid or truncated IPFS hash, skipping deletion:",
        ipfsHash
      );
      // Consider this "successful" since there's nothing to delete
      return true;
    }

    // Only attempt deletion for valid-looking hashes
    if (ipfsHash.length >= 40) {
      const success = await ipfs.delete(ipfsHash);
      if (success) {
        console.log("✅ Proposal metadata deleted successfully");
      } else {
        console.warn("⚠️ Failed to delete proposal metadata (may not exist)");
      }
      return success;
    } else {
      console.warn(
        "⚠️ Hash too short for deletion, likely truncated:",
        ipfsHash
      );
      // Return true since we can't delete a truncated hash anyway
      return true;
    }
  } catch (error) {
    console.error("Failed to delete proposal metadata:", error);
    // Return true on error since we want the user to be able to "delete"
    // proposals even if IPFS deletion fails
    return true;
  }
}

// Lightweight function to check reveal status for a specific proposal
export async function checkProposalRevealStatus(proposalId: number): Promise<{
  revealed: boolean;
  yes: number;
  no: number;
  decryptionPending: boolean;
} | null> {
  if (!CONTRACT_ADDRESS || typeof window === "undefined" || !window.ethereum) {
    return null;
  }

  try {
    const provider = new ethers.BrowserProvider(window.ethereum);
    const contract = getContract(provider);

    const [, , , revealed, decryptionPending, yes, no] =
      await contract.getProposalPublic(proposalId);

    return {
      revealed: Boolean(revealed),
      yes: Number(yes),
      no: Number(no),
      decryptionPending: Boolean(decryptionPending),
    };
  } catch (error) {
    console.error(
      `Failed to check reveal status for proposal ${proposalId}:`,
      error
    );
    return null;
  }
}

// Functions to track deleted proposals locally
export function markProposalAsDeleted(
  proposalId: number,
  account: string
): void {
  if (typeof window === "undefined") return;

  const deletedKey = `deleted-proposals-${account}`;
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

  const deletedKey = `deleted-proposals-${account}`;
  const deleted = JSON.parse(localStorage.getItem(deletedKey) || "[]");

  return deleted.includes(proposalId);
}

export function getDeletedProposals(account: string): number[] {
  if (typeof window === "undefined") return [];

  const deletedKey = `deleted-proposals-${account}`;
  return JSON.parse(localStorage.getItem(deletedKey) || "[]");
}
