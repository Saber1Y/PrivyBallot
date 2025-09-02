"use client";

import { PrivyProvider } from "@privy-io/react-auth";

export default function Web3Provider({ children }: { children: React.ReactNode }) {
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
      }}
    >
      {children}
    </PrivyProvider>
  );
}
