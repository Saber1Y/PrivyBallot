"use client";

import { useMemo, useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Plus, Vote, Clock, Eye, CheckCircle, AlertCircle } from "lucide-react";
import { usePrivy } from "@privy-io/react-auth";

type Proposal = {
  id: number;
  title: string;
  deadline: number; // ms timestamp
  revealed: boolean;
  decryptionPending: boolean;
  yes: number;
  no: number;
  hasVoted?: boolean;
};

export default function Dashboard() {
  // Mock app state (UI-first)
  const [proposals, setProposals] = useState<Proposal[]>([
    {
      id: 0,
      title: "Should we adopt confidential voting for all governance?",
      deadline: Date.now() + 1000 * 60 * 45, // 45m
      revealed: false,
      decryptionPending: false,
      yes: 0,
      no: 0,
    },
  ]);

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [title, setTitle] = useState("");
  const [duration, setDuration] = useState(3600); // seconds

  const { login, logout, authenticated, user } = usePrivy();

  const stats = useMemo(() => {
    const total = proposals.length;
    const active = proposals.filter((p) => p.deadline > Date.now()).length;
    const encryptionReady = false; // integration later
    return { total, active, encryptionReady };
  }, [proposals]);

  const createProposal = () => {
    if (!title.trim()) return;
    setProposals((prev) => [
      ...prev,
      {
        id: prev.length,
        title: title.trim(),
        deadline: Date.now() + duration * 1000,
        revealed: false,
        decryptionPending: false,
        yes: 0,
        no: 0,
      },
    ]);
    setTitle("");
    setShowCreateForm(false);
  };

  const vote = (id: number, choice: "yes" | "no") => {
    // UI-only: mark as voted; counts will reveal later
    setProposals((prev) =>
      prev.map((p) =>
        p.id === id && p.deadline > Date.now() && !p.hasVoted
          ? {
              ...p,
              hasVoted: true,
              yes: p.yes + (choice === "yes" ? 1 : 0),
              no: p.no + (choice === "no" ? 1 : 0),
            }
          : p
      )
    );
  };

  const requestReveal = (id: number) => {
    // UI-only: simulate decryption then reveal
    setProposals((prev) =>
      prev.map((p) => (p.id === id ? { ...p, decryptionPending: true } : p))
    );
    setTimeout(() => {
      setProposals((prev) =>
        prev.map((p) =>
          p.id === id ? { ...p, decryptionPending: false, revealed: true } : p
        )
      );
    }, 1200);
  };

  const formatTimeLeft = (deadline: number) => {
    const ms = deadline - Date.now();
    if (ms <= 0) return "Ended";
    const h = Math.floor(ms / 3_600_000);
    const m = Math.floor((ms % 3_600_000) / 60_000);
    return h > 0 ? `${h}h ${m}m left` : `${m}m left`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-800">PrivyBallot</h1>
            <p className="text-gray-600">Confidential Voting DAO</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs px-2 py-1 rounded-full bg-gray-200 text-gray-700">
              UI-only (mock)
            </span>
            {authenticated ? (
              <Button variant="outline" onClick={logout}>
                {user?.wallet?.address?.slice(0, 6)}... Logout
              </Button>
            ) : (
              <Button variant="outline" onClick={login}>
                Connect Wallet
              </Button>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="p-6">
            <div className="flex items-center">
              <Vote className="h-8 w-8 text-blue-600 mr-3" />
              <div>
                <p className="text-2xl font-bold text-gray-800">
                  {stats.total}
                </p>
                <p className="text-gray-600">Total Proposals</p>
              </div>
            </div>
          </Card>
          <Card className="p-6">
            <div className="flex items-center">
              <Clock className="h-8 w-8 text-green-600 mr-3" />
              <div>
                <p className="text-2xl font-bold text-gray-800">
                  {stats.active}
                </p>
                <p className="text-gray-600">Active Now</p>
              </div>
            </div>
          </Card>
          <Card className="p-6">
            <div className="flex items-center">
              <div className="h-8 w-8 bg-purple-600 rounded-full mr-3 flex items-center justify-center">
                <span className="text-white font-bold text-sm">🔒</span>
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-800">
                  {stats.encryptionReady ? "✓" : "⏳"}
                </p>
                <p className="text-gray-600">Encryption Ready</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Create Proposal */}
        <Card className="p-6 mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-gray-800">
              Create New Proposal
            </h2>
            <Button
              onClick={() => setShowCreateForm((s) => !s)}
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" /> New Proposal
            </Button>
          </div>

          {showCreateForm && (
            <div className="border-t pt-4">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Proposal Title
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g., Should we implement feature X?"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Voting Duration (seconds)
                  </label>
                  <select
                    value={duration}
                    onChange={(e) => setDuration(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value={300}>5 minutes</option>
                    <option value={1800}>30 minutes</option>
                    <option value={3600}>1 hour</option>
                    <option value={86400}>1 day</option>
                    <option value={604800}>1 week</option>
                  </select>
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={createProposal}
                    disabled={!title.trim()}
                    className="flex-1"
                  >
                    Create Proposal
                  </Button>
                  <Button
                    onClick={() => setShowCreateForm(false)}
                    variant="outline"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </div>
          )}
        </Card>

        {/* Proposals List */}
        <Card className="p-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">
            Active Proposals
          </h2>
          {proposals.length === 0 ? (
            <div className="text-center py-8">
              <Vote className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 text-lg">No proposals yet</p>
              <p className="text-gray-500">
                Create the first proposal to get started!
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {proposals.map((p) => (
                <div
                  key={p.id}
                  className="border border-gray-200 rounded-lg p-6 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-lg font-semibold text-gray-800">
                          Proposal #{p.id}
                        </h3>
                        <span
                          className={`px-2 py-1 text-xs rounded-full ${
                            p.deadline > Date.now()
                              ? "bg-green-100 text-green-800"
                              : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {p.deadline > Date.now() ? "Active" : "Ended"}
                        </span>
                      </div>
                      <p className="text-gray-700 mb-3 font-medium">
                        {p.title}
                      </p>
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <span className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />{" "}
                          {formatTimeLeft(p.deadline)}
                        </span>
                        {p.hasVoted && (
                          <span className="flex items-center gap-1 text-green-600">
                            <CheckCircle className="h-4 w-4" /> You voted
                          </span>
                        )}
                        {p.revealed && (
                          <span className="flex items-center gap-1 text-blue-600">
                            <Eye className="h-4 w-4" /> Results revealed
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Results (if revealed) */}
                  {p.revealed && (
                    <div className="mb-4 p-4 bg-blue-50 rounded-lg">
                      <h4 className="font-medium text-blue-900 mb-2">
                        Results:
                      </h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-green-600">
                            {p.yes}
                          </div>
                          <div className="text-sm text-gray-600">Yes votes</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-red-600">
                            {p.no}
                          </div>
                          <div className="text-sm text-gray-600">No votes</div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Voting Interface */}
                  <div className="flex gap-2 flex-wrap">
                    {p.deadline > Date.now() && !p.hasVoted && (
                      <>
                        <Button
                          onClick={() => vote(p.id, "yes")}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          Vote Yes
                        </Button>
                        <Button
                          onClick={() => vote(p.id, "no")}
                          className="bg-red-600 hover:bg-red-700"
                        >
                          Vote No
                        </Button>
                      </>
                    )}

                    {p.deadline <= Date.now() &&
                      !p.revealed &&
                      !p.decryptionPending && (
                        <Button
                          onClick={() => requestReveal(p.id)}
                          variant="outline"
                          className="flex items-center gap-2"
                        >
                          <Eye className="h-4 w-4" /> Reveal Results
                        </Button>
                      )}

                    {p.decryptionPending && (
                      <div className="text-sm text-blue-600 flex items-center gap-1">
                        <Clock className="h-4 w-4" /> Decryption in progress...
                      </div>
                    )}

                    {p.deadline > Date.now() && !p.hasVoted && (
                      <div className="text-sm text-orange-600 flex items-center gap-1">
                        <AlertCircle className="h-4 w-4" /> UI-only; encryption
                        comes later
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
