/**
 * Admin Interface
 *
 * Protected admin panel with three tabs:
 * 1. Login as User - User selector for testing
 * 2. Manage Users - Add/edit owners, pups, and friends
 * 3. Generate Tokens - Display login URLs for all users
 */

import AdminClient from './AdminClient';
import PawsIcon from '@/components/PawsIcon';

interface AdminPageProps {
  searchParams: Promise<{
    token?: string;
  }>;
}

export default async function AdminPage({ searchParams }: AdminPageProps) {
  const adminToken = process.env.ADMIN_TOKEN;
  const params = await searchParams;
  const providedToken = params.token;

  // Check if admin access is enabled
  if (!adminToken) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f8fafc]">
        <div className="max-w-md w-full text-center bg-white shadow-sm border border-gray-200 rounded-2xl sm:rounded-3xl p-8">
          <div className="mb-4 flex justify-center">
            <PawsIcon size={48} color="teal" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Admin Access Disabled
          </h1>
          <p className="text-gray-600">
            Admin access is not configured. Please set the ADMIN_TOKEN environment variable.
          </p>
        </div>
      </div>
    );
  }

  // Verify token
  if (providedToken !== adminToken) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f8fafc]">
        <div className="max-w-md w-full text-center bg-white shadow-sm border border-gray-200 rounded-2xl sm:rounded-3xl p-8">
          <div className="mb-6 flex justify-center">
            <div className="w-16 h-16 rounded-full bg-[#f4a9a8]/20 flex items-center justify-center">
              <svg
                className="h-8 w-8 text-[#1a3a3a]"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
            </div>
          </div>

          <div className="mb-4 flex justify-center">
            <PawsIcon size={48} color="teal" />
          </div>

          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Access Denied
          </h1>
          <p className="text-gray-600">
            Invalid admin token. Please contact Edi for access.
          </p>
        </div>
      </div>
    );
  }

  // Render admin interface
  return <AdminClient />;
}
