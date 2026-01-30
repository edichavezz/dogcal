'use client';

/**
 * Admin Client Component
 *
 * Client-side component for admin interface with three tabs.
 */

import { useState } from 'react';
import UserSelector from '../components/UserSelector';
import ManageUsers from './ManageUsers';
import GenerateTokens from './GenerateTokens';
import PawsIcon from '../components/PawsIcon';

type Tab = 'login' | 'manage' | 'tokens';

export default function AdminClient() {
  const [activeTab, setActiveTab] = useState<Tab>('login');

  return (
    <div className="min-h-screen bg-[#f8fafc]">
      <div className="max-w-7xl mx-auto px-4 py-8 sm:py-12">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-4">
            <PawsIcon size={48} color="teal" />
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900" style={{ fontFamily: 'var(--font-display)' }}>
              DogCal admin
            </h1>
          </div>
          <p className="text-gray-600 text-lg">
            Manage users, pups, and generate login links
          </p>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-2xl sm:rounded-3xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px overflow-x-auto">
              <button
                onClick={() => setActiveTab('login')}
                className={`py-4 px-6 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                  activeTab === 'login'
                    ? 'border-[#1a3a3a] text-[#1a3a3a] bg-[#1a3a3a]/5'
                    : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
                }`}
              >
                Login as user
              </button>
              <button
                onClick={() => setActiveTab('manage')}
                className={`py-4 px-6 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                  activeTab === 'manage'
                    ? 'border-[#1a3a3a] text-[#1a3a3a] bg-[#1a3a3a]/5'
                    : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
                }`}
              >
                Manage users
              </button>
              <button
                onClick={() => setActiveTab('tokens')}
                className={`py-4 px-6 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                  activeTab === 'tokens'
                    ? 'border-[#1a3a3a] text-[#1a3a3a] bg-[#1a3a3a]/5'
                    : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
                }`}
              >
                Generate tokens
              </button>
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-4 sm:p-6">
            {activeTab === 'login' && (
              <div className="space-y-4">
                <div className="bg-[#f4a9a8]/20 border border-[#f4a9a8]/30 rounded-xl p-4">
                  <p className="text-sm text-[#1a3a3a]">
                    <strong>Admin Testing Mode:</strong> Click a user below to log in as them.
                    This will set your session cookie and redirect you to the home page.
                  </p>
                </div>
                <UserSelector />
              </div>
            )}

            {activeTab === 'manage' && <ManageUsers />}

            {activeTab === 'tokens' && <GenerateTokens />}
          </div>
        </div>
      </div>
    </div>
  );
}
