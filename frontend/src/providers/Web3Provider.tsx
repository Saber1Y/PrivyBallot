"use client";

import { PrivyProvider } from "@privy-io/react-auth";

export default function Web3Provider({
  children,
}: {
  children: React.ReactNode;
}) {
  const appId = process.env.NEXT_PUBLIC_PRIVY_APP_ID as string;

  return (
    <PrivyProvider
      appId={appId}
      config={{
        loginMethods: ["wallet", "email", "google", "apple"],
        // Enable embedded wallets
        embeddedWallets: {
          createOnLogin: "users-without-wallets",
        },
        // Default to localhost for testing
        defaultChain: {
          id: 31337, // Localhost
          name: "Localhost",
          network: "localhost",
          nativeCurrency: {
            name: "ETH",
            symbol: "ETH",
            decimals: 18,
          },
          rpcUrls: {
            default: {
              http: ["http://localhost:8545"],
            },
            public: {
              http: ["http://localhost:8545"],
            },
          },
          blockExplorers: {
            default: {
              name: "Localhost",
              url: "http://localhost:8545",
            },
          },
          testnet: true,
        },
        // Add support for both localhost and Sepolia for development
        supportedChains: [
          {
            id: 31337, // Localhost
            name: "Localhost",
            network: "localhost",
            nativeCurrency: {
              name: "ETH",
              symbol: "ETH",
              decimals: 18,
            },
            rpcUrls: {
              default: {
                http: ["http://localhost:8545"],
              },
              public: {
                http: ["http://localhost:8545"],
              },
            },
            blockExplorers: {
              default: {
                name: "Localhost",
                url: "http://localhost:8545",
              },
            },
            testnet: true,
          },
          {
            id: 11155111, // Sepolia
            name: "Sepolia",
            network: "sepolia",
            nativeCurrency: {
              name: "SepoliaETH",
              symbol: "SEP",
              decimals: 18,
            },
            rpcUrls: {
              default: {
                http: [
                  "https://sepolia.infura.io/v3/b26f468efd8b4ec299c070e46c280a9c",
                ],
              },
              public: {
                http: [
                  "https://sepolia.infura.io/v3/b26f468efd8b4ec299c070e46c280a9c",
                ],
              },
            },
            blockExplorers: {
              default: {
                name: "Etherscan",
                url: "https://sepolia.etherscan.io",
              },
            },
            testnet: true,
          },
          {
            id: 31337, // Localhost
            name: "Localhost",
            network: "localhost",
            nativeCurrency: {
              name: "Ethereum",
              symbol: "ETH",
              decimals: 18,
            },
            rpcUrls: {
              default: {
                http: ["http://127.0.0.1:8545"],
              },
              public: {
                http: ["http://127.0.0.1:8545"],
              },
            },
            testnet: true,
          },
        ],
      }}
    >
      {children}
    </PrivyProvider>
  );
}
