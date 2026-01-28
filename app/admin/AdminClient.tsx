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

type Tab = 'login' | 'manage' | 'tokens';

export default function AdminClient() {
  const [activeTab, setActiveTab] = useState<Tab>('login');

  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto px-4 py-8 sm:py-12">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-4">
            <span className="text-4xl">🐾</span>
            <h1 className="text-3xl sm:text-4xl font-bold text-slate-900" style={{ fontFamily: 'var(--font-display)' }}>
              DogCal Admin
            </h1>
          </div>
          <p className="text-slate-600 text-lg">
            Manage users, pups, and generate login links
          </p>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="border-b border-slate-200">
            <nav className="flex -mb-px overflow-x-auto">
              <button
                onClick={() => setActiveTab('login')}
                className={`py-4 px-6 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                  activeTab === 'login'
                    ? 'border-amber-500 text-amber-700 bg-amber-50'
                    : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
                }`}
              >
                👤 Login as User
              </button>
              <button
                onClick={() => setActiveTab('manage')}
                className={`py-4 px-6 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                  activeTab === 'manage'
                    ? 'border-amber-500 text-amber-700 bg-amber-50'
                    : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
                }`}
              >
                ⚙️ Manage Users
              </button>
              <button
                onClick={() => setActiveTab('tokens')}
                className={`py-4 px-6 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                  activeTab === 'tokens'
                    ? 'border-amber-500 text-amber-700 bg-amber-50'
                    : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
                }`}
              >
                🔑 Generate Tokens
              </button>
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-4 sm:p-6">
            {activeTab === 'login' && (
              <div className="space-y-4">
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <p className="text-sm text-amber-900">
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
