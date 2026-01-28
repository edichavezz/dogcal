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
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Admin Panel
          </h1>
          <p className="text-gray-600">
            Manage users, pups, and generate login links
          </p>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px">
              <button
                onClick={() => setActiveTab('login')}
                className={`py-4 px-6 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'login'
                    ? 'border-purple-500 text-purple-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Login as User
              </button>
              <button
                onClick={() => setActiveTab('manage')}
                className={`py-4 px-6 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'manage'
                    ? 'border-purple-500 text-purple-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Manage Users
              </button>
              <button
                onClick={() => setActiveTab('tokens')}
                className={`py-4 px-6 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'tokens'
                    ? 'border-purple-500 text-purple-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Generate Tokens
              </button>
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {activeTab === 'login' && (
              <div className="space-y-4">
                <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                  <p className="text-sm text-blue-800">
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
