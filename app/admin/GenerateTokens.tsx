'use client';

/**
 * Generate Tokens Component
 *
 * Displays login URLs for all users with copy functionality.
 */

import { useState } from 'react';

interface TokenData {
  userId: string;
  name: string;
  role: string;
  phoneNumber: string | null;
  token: string;
  loginUrl: string;
}

export default function GenerateTokens() {
  const [tokens, setTokens] = useState<TokenData[]>([]);
  const [loading, setLoading] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);

  const generateTokens = async () => {
    setLoading(true);

    try {
      const response = await fetch('/api/admin/tokens');

      if (!response.ok) {
        throw new Error('Failed to generate tokens');
      }

      const data = await response.json();
      setTokens(data.tokens);
    } catch (error) {
      console.error('Error generating tokens:', error);
      alert('Failed to generate tokens');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopiedUrl(url);
      setTimeout(() => setCopiedUrl(null), 2000);
    } catch (error) {
      console.error('Error copying to clipboard:', error);
      alert('Failed to copy to clipboard');
    }
  };

  const sendWhatsApp = (phoneNumber: string, loginUrl: string) => {
    const message = encodeURIComponent(
      `Hi! Here's your personalized login link for DogCal:\n\n${loginUrl}\n\nClick the link to access your account.`
    );
    const whatsappUrl = `https://wa.me/${phoneNumber.replace(/[^0-9]/g, '')}?text=${message}`;
    window.open(whatsappUrl, '_blank');
  };

  return (
    <div className="space-y-6">
      {/* Instructions */}
      <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
        <p className="text-sm text-blue-800">
          <strong>Generate Login URLs:</strong> Click the button below to create personalized
          login links for all users. Share these links via WhatsApp, email, or any other channel.
          Users can bookmark these links for easy access.
        </p>
      </div>

      {/* Generate Button */}
      <div>
        <button
          onClick={generateTokens}
          disabled={loading}
          className="bg-purple-600 text-white py-3 px-6 rounded-md hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-lg font-semibold"
        >
          {loading ? 'Generating...' : 'Generate All Login URLs'}
        </button>
      </div>

      {/* Tokens Table */}
      {tokens.length > 0 && (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border border-gray-200 rounded-lg">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Login URL
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {tokens.map(token => (
                <tr key={token.userId}>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {token.name}
                    </div>
                    {token.phoneNumber && (
                      <div className="text-xs text-gray-500">
                        {token.phoneNumber}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        token.role === 'OWNER'
                          ? 'bg-purple-100 text-purple-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}
                    >
                      {token.role}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <code className="text-xs bg-gray-100 px-2 py-1 rounded break-all">
                      {token.loginUrl}
                    </code>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => copyToClipboard(token.loginUrl)}
                        className={`px-3 py-1 text-sm rounded ${
                          copiedUrl === token.loginUrl
                            ? 'bg-green-600 text-white'
                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        }`}
                      >
                        {copiedUrl === token.loginUrl ? 'Copied!' : 'Copy'}
                      </button>
                      {token.phoneNumber && (
                        <button
                          onClick={() => sendWhatsApp(token.phoneNumber!, token.loginUrl)}
                          className="px-3 py-1 text-sm bg-green-500 text-white rounded hover:bg-green-600"
                        >
                          WhatsApp
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Summary */}
          <div className="mt-4 text-sm text-gray-600">
            <p>
              <strong>Total users:</strong> {tokens.length} (
              {tokens.filter(t => t.role === 'OWNER').length} owners,{' '}
              {tokens.filter(t => t.role === 'FRIEND').length} friends)
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
