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
} from "lucide-react";
import {
  fetchProposals,
  createProposalTx,
  PublicProposal,
  ProposalMetadata,
} from "@/lib/dao";

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

  useEffect(() => {
    loadProposals();
  }, [loadProposals]);

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

  const vote = (id: number, choice: "yes" | "no") => {
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
  };

  const requestReveal = (id: number) => {
    setProposals(
      proposals.map((p) =>
        p.id === id ? { ...p, decryptionPending: true } : p
      )
    );
    setTimeout(() => {
      setProposals(
        proposals.map((p) =>
          p.id === id ? { ...p, decryptionPending: false, revealed: true } : p
        )
      );
    }, 2000);
  };

  const formatTimeLeft = (deadline: number) => {
    const diff = deadline - Date.now();
    if (diff <= 0) return "Ended";
    const mins = Math.floor(diff / 60000);
    return mins < 60
      ? `${mins}m left`
      : `${Math.floor(mins / 60)}h ${mins % 60}m left`;
  };

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
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={switchToLocalhost}
                  className="text-xs"
                >
                  <Network className="mr-1 h-3 w-3" />
                  Localhost
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={switchToLocalhost}
                  className="text-xs"
                >
                  <Network className="mr-1 h-3 w-3" />
                  Localhost
                </Button>
              </>
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
          <h2 className="text-lg font-semibold mb-4">Proposals</h2>
          <div className="space-y-4">
            {proposals.map((p) => (
              <Card key={p.id}>
                <CardHeader className="flex justify-between items-center">
                  <CardTitle>{p.metadata?.title || "Loading..."}</CardTitle>
                  <Badge
                    variant={p.deadline > Date.now() ? "default" : "secondary"}
                  >
                    {p.deadline > Date.now() ? "Active" : "Ended"}
                  </Badge>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="text-sm text-gray-600">
                    {p.metadata?.description || "Loading description..."}
                  </div>
                  <div className="text-sm text-gray-500">
                    {formatTimeLeft(p.deadline)}
                  </div>
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
                  {p.hasVoted && (
                    <div className="flex items-center gap-1 text-green-600 text-sm">
                      <CheckCircle className="h-4 w-4" />
                      You voted
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
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
