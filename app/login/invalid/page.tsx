/**
 * Invalid Token Error Page
 *
 * Shown when a login token is invalid or expired.
 */

import PawsIcon from '@/components/PawsIcon';

export default function InvalidTokenPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f8fafc] px-4">
      <div className="max-w-md w-full text-center">
        <div className="bg-white shadow-sm border border-gray-200 rounded-2xl sm:rounded-3xl p-8">
          <div className="mb-6 flex justify-center">
            <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center">
              <svg
                className="h-8 w-8 text-red-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
          </div>

          <div className="mb-4 flex justify-center">
            <PawsIcon size={48} color="teal" />
          </div>

          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Invalid Login Link
          </h1>

          <p className="text-gray-600 mb-6">
            This login link is invalid or has expired. Please contact Edi for a new link.
          </p>

          <div className="bg-[#1a3a3a]/5 rounded-xl p-4 text-left text-sm text-gray-700">
            <p className="font-semibold mb-2 text-[#1a3a3a]">Need help?</p>
            <p>
              If you believe this is an error, please contact Edi to generate a new login link for you.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
