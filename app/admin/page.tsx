/**
 * Admin Interface
 *
 * Protected admin panel with three tabs:
 * 1. Login as User - User selector for testing
 * 2. Manage Users - Add/edit owners, pups, and friends
 * 3. Generate Tokens - Display login URLs for all users
 *
 * Also serves as a universal login page - accepts both admin tokens
 * and user login tokens.
 */

import AdminClient from './AdminClient';
import TokenLoginForm from './TokenLoginForm';
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

  // No token provided - show login form
  if (!providedToken) {
    return <TokenLoginForm />;
  }

  // Verify if it's the admin token
  if (providedToken !== adminToken) {
    // Not the admin token - show error with login form
    return <TokenLoginForm error="Invalid token. Please try again or contact Edi for access." />;
  }

  // Render admin interface
  return <AdminClient />;
}
