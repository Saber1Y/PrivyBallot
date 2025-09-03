// IPFS metadata handling for proposals

export interface ProposalMetadata {
  title: string;
  description: string;
  options: string[]; // e.g., ["Yes", "No"]
  creator: string;
  createdAt: number;
  tags?: string[];
}

// For development: mock IPFS with localStorage
class MockIPFS {
  private store = new Map<string, ProposalMetadata>();

  async upload(metadata: ProposalMetadata): Promise<string> {
    // Generate a mock hash
    const hash = `Qm${Math.random().toString(36).substring(2, 15)}`;
    this.store.set(hash, metadata);

    // Also persist to localStorage for demo
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

// Real IPFS implementation using Pinata
class PinataIPFS {
  private apiUrl = "https://api.pinata.cloud";

  async upload(metadata: ProposalMetadata): Promise<string> {
    const pinataApiKey = process.env.NEXT_PUBLIC_PINATA_API_KEY;
    const pinataSecretKey = process.env.NEXT_PUBLIC_PINATA_SECRET_KEY;

    if (!pinataApiKey || !pinataSecretKey) {
      console.warn("⚠️ Pinata API keys not found in environment variables");
      console.warn(
        "Please add NEXT_PUBLIC_PINATA_API_KEY and NEXT_PUBLIC_PINATA_SECRET_KEY to your .env.local file"
      );
      console.warn("Falling back to mock IPFS storage (localStorage)");
      return await new MockIPFS().upload(metadata);
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
      console.warn("🔄 Falling back to mock IPFS storage");
      // Fallback to mock if Pinata fails
      return await new MockIPFS().upload(metadata);
    }
  }

  async fetch(hash: string): Promise<ProposalMetadata | null> {
    try {
      // Try Pinata gateway first (fastest for pinned content)
      const pinataGateway = `https://gateway.pinata.cloud/ipfs/${hash}`;

      console.log(`📥 Fetching from IPFS: ${hash}`);

      const response = await fetch(pinataGateway, {
        headers: {
          Accept: "application/json",
        },
      });

      if (response.ok) {
        const data = await response.json();
        console.log("✅ Successfully fetched from IPFS via Pinata");
        return data;
      }

      // Fallback to other IPFS gateways
      const fallbackGateways = [
        `https://ipfs.io/ipfs/${hash}`,
        `https://cloudflare-ipfs.com/ipfs/${hash}`,
      ];

      for (const gateway of fallbackGateways) {
        try {
          const fallbackResponse = await fetch(gateway, {
            headers: { Accept: "application/json" },
          });
          if (fallbackResponse.ok) {
            const data = await fallbackResponse.json();
            console.log(`✅ Fetched from IPFS via fallback: ${gateway}`);
            return data;
          }
        } catch (err) {
          console.warn(`Failed to fetch from ${gateway}:`, err);
        }
      }

      // Final fallback to mock storage
      console.warn("❌ All IPFS gateways failed, trying mock storage");
      return await new MockIPFS().fetch(hash);
    } catch (error) {
      console.error("❌ IPFS fetch failed:", error);
      return null;
    }
  }

  async delete(hash: string): Promise<boolean> {
    const pinataApiKey = process.env.NEXT_PUBLIC_PINATA_API_KEY;
    const pinataSecretKey = process.env.NEXT_PUBLIC_PINATA_SECRET_KEY;

    if (!pinataApiKey || !pinataSecretKey) {
      console.warn(
        "⚠️ Pinata API keys not found, trying mock storage deletion"
      );
      // Try deleting from localStorage
      if (typeof window !== "undefined") {
        const stored = JSON.parse(
          localStorage.getItem("ipfs-proposals") || "{}"
        );
        if (stored[hash]) {
          delete stored[hash];
          localStorage.setItem("ipfs-proposals", JSON.stringify(stored));
          console.log("✅ Deleted from mock storage:", hash);
          return true;
        }
      }
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
        throw new Error(`Pinata delete error: ${response.status} ${errorText}`);
      }

      console.log("✅ Successfully deleted from IPFS:", hash);
      return true;
    } catch (error) {
      console.error("❌ IPFS delete failed:", error);
      // Fallback to mock deletion
      if (typeof window !== "undefined") {
        const stored = JSON.parse(
          localStorage.getItem("ipfs-proposals") || "{}"
        );
        if (stored[hash]) {
          delete stored[hash];
          localStorage.setItem("ipfs-proposals", JSON.stringify(stored));
          console.log("✅ Deleted from mock storage as fallback:", hash);
          return true;
        }
      }
      return false;
    }
  }
}

// Export the appropriate implementation - now using real IPFS!
export const ipfs = new PinataIPFS();

// Helper to convert string to bytes32 for contract
export function stringToBytes32(str: string): string {
  // For IPFS hashes, we just take first 32 chars and pad
  // In production, use proper IPFS hash encoding
  return "0x" + str.slice(0, 32).padEnd(64, "0");
}

// Helper to convert bytes32 back to string
export function bytes32ToString(bytes32: string): string {
  return bytes32.slice(2).replace(/0+$/, "");
}
