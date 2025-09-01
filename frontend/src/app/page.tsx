'use client';

import { Header } from '@/components/Header';
import { Shield, Lock, Eye, Users, CheckCircle, Clock } from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-cyan-50 dark:from-gray-950 dark:via-gray-900 dark:to-indigo-950">
      <Header />
      
      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-16">
          <div className="flex justify-center mb-6">
            <div className="flex items-center justify-center w-20 h-20 bg-indigo-600 rounded-2xl shadow-lg">
              <Shield className="w-10 h-10 text-white" />
            </div>
          </div>
          
          <h1 className="text-5xl font-bold text-gray-900 dark:text-white mb-6">
            Vote with Complete
            <span className="text-indigo-600 dark:text-indigo-400"> Privacy</span>
          </h1>
          
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto mb-8">
            PrivyBallot uses Zama's Fully Homomorphic Encryption to ensure your vote remains 
            completely private while maintaining transparency and verifiability.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3 rounded-lg font-semibold transition-colors shadow-lg">
              View Proposals
            </button>
            <button className="border border-indigo-600 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950 px-8 py-3 rounded-lg font-semibold transition-colors">
              Create Proposal
            </button>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <div className="bg-white dark:bg-gray-900 p-8 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800">
            <div className="flex items-center justify-center w-12 h-12 bg-green-100 dark:bg-green-900 rounded-lg mb-4">
              <Lock className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Complete Privacy
            </h3>
            <p className="text-gray-600 dark:text-gray-300">
              Your vote choices are never visible on-chain. Even validators can't see how you voted.
            </p>
          </div>

          <div className="bg-white dark:bg-gray-900 p-8 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800">
            <div className="flex items-center justify-center w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg mb-4">
              <Eye className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Transparent Results
            </h3>
            <p className="text-gray-600 dark:text-gray-300">
              Final tallies are cryptographically verified and publicly visible after voting ends.
            </p>
          </div>

          <div className="bg-white dark:bg-gray-900 p-8 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800">
            <div className="flex items-center justify-center w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-lg mb-4">
              <Users className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Democratic Governance
            </h3>
            <p className="text-gray-600 dark:text-gray-300">
              Anyone can create proposals and participate in shaping the community's future.
            </p>
          </div>
        </div>

        {/* Active Proposals Section */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 p-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Active Proposals
            </h2>
            <button className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 font-semibold">
              View All
            </button>
          </div>

          {/* Sample Proposal Cards */}
          <div className="space-y-4">
            <div className="border border-gray-200 dark:border-gray-700 rounded-xl p-6 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    Should we implement new governance features?
                  </h3>
                  <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                    <span className="flex items-center space-x-1">
                      <Clock className="w-4 h-4" />
                      <span>2 days remaining</span>
                    </span>
                    <span>•</span>
                    <span>127 votes cast</span>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 px-2 py-1 rounded-full text-xs font-medium">
                    Active
                  </span>
                </div>
              </div>
              
              <div className="flex space-x-3">
                <button className="flex-1 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 py-2 px-4 rounded-lg font-medium hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors">
                  Vote Yes
                </button>
                <button className="flex-1 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 py-2 px-4 rounded-lg font-medium hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors">
                  Vote No
                </button>
              </div>
            </div>

            <div className="border border-gray-200 dark:border-gray-700 rounded-xl p-6 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    Proposal to upgrade smart contract infrastructure
                  </h3>
                  <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                    <span className="flex items-center space-x-1">
                      <CheckCircle className="w-4 h-4" />
                      <span>Ended</span>
                    </span>
                    <span>•</span>
                    <span>89 votes cast</span>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 px-2 py-1 rounded-full text-xs font-medium">
                    Completed
                  </span>
                </div>
              </div>
              
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                <div className="flex justify-between text-sm font-medium mb-2">
                  <span className="text-green-600 dark:text-green-400">Yes: 67</span>
                  <span className="text-red-600 dark:text-red-400">No: 22</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div 
                    className="bg-green-500 h-2 rounded-full" 
                    style={{ width: '75%' }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
