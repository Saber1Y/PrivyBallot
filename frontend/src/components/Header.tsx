'use client';

import { ConnectButton } from '@rainbow-me/rainbowkit';
import { Shield, Vote } from 'lucide-react';

export function Header() {
  return (
    <header className="border-b border-gray-200 dark:border-gray-800 bg-white/80 dark:bg-gray-950/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center space-x-2">
            <div className="flex items-center justify-center w-8 h-8 bg-indigo-600 rounded-lg">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                PrivyBallot
              </h1>
              <p className="text-xs text-gray-500 dark:text-gray-400 -mt-1">
                Confidential Voting DAO
              </p>
            </div>
          </div>

          {/* Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <a
              href="#proposals"
              className="text-gray-700 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors flex items-center space-x-1"
            >
              <Vote className="w-4 h-4" />
              <span>Proposals</span>
            </a>
            <a
              href="#create"
              className="text-gray-700 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
            >
              Create Proposal
            </a>
          </nav>

          {/* Wallet Connection */}
          <ConnectButton />
        </div>
      </div>
    </header>
  );
}
