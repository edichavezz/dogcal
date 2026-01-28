/**
 * Invalid Token Error Page
 *
 * Shown when a login token is invalid or expired.
 */

export default function InvalidTokenPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full text-center">
        <div className="bg-white shadow-lg rounded-lg p-8">
          <div className="mb-4">
            <svg
              className="mx-auto h-16 w-16 text-red-500"
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

          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Invalid Login Link
          </h1>

          <p className="text-gray-600 mb-6">
            This login link is invalid or has expired. Please contact your administrator for a new link.
          </p>

          <div className="bg-gray-50 rounded-md p-4 text-left text-sm text-gray-700">
            <p className="font-semibold mb-2">Need help?</p>
            <p>
              If you believe this is an error, please contact support or ask your administrator to generate a new login link for you.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
