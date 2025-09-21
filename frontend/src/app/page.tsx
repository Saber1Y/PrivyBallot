"use client";

import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Shield, Lock, Vote, Zap, Users, Key } from "lucide-react";
import { BackgroundBeamsWithCollision } from "@/components/ui/background-beams-with-collision";
import { Meteors } from "@/components/ui/meteors";

export default function Landing() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header / Navigation */}
      <header className="sticky top-0 z-10 bg-white/70 backdrop-blur border-b border-gray-200">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <span className="font-semibold text-gray-900">PrivyBallot</span>
          </Link>
          <nav className="hidden md:flex items-center gap-6 text-sm text-gray-700">
            <a href="#features" className="hover:text-gray-900">
              Features
            </a>
            <a href="#how" className="hover:text-gray-900">
              How it works
            </a>
            <Link href="/dashboard" className="hover:text-gray-900">
              Dashboard
            </Link>
            <a
              href="https://github.com/Saber1Y/PrivyBallot"
              target="_blank"
              rel="noreferrer"
              className="hover:text-gray-900"
            >
              GitHub
            </a>
          </nav>
          <div className="flex items-center gap-2">
            <Link href="/dashboard">
              <Button size="sm">Open Dashboard</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Main */}
      <main>
        {/* Hero - Beams with Collision */}
        <BackgroundBeamsWithCollision>
          <div className="container mx-auto px-4 py-20 relative z-10">
            <div className="grid md:grid-cols-2 gap-10 items-center">
              <div>
                <span className="inline-block mb-4 text-xs font-medium text-blue-700 bg-blue-100 px-3 py-1 rounded-full">
                  FHE + Privy + Next.js
                </span>
                <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-4">
                  Confidential voting for DAOs, made simple
                </h1>
                <p className="text-lg text-gray-700 mb-6">
                  Create proposals, cast encrypted votes, and reveal results
                  securely with Zama FHEVM. Wallet auth powered by Privy.
                </p>
                <div className="flex flex-wrap items-center gap-3">
                  <Link href="/dashboard">
                    <Button className="px-6 h-12 text-base">Get Started</Button>
                  </Link>
                  <a
                    href="https://github.com/"
                    target="_blank"
                    rel="noreferrer"
                  >
                    <Button variant="outline" className="px-6 h-12 text-base">
                      View on GitHub
                    </Button>
                  </a>
                </div>
              </div>
              <div className="relative">
                <div className="absolute -inset-4 bg-gradient-to-tr from-blue-200 to-indigo-200 blur-2xl rounded-full opacity-60"></div>
                <Card className="relative p-6">
                  <CardHeader className="pb-2">
                    <CardTitle>Secure, private, verifiable</CardTitle>
                  </CardHeader>
                  <CardContent className="text-gray-600">
                    <ul className="space-y-3">
                      <li className="flex items-center gap-2">
                        <Shield className="h-5 w-5 text-blue-600" /> End-to-end
                        encrypted votes
                      </li>
                      <li className="flex items-center gap-2">
                        <Lock className="h-5 w-5 text-blue-600" /> Results
                        revealed only after deadline
                      </li>
                      <li className="flex items-center gap-2">
                        <Key className="h-5 w-5 text-blue-600" /> Threshold
                        decryption via FHE
                      </li>
                    </ul>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </BackgroundBeamsWithCollision>

        {/* Features */}
        <section id="features" className="container mx-auto px-4 py-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-6 text-center">
            Features
          </h2>
          <p className="text-gray-600 text-center max-w-2xl mx-auto mb-10">
            Built with modern primitives and a clean developer experience.
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Card 1 */}
            <div className="relative">
              <div className="absolute inset-0 h-full w-full scale-[0.92] transform rounded-2xl bg-gradient-to-r from-blue-500/40 to-teal-500/40 blur-3xl" />
              <Card className="relative overflow-hidden p-6 border-gray-200 bg-gray-900 text-white shadow-xl">
                <div className="mb-3 flex h-6 w-6 items-center justify-center rounded-full border border-gray-700">
                  <div className="h-1 w-1 rounded-full bg-gray-400" />
                </div>
                <div className="flex items-start gap-3">
                  <div className="h-10 w-10 rounded-md bg-blue-600 text-white flex items-center justify-center">
                    <Vote className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="font-semibold">DAO proposals</h3>
                    <p className="text-sm text-gray-300">
                      Create, list, and manage proposals with deadlines and
                      states.
                    </p>
                  </div>
                </div>
                <Meteors number={14} />
              </Card>
            </div>

            {/* Card 2 */}
            <div className="relative">
              <div className="absolute inset-0 h-full w-full scale-[0.92] transform rounded-2xl bg-gradient-to-r from-indigo-500/40 to-cyan-500/40 blur-3xl" />
              <Card className="relative overflow-hidden p-6 border-gray-200 bg-gray-900 text-white shadow-xl">
                <div className="mb-3 flex h-6 w-6 items-center justify-center rounded-full border border-gray-700">
                  <div className="h-1 w-1 rounded-full bg-gray-400" />
                </div>
                <div className="flex items-start gap-3">
                  <div className="h-10 w-10 rounded-md bg-indigo-600 text-white flex items-center justify-center">
                    <Lock className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Encrypted votes</h3>
                    <p className="text-sm text-gray-300">
                      Votes are kept private on-chain via Zama&#39;s FHEVM.
                    </p>
                  </div>
                </div>
                <Meteors number={12} />
              </Card>
            </div>

            {/* Card 3 */}
            <div className="relative">
              <div className="absolute inset-0 h-full w-full scale-[0.92] transform rounded-2xl bg-gradient-to-r from-purple-500/40 to-pink-500/40 blur-3xl" />
              <Card className="relative overflow-hidden p-6 border-gray-200 bg-gray-900 text-white shadow-xl">
                <div className="mb-3 flex h-6 w-6 items-center justify-center rounded-full border border-gray-700">
                  <div className="h-1 w-1 rounded-full bg-gray-400" />
                </div>
                <div className="flex items-start gap-3">
                  <div className="h-10 w-10 rounded-md bg-purple-600 text-white flex items-center justify-center">
                    <Users className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Privy auth</h3>
                    <p className="text-sm text-gray-300">
                      Fast, secure wallet onboarding with @privy-io/react-auth.
                    </p>
                  </div>
                </div>
                <Meteors number={10} />
              </Card>
            </div>

            {/* Card 4 */}
            <div className="relative">
              <div className="absolute inset-0 h-full w-full scale-[0.92] transform rounded-2xl bg-gradient-to-r from-emerald-500/40 to-green-500/40 blur-3xl" />
              <Card className="relative overflow-hidden p-6 border-gray-200 bg-gray-900 text-white shadow-xl">
                <div className="mb-3 flex h-6 w-6 items-center justify-center rounded-full border border-gray-700">
                  <div className="h-1 w-1 rounded-full bg-gray-400" />
                </div>
                <div className="flex items-start gap-3">
                  <div className="h-10 w-10 rounded-md bg-emerald-600 text-white flex items-center justify-center">
                    <Zap className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Next.js 15</h3>
                    <p className="text-sm text-gray-300">
                      App Router, optimized builds, and Tailwind styling.
                    </p>
                  </div>
                </div>
                <Meteors number={12} />
              </Card>
            </div>

            {/* Card 5 */}
            <div className="relative">
              <div className="absolute inset-0 h-full w-full scale-[0.92] transform rounded-2xl bg-gradient-to-r from-rose-500/40 to-orange-500/40 blur-3xl" />
              <Card className="relative overflow-hidden p-6 border-gray-200 bg-gray-900 text-white shadow-xl">
                <div className="mb-3 flex h-6 w-6 items-center justify-center rounded-full border border-gray-700">
                  <div className="h-1 w-1 rounded-full bg-gray-400" />
                </div>
                <div className="flex items-start gap-3">
                  <div className="h-10 w-10 rounded-md bg-rose-600 text-white flex items-center justify-center">
                    <Shield className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Verifiable results</h3>
                    <p className="text-sm text-gray-300">
                      Reveal tallies after the deadline with proof of integrity.
                    </p>
                  </div>
                </div>
                <Meteors number={16} />
              </Card>
            </div>

            {/* Card 6 */}
            <div className="relative">
              <div className="absolute inset-0 h-full w-full scale-[0.92] transform rounded-2xl bg-gradient-to-r from-amber-500/40 to-yellow-500/40 blur-3xl" />
              <Card className="relative overflow-hidden p-6 border-gray-200 bg-gray-900 text-white shadow-xl">
                <div className="mb-3 flex h-6 w-6 items-center justify-center rounded-full border border-gray-700">
                  <div className="h-1 w-1 rounded-full bg-gray-400" />
                </div>
                <div className="flex items-start gap-3">
                  <div className="h-10 w-10 rounded-md bg-amber-600 text-white flex items-center justify-center">
                    <Key className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="font-semibold">FHE-ready</h3>
                    <p className="text-sm text-gray-300">
                      Clean abstraction for future FHE contract integration.
                    </p>
                  </div>
                </div>
                <Meteors number={10} />
              </Card>
            </div>
          </div>
        </section>

        {/* How it works */}
        <section id="how" className="container mx-auto px-4 py-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-6 text-center">
            How it works
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            {/* Step 1 */}
            <div className="relative">
              <div className="absolute inset-0 h-full w-full scale-[0.92] transform rounded-2xl bg-gradient-to-r from-blue-500/40 to-cyan-500/40 blur-3xl" />
              <Card className="relative overflow-hidden p-6 border-gray-200 bg-gray-900 text-white shadow-xl">
                <div className="mb-3 flex h-6 w-6 items-center justify-center rounded-full border border-gray-700">
                  <div className="h-1 w-1 rounded-full bg-gray-400" />
                </div>
                <h3 className="text-xl font-semibold mb-2">1. Create</h3>
                <p className="text-gray-300">
                  Propose a question and set a voting deadline. The app prepares
                  encryption keys.
                </p>
                <Meteors number={10} />
              </Card>
            </div>

            {/* Step 2 */}
            <div className="relative">
              <div className="absolute inset-0 h-full w-full scale-[0.92] transform rounded-2xl bg-gradient-to-r from-purple-500/40 to-pink-500/40 blur-3xl" />
              <Card className="relative overflow-hidden p-6 border-gray-200 bg-gray-900 text-white shadow-xl">
                <div className="mb-3 flex h-6 w-6 items-center justify-center rounded-full border border-gray-700">
                  <div className="h-1 w-1 rounded-full bg-gray-400" />
                </div>
                <h3 className="text-xl font-semibold mb-2">2. Vote</h3>
                <p className="text-gray-300">
                  Members cast encrypted yes/no votes that remain private
                  on-chain.
                </p>
                <Meteors number={10} />
              </Card>
            </div>

            {/* Step 3 */}
            <div className="relative">
              <div className="absolute inset-0 h-full w-full scale-[0.92] transform rounded-2xl bg-gradient-to-r from-emerald-500/40 to-teal-500/40 blur-3xl" />
              <Card className="relative overflow-hidden p-6 border-gray-200 bg-gray-900 text-white shadow-xl">
                <div className="mb-3 flex h-6 w-6 items-center justify-center rounded-full border border-gray-700">
                  <div className="h-1 w-1 rounded-full bg-gray-400" />
                </div>
                <h3 className="text-xl font-semibold mb-2">3. Reveal</h3>
                <p className="text-gray-300">
                  After the deadline, decrypt and publish final tallies for
                  everyone to verify.
                </p>
                <Meteors number={10} />
              </Card>
            </div>
          </div>
        </section>

        {/* Secondary CTA */}
        <section className="container mx-auto px-4 pb-20">
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 p-8 md:p-10 text-white flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <h3 className="text-2xl font-bold mb-2">
                Ready to participate in governance?
              </h3>
              <p className="text-white/90">
                Enter the dashboard to vote on active proposals or create your
                own.
              </p>
            </div>
            <Link href="/dashboard">
              <Button
                variant="ghost"
                className="bg-white text-blue-700 hover:bg-gray-100"
              >
                Enter App
              </Button>
            </Link>
            <Meteors number={14} className="bg-white/70 before:from-white/80" />
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-white">
        <div className="container mx-auto px-4 py-6 flex flex-col md:flex-row items-center justify-between gap-3 text-sm text-gray-600">
          <p>© {new Date().getFullYear()} PrivyBallot. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <a
              href="https://github.com/Saber1Y/PrivyBallot"
              target="_blank"
              rel="noreferrer"
              className="hover:text-gray-900"
            >
              GitHub
            </a>
            <Link href="/dashboard" className="hover:text-gray-900">
              Dashboard
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
