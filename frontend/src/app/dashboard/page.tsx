"use client";

import React, { useState, useEffect, useCallback } from "react";
import { usePrivy } from "@privy-io/react-auth";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import {
  PlusCircle,
  LogIn,
  LogOut,
  Clock,
  CheckCircle,
  Eye,
  Network,
  Trash2,
} from "lucide-react";
import {
  fetchProposals,
  createProposalTx,
  PublicProposal,
  ProposalMetadata,
  voteTx,
  requestRevealTx,
  deleteProposalMetadata,
} from "@/lib/dao";
import { CountdownTimer } from "@/components/ui/CountdownTimer";

export default function Dashboard() {
  const { ready, authenticated, login, logout, user } = usePrivy();
  const [proposals, setProposals] = useState<PublicProposal[]>([]);
  const [newProposalTitle, setNewProposalTitle] = useState("");
  const [newProposalDescription, setNewProposalDescription] = useState("");
  const [duration, setDuration] = useState("1h");
  const [loading, setLoading] = useState(false);
  const [currentNetwork, setCurrentNetwork] = useState<string>("");
  const [networkError, setNetworkError] = useState<string>("");

  // Check current network
  const checkNetwork = useCallback(async () => {
    if (typeof window === "undefined" || !window.ethereum) return;

    try {
      const { BrowserProvider } = await import("ethers");
      const provider = new BrowserProvider(window.ethereum);
      const network = await provider.getNetwork();
      const chainId = Number(network.chainId);

      let networkName = "";
      switch (chainId) {
        case 1:
          networkName = "Ethereum Mainnet";
          break;
        case 11155111:
          networkName = "Sepolia Testnet";
          break;
        case 31337:
          networkName = "Localhost";
          break;
        default:
          networkName = `Unknown (${chainId})`;
      }

      setCurrentNetwork(networkName);
      setNetworkError("");

      // Check if we're on the expected network (localhost for development)
      const expectedChainId = 31337; // Localhost
      if (chainId !== expectedChainId) {
        setNetworkError(
          `Please switch to Localhost network. Currently on: ${networkName}`
        );
      }
    } catch (error) {
      console.error("Network check failed:", error);
      setNetworkError("Failed to detect network");
    }
  }, []);

  // Switch to localhost network
  const switchToLocalhost = async () => {
    if (typeof window === "undefined" || !window.ethereum) return;

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (window.ethereum as any).request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: "0x7a69" }], // 31337 in hex
      });
      await checkNetwork();
    } catch (error: unknown) {
      if ((error as { code?: number })?.code === 4902) {
        // Chain not added to wallet, add it
        try {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          await (window.ethereum as any).request({
            method: "wallet_addEthereumChain",
            params: [
              {
                chainId: "0x7a69",
                chainName: "Localhost",
                nativeCurrency: {
                  name: "Ethereum",
                  symbol: "ETH",
                  decimals: 18,
                },
                rpcUrls: ["http://127.0.0.1:8545"],
                blockExplorerUrls: [],
              },
            ],
          });
          await checkNetwork();
        } catch (addError) {
          console.error("Failed to add localhost network:", addError);
        }
      } else {
        console.error("Failed to switch network:", error);
      }
    }
  };

  // Load proposals on component mount and when auth changes
  const loadProposals = useCallback(async () => {
    try {
      const account = user?.wallet?.address;
      const data = await fetchProposals(account);
      setProposals(data);
    } catch (error) {
      console.error("Failed to load proposals:", error);
    }
  }, [user?.wallet?.address]);

  // Only load proposals when user is authenticated and ready, with a delay
  useEffect(() => {
    if (ready && authenticated && user?.wallet?.address) {
      // Add a 2 second delay to reduce rapid requests
      const timer = setTimeout(() => {
        loadProposals();
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [ready, authenticated, user?.wallet?.address, loadProposals]);

  // Check network when authenticated
  useEffect(() => {
    if (ready && authenticated) {
      checkNetwork();
    }
  }, [ready, authenticated, checkNetwork]);

  const createProposal = async () => {
    if (!newProposalTitle.trim() || !newProposalDescription.trim()) return;

    setLoading(true);
    try {
      const durationMap: Record<string, number> = {
        "5m": 300,
        "30m": 1800,
        "1h": 3600,
        "1d": 86400,
        "1w": 604800,
      };

      const metadata: ProposalMetadata = {
        title: newProposalTitle.trim(),
        description: newProposalDescription.trim(),
        options: ["Yes", "No"],
        creator: user?.wallet?.address || "unknown",
        createdAt: Date.now(),
        tags: ["governance"],
      };

      await createProposalTx(metadata, durationMap[duration]);

      // Clear form
      setNewProposalTitle("");
      setNewProposalDescription("");
      setDuration("1h");

      // Reload proposals
      await loadProposals();
    } catch (error) {
      console.error("Failed to create proposal:", error);
    }
    setLoading(false);
  };

  const vote = async (id: number, choice: "yes" | "no") => {
    if (!user?.wallet?.address) return;

    try {
      await voteTx(id, choice === "yes", user.wallet.address);

      // Update the UI immediately
      setProposals(
        proposals.map((p) =>
          p.id === id && !p.hasVoted && p.deadline > Date.now()
            ? {
                ...p,
                hasVoted: true,
                yes: choice === "yes" ? p.yes + 1 : p.yes,
                no: choice === "no" ? p.no + 1 : p.no,
              }
            : p
        )
      );

      // Reload proposals to get fresh data
      await loadProposals();
    } catch (error) {
      console.error("Failed to vote:", error);
      // Show user-friendly error
      alert("Failed to submit vote. Please check console for details.");
    }
  };

  const requestReveal = async (id: number) => {
    try {
      // Update UI to show pending state
      setProposals(
        proposals.map((p) =>
          p.id === id ? { ...p, decryptionPending: true } : p
        )
      );

      console.log("Requesting reveal for proposal:", id);
      const result = await requestRevealTx(id);
      console.log("Reveal requested, result:", result);

      // Listen for reveal completion by polling the contract
      // In a real app, you'd listen to events or use websockets
      const pollForReveal = async () => {
        for (let i = 0; i < 30; i++) {
          // Poll for up to 30 seconds
          await new Promise((resolve) => setTimeout(resolve, 1000)); // Wait 1 second

          try {
            // Reload proposals to check if reveal is complete
            const account = user?.wallet?.address;
            const updatedProposals = await fetchProposals(account);
            const proposal = updatedProposals.find((p) => p.id === id);

            if (proposal && proposal.revealed) {
              console.log("Reveal completed for proposal:", id);
              setProposals(updatedProposals);
              return;
            }
          } catch (error) {
            console.warn("Error polling for reveal:", error);
          }
        }

        // If we get here, reveal didn't complete in time
        console.warn("Reveal polling timed out");
        setProposals((prevProposals) =>
          prevProposals.map((p) =>
            p.id === id ? { ...p, decryptionPending: false } : p
          )
        );
      };

      // Start polling in background
      pollForReveal();
    } catch (error) {
      console.error("Failed to request reveal:", error);
      // Reset pending state on error
      setProposals(
        proposals.map((p) =>
          p.id === id ? { ...p, decryptionPending: false } : p
        )
      );
      // Show user-friendly error
      alert("Failed to request reveal. Please check console for details.");
    }
  };

  const deleteProposal = async (proposal: PublicProposal) => {
    if (!user?.wallet?.address) return;

    // Check if user is the creator
    if (proposal.creator.toLowerCase() !== user.wallet.address.toLowerCase()) {
      console.warn("Only the proposal creator can delete it");
      return;
    }

    // Allow deletion even if metadata is null (for corrupted/truncated IPFS hashes)
    const confirmMessage = proposal.metadata
      ? `Are you sure you want to delete the IPFS metadata for "${proposal.metadata.title}"?\n\nNote: This only removes the metadata from IPFS. The proposal record will remain on the blockchain.`
      : `Are you sure you want to delete the IPFS metadata for Proposal #${proposal.id}?\n\nNote: This only removes metadata from IPFS (if possible). The proposal record will remain on the blockchain.`;

    if (!confirm(confirmMessage)) {
      return;
    }

    try {
      console.log("Deleting proposal metadata:", proposal.ipfsHash);
      const success = await deleteProposalMetadata(proposal.ipfsHash);

      if (success) {
        console.log("✅ Proposal metadata deletion completed");
        // Reload proposals to reflect the change
        await loadProposals();
      } else {
        console.warn("⚠️ Proposal metadata deletion may have failed");
        // Still reload proposals in case the proposal was marked as deleted
        await loadProposals();
      }
    } catch (error) {
      console.error("Error deleting proposal:", error);
      // Don't show an error to user since the issue is likely with IPFS hash format
      // Just reload to see current state
      await loadProposals();
    }
  };

  const handleProposalExpire = useCallback(async () => {
    // Add debouncing to prevent infinite loops and rate limiting
    if (loading) return;

    console.log(
      "Proposal expired, but skipping refresh to avoid rate limiting"
    );
    console.log(
      "Use the manual 'Refresh Proposals' button to update proposals"
    );

    // Don't automatically refresh to avoid hitting IPFS rate limits
    // The user can manually refresh if needed
  }, [loading]);

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b p-4">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-xl font-bold">PrivyBallot Dashboard</h1>
            {authenticated && currentNetwork && (
              <div className="flex items-center gap-2 mt-1">
                <span className="text-sm text-gray-600">
                  Network: {currentNetwork}
                </span>
                {networkError && (
                  <span className="text-xs text-red-600 bg-red-50 px-2 py-1 rounded">
                    {networkError}
                  </span>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            {authenticated && (
              <Button
                variant="outline"
                size="sm"
                onClick={switchToLocalhost}
                className="text-xs"
              >
                <Network className="mr-1 h-3 w-3" />
                Localhost
              </Button>
            )}
            {ready && (
              <Button onClick={authenticated ? logout : login}>
                {authenticated ? (
                  <>
                    <LogOut className="mr-2 h-4 w-4" /> Logout
                  </>
                ) : (
                  <>
                    <LogIn className="mr-2 h-4 w-4" /> Connect Wallet
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-6 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Total Proposals</CardTitle>
            </CardHeader>
            <CardContent>{proposals.length}</CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Active Proposals</CardTitle>
            </CardHeader>
            <CardContent>
              {proposals.filter((p) => p.deadline > Date.now()).length}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Encryption</CardTitle>
            </CardHeader>
            <CardContent>FHE-ready</CardContent>
          </Card>
        </div>

        {/* Proposals First */}
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">Proposals</h2>
            <Button
              variant="outline"
              onClick={loadProposals}
              disabled={loading}
              className="flex items-center gap-2"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              Refresh
            </Button>
          </div>
          <div className="space-y-4">
            {proposals.length === 0 ? (
              <Card>
                <CardContent className="text-center py-8">
                  <p className="text-gray-500 mb-2">No proposals found</p>
                  <p className="text-sm text-gray-400">
                    Try clicking the Refresh button above or create a new
                    proposal below.
                  </p>
                  <p className="text-xs text-orange-500 mt-2">
                    Note: If you see circuit breaker warnings in the console,
                    wait a moment before refreshing.
                  </p>
                </CardContent>
              </Card>
            ) : (
              proposals.map((p) => (
                <Card key={p.id}>
                  <CardHeader className="flex justify-between items-center">
                    <CardTitle>
                      {p.metadata?.title ||
                        `Proposal #${p.id} (Metadata unavailable)`}
                    </CardTitle>
                    <Badge
                      variant={
                        p.deadline > Date.now() ? "default" : "secondary"
                      }
                    >
                      {p.deadline > Date.now() ? "Active" : "Ended"}
                    </Badge>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {!p.metadata && (
                      <div className="bg-yellow-50 border border-yellow-200 rounded p-3 text-sm">
                        <div className="text-yellow-800 font-medium">
                          ⚠️ Metadata unavailable
                        </div>
                        <div className="text-yellow-700 mt-1">
                          IPFS hash:{" "}
                          <code className="text-xs bg-yellow-100 px-1 rounded">
                            {p.ipfsHash}
                          </code>
                          {p.ipfsHash && p.ipfsHash.length < 46 && (
                            <span className="text-red-600 ml-1">
                              (truncated)
                            </span>
                          )}
                        </div>
                        <div className="text-yellow-600 text-xs mt-1">
                          {p.ipfsHash && p.ipfsHash.length < 46
                            ? "This is a legacy proposal with a truncated IPFS hash. Consider recreating the proposal."
                            : "This may be due to IPFS gateway issues or an invalid hash. New proposals will handle long hashes better."}
                        </div>
                      </div>
                    )}
                    {p.metadata && (
                      <div className="text-sm text-gray-600">
                        {p.metadata.description}
                      </div>
                    )}
                    <CountdownTimer
                      deadline={p.deadline}
                      onExpire={handleProposalExpire}
                    />
                    {p.deadline > Date.now() ? (
                      <div className="flex space-x-2">
                        <Button
                          onClick={() => vote(p.id, "yes")}
                          disabled={p.hasVoted}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          {p.hasVoted ? "✓ " : ""}Yes
                        </Button>
                        <Button
                          onClick={() => vote(p.id, "no")}
                          disabled={p.hasVoted}
                          className="bg-red-600 hover:bg-red-700"
                        >
                          {p.hasVoted ? "✓ " : ""}No
                        </Button>
                      </div>
                    ) : p.revealed ? (
                      <div className="p-3 bg-blue-50 rounded">
                        <div className="text-sm font-medium mb-1">Results:</div>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div>Yes: {p.yes}</div>
                          <div>No: {p.no}</div>
                        </div>
                      </div>
                    ) : p.decryptionPending ? (
                      <div className="flex items-center gap-2 text-blue-600">
                        <Clock className="h-4 w-4" />
                        Decrypting results...
                      </div>
                    ) : (
                      <Button
                        onClick={() => requestReveal(p.id)}
                        variant="outline"
                        className="flex items-center gap-2"
                      >
                        <Eye className="h-4 w-4" />
                        Reveal Results
                      </Button>
                    )}
                    <div className="flex items-center justify-between">
                      {p.hasVoted && (
                        <div className="flex items-center gap-1 text-green-600 text-sm">
                          <CheckCircle className="h-4 w-4" />
                          You voted
                        </div>
                      )}
                      {user?.wallet?.address &&
                        p.creator.toLowerCase() ===
                          user.wallet.address.toLowerCase() && (
                          <Button
                            onClick={() => deleteProposal(p)}
                            variant="outline"
                            size="sm"
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            title="Delete IPFS metadata (proposal will remain on blockchain)"
                          >
                            <Trash2 className="h-4 w-4 mr-1" />
                            Delete Metadata
                          </Button>
                        )}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>

        {/* Create Proposal as secondary */}
        {authenticated && (
          <div>
            <h2 className="text-lg font-semibold mb-4 flex items-center">
              <PlusCircle className="mr-2 h-5 w-5" /> Create Proposal
            </h2>
            <Card>
              <CardContent className="space-y-4 pt-4">
                <Input
                  placeholder="Proposal Title"
                  value={newProposalTitle}
                  onChange={(e) => setNewProposalTitle(e.target.value)}
                />
                <textarea
                  placeholder="Detailed description of the proposal..."
                  value={newProposalDescription}
                  onChange={(e) => setNewProposalDescription(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-md min-h-[100px] focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <select
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  className="border border-gray-300 p-3 rounded-md w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="5m">5 minutes</option>
                  <option value="30m">30 minutes</option>
                  <option value="1h">1 hour</option>
                  <option value="1d">1 day</option>
                  <option value="1w">1 week</option>
                </select>
                <div className="flex space-x-2">
                  <Button
                    onClick={createProposal}
                    disabled={
                      !newProposalTitle.trim() ||
                      !newProposalDescription.trim() ||
                      loading
                    }
                    className="flex-1"
                  >
                    {loading ? "Creating..." : "Create Proposal"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
}
