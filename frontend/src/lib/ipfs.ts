// IPFS metadata handling for proposals
import { ethers } from "ethers";

export interface ProposalMetadata {
  title: string;
  description: string;
  options: string[]; // e.g., ["Yes", "No"]
  creator: string;
  createdAt: number;
  tags?: string[];
}

// Real IPFS implementation using Pinata
class PinataIPFS {
  private apiUrl = "https://api.pinata.cloud";
  private fetchAttempts = new Map<string, number>();
  private lastFetchTime = 0;
  private readonly RATE_LIMIT_MS = 2000; // 2 seconds between requests to avoid 429
  private readonly MAX_ATTEMPTS = 2; // Reduce attempts to avoid overwhelming gateways

  private async rateLimitedFetch(
    url: string,
    options?: RequestInit
  ): Promise<Response> {
    // Rate limiting with exponential backoff
    const now = Date.now();
    const timeSinceLastFetch = now - this.lastFetchTime;
    const waitTime = Math.max(
      this.RATE_LIMIT_MS,
      this.RATE_LIMIT_MS * Math.pow(2, 0)
    ); // Start with base rate limit

    if (timeSinceLastFetch < waitTime) {
      const delayMs = waitTime - timeSinceLastFetch;
      console.log(`⏳ Rate limiting: waiting ${delayMs}ms before next request`);
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }

    this.lastFetchTime = Date.now();

    return fetch(url, options);
  }

  async upload(metadata: ProposalMetadata): Promise<string> {
    const pinataApiKey = process.env.NEXT_PUBLIC_PINATA_API_KEY;
    const pinataSecretKey = process.env.NEXT_PUBLIC_PINATA_SECRET_KEY;

    if (!pinataApiKey || !pinataSecretKey) {
      throw new Error(
        "Pinata API keys not found. Please add NEXT_PUBLIC_PINATA_API_KEY and NEXT_PUBLIC_PINATA_SECRET_KEY to your .env.local file"
      );
    }

    try {
      console.log("📤 Uploading proposal metadata to IPFS via Pinata...");

      const response = await fetch(`${this.apiUrl}/pinning/pinJSONToIPFS`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          pinata_api_key: pinataApiKey,
          pinata_secret_api_key: pinataSecretKey,
        },
        body: JSON.stringify({
          pinataContent: metadata,
          pinataMetadata: {
            name: `privyballot-proposal-${metadata.title.slice(0, 30)}`,
            keyvalues: {
              creator: metadata.creator,
              type: "proposal",
              app: "privyballot",
            },
          },
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Pinata API error: ${response.status} ${errorText}`);
      }

      const result = await response.json();
      console.log("✅ Successfully uploaded to IPFS:", result.IpfsHash);
      console.log(
        `📍 View on IPFS: https://gateway.pinata.cloud/ipfs/${result.IpfsHash}`
      );
      return result.IpfsHash;
    } catch (error) {
      console.error("❌ Pinata upload failed:", error);
      throw error;
    }
  }

  async fetch(hash: string): Promise<ProposalMetadata | null> {
    // Check if we've already failed this hash too many times
    const attempts = this.fetchAttempts.get(hash) || 0;
    if (attempts >= this.MAX_ATTEMPTS) {
      console.warn(`❌ Max fetch attempts exceeded for hash: ${hash}`);
      return null;
    }

    // Validate hash format - be more strict for valid IPFS hashes
    if (!hash || !hash.startsWith("Qm")) {
      console.warn(`❌ Invalid IPFS hash format: ${hash}`);
      console.warn("Expected to start with 'Qm', received:", hash);
      return null;
    }

    // Check for truncated hashes (legacy proposals) - these will definitely fail
    if (hash.length < 46) {
      console.warn(
        `❌ Truncated IPFS hash detected: ${hash} (length: ${hash.length})`
      );
      console.warn(
        "This is likely a legacy proposal created before the bytes32 fix. Skipping IPFS fetch."
      );
      return null;
    }

    try {
      // Increment attempt counter
      this.fetchAttempts.set(hash, attempts + 1);

      // Try CORS-friendly IPFS gateways
      const gateways = [
        `https://gateway.pinata.cloud/ipfs/${hash}`,
        `https://ipfs.io/ipfs/${hash}`,
        `https://dweb.link/ipfs/${hash}`,
        `https://cf-ipfs.com/ipfs/${hash}`,
      ];

      console.log(`📥 Fetching from IPFS: ${hash}`);

      for (const gateway of gateways) {
        try {
          console.log(`Trying gateway: ${gateway}`);
          const response = await this.rateLimitedFetch(gateway, {
            headers: {
              Accept: "application/json",
            },
            mode: "cors",
          });

          if (response.ok) {
            const data = await response.json();
            console.log(`✅ Successfully fetched from IPFS via: ${gateway}`);
            // Reset attempt counter on success
            this.fetchAttempts.delete(hash);
            return data;
          } else {
            console.warn(
              `Gateway ${gateway} returned:`,
              response.status,
              response.statusText
            );
          }
        } catch (err) {
          console.warn(`Failed to fetch from ${gateway}:`, err);
          continue; // Try next gateway
        }
      }

      // All gateways failed
      console.error("❌ All IPFS gateways failed for hash:", hash);
      console.error("This might be due to:");
      console.error("1. Truncated IPFS hash (contract bytes32 limitation)");
      console.error("2. CORS policy restrictions");
      console.error("3. Rate limiting (429 errors)");
      console.error("4. Hash not found on IPFS network");
      return null;
    } catch (error) {
      console.error("❌ IPFS fetch failed:", error);
      return null;
    }
  }

  async delete(hash: string): Promise<boolean> {
    const pinataApiKey = process.env.NEXT_PUBLIC_PINATA_API_KEY;
    const pinataSecretKey = process.env.NEXT_PUBLIC_PINATA_SECRET_KEY;

    if (!pinataApiKey || !pinataSecretKey) {
      throw new Error(
        "Pinata API keys not found. Cannot delete from IPFS without API keys."
      );
    }

    // Validate hash before attempting deletion
    if (!hash || hash.length < 10 || !hash.startsWith("Qm")) {
      console.warn("⚠️ Invalid IPFS hash for deletion:", hash);
      return false;
    }

    // Don't attempt to delete truncated hashes
    if (hash.length < 40) {
      console.warn("⚠️ Hash appears truncated, skipping deletion:", hash);
      return false;
    }

    try {
      console.log("🗑️ Deleting proposal metadata from IPFS via Pinata...");

      const response = await fetch(`${this.apiUrl}/pinning/unpin/${hash}`, {
        method: "DELETE",
        headers: {
          pinata_api_key: pinataApiKey,
          pinata_secret_api_key: pinataSecretKey,
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.warn(`Pinata delete error: ${response.status} ${errorText}`);
        // Don't throw for 404 errors - the file might already be deleted
        if (response.status === 404) {
          console.log(
            "📁 File not found on IPFS, considering delete successful"
          );
          return true;
        }
        throw new Error(`Pinata delete error: ${response.status} ${errorText}`);
      }

      console.log("✅ Successfully deleted from IPFS:", hash);
      return true;
    } catch (error) {
      console.error("❌ IPFS delete failed:", error);
      throw error;
    }
  }
}

// Export the Pinata IPFS implementation - real IPFS only!
export const ipfs = new PinataIPFS();

// Store mapping of hash -> original IPFS hash for reconstruction
const ipfsHashMapping = new Map<string, string>();

// Helper to convert string to bytes32 for contract
export function stringToBytes32(str: string): string {
  if (!str || str.length === 0) {
    return ethers.ZeroHash;
  }

  console.log("Converting to bytes32:", str, "length:", str.length);

  // For IPFS hashes that are too long, we need to handle them specially
  if (str.length > 31) {
    // UTF-8 encoding can be up to 31 chars for 32 bytes
    console.log("IPFS hash too long for bytes32, using hash of the hash:", str);
    // Use keccak256 hash of the IPFS hash as a unique identifier
    const hashOfHash = ethers.keccak256(ethers.toUtf8Bytes(str));
    console.log("Hash of hash:", hashOfHash);

    // Store the mapping so we can reconstruct it later
    ipfsHashMapping.set(hashOfHash, str);

    // Also store in localStorage for persistence
    if (typeof window !== "undefined") {
      const stored = JSON.parse(
        localStorage.getItem("ipfs-hash-mapping") || "{}"
      );
      stored[hashOfHash] = str;
      localStorage.setItem("ipfs-hash-mapping", JSON.stringify(stored));
    }

    return hashOfHash;
  }

  // For shorter strings, use normal padding
  const bytes = ethers.toUtf8Bytes(str);
  const padded = new Uint8Array(32);
  padded.set(bytes);
  return ethers.hexlify(padded);
}

// Helper to convert bytes32 back to string
export function bytes32ToString(bytes32: string): string {
  try {
    if (!bytes32 || bytes32 === ethers.ZeroHash) {
      return "";
    }

    console.log("Converting bytes32 to string:", bytes32);

    // First check if this is a hash of an IPFS hash
    if (ipfsHashMapping.has(bytes32)) {
      const originalHash = ipfsHashMapping.get(bytes32)!;
      console.log("Found IPFS hash in memory mapping:", originalHash);
      return originalHash;
    }

    // Check localStorage for the mapping
    if (typeof window !== "undefined") {
      const stored = JSON.parse(
        localStorage.getItem("ipfs-hash-mapping") || "{}"
      );
      if (stored[bytes32]) {
        const originalHash = stored[bytes32];
        console.log("Found IPFS hash in localStorage:", originalHash);
        // Store back in memory for next time
        ipfsHashMapping.set(bytes32, originalHash);
        return originalHash;
      }
    }

    // If it's not a hash of hash, try normal conversion
    // Convert hex to bytes
    const bytes = ethers.getBytes(bytes32);

    // Remove trailing zeros
    let endIndex = bytes.length;
    while (endIndex > 0 && bytes[endIndex - 1] === 0) {
      endIndex--;
    }

    const trimmedBytes = bytes.slice(0, endIndex);

    // Convert back to string
    const result = ethers.toUtf8String(trimmedBytes);
    console.log("Converted bytes32 to string via normal method:", result);

    // If the result looks like a truncated IPFS hash, warn but return it
    if (result.startsWith("Qm") && result.length < 46) {
      console.warn("Detected truncated IPFS hash:", result);
      console.warn("This may be due to bytes32 storage limitations");
    }

    return result;
  } catch (error) {
    console.warn("Failed to convert bytes32 to string:", error);
    return bytes32; // Return raw hex if conversion fails
  }
}
