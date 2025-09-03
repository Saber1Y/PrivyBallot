// FHE encryption service using Zama FHE SDK
import { createInstance } from "@zama-fhe/relayer-sdk";

export interface FHEInstance {
  createEncryptedInput: (contractAddress: string, userAddress: string) => any;
  instance: any;
}

let cachedFheInstance: FHEInstance | null = null;

export async function initializeFHE(
  contractAddress: string,
  userAddress: string
): Promise<FHEInstance> {
  if (cachedFheInstance) {
    return cachedFheInstance;
  }

  try {
    console.log("Initializing FHE instance...");

    // For localhost/development, we'll use a simplified approach
    // In production, these would be the actual deployed contract addresses
    const chainId =
      typeof window !== "undefined" && window.ethereum
        ? await window.ethereum.request({ method: "eth_chainId" })
        : "0x7a69"; // localhost default

    const gatewayUrl = "https://gateway.sepolia.zama.ai";
    const kmsAddress = "0x"; // Will be set based on actual deployment
    const aclAddress = "0x"; // Will be set based on actual deployment

    if (chainId === "0x7a69" || chainId === "31337") {
      // For localhost, we'll mock the FHE functionality
      console.log("Using localhost - FHE will be mocked");
      const mockInstance = {
        createEncryptedInput: () => ({
          addBool: () => {},
          encrypt: () => ({
            handles: ["0x" + Math.random().toString(16).substr(2, 64)],
            inputProof: "0x" + Math.random().toString(16).substr(2, 128),
          }),
        }),
      };

      const fheInstance: FHEInstance = {
        createEncryptedInput: mockInstance.createEncryptedInput,
        instance: mockInstance,
      };

      cachedFheInstance = fheInstance;
      return fheInstance;
    }

    // Create real FHE instance for Sepolia/mainnet
    const instance = await createInstance({
      kmsContractAddress: kmsAddress,
      aclContractAddress: aclAddress,
      gatewayUrl,
    });

    const fheInstance: FHEInstance = {
      createEncryptedInput: (contractAddr: string, userAddr: string) => {
        return instance.createEncryptedInput(contractAddr, userAddr);
      },
      instance,
    };

    cachedFheInstance = fheInstance;
    console.log("FHE instance initialized successfully");
    return fheInstance;
  } catch (error) {
    console.error("Failed to initialize FHE:", error);
    throw new Error("FHE initialization failed");
  }
}

export async function encryptVote(
  choice: boolean,
  contractAddress: string,
  userAddress: string
): Promise<{ encryptedChoice: string; inputProof: string }> {
  try {
    const fhe = await initializeFHE(contractAddress, userAddress);

    // Create encrypted input
    const input = fhe.createEncryptedInput(contractAddress, userAddress);
    input.addBool(choice);

    const encryptedInput = input.encrypt();

    return {
      encryptedChoice: encryptedInput.handles[0],
      inputProof: encryptedInput.inputProof,
    };
  } catch (error) {
    console.error("Failed to encrypt vote:", error);
    throw new Error("Vote encryption failed");
  }
}

export function clearFHECache(): void {
  cachedFheInstance = null;
}
