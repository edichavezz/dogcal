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
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
        <p className="text-sm text-amber-900">
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
          className="bg-amber-600 text-white py-3 px-6 rounded-lg hover:bg-amber-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-lg font-semibold transition-colors"
        >
          {loading ? 'Generating...' : '🔑 Generate All Login URLs'}
        </button>
      </div>

      {/* Tokens Table */}
      {tokens.length > 0 && (
        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="min-w-full bg-white">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Login URL
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {tokens.map(token => (
                <tr key={token.userId} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="text-sm font-medium text-slate-900">
                      {token.name}
                    </div>
                    {token.phoneNumber && (
                      <div className="text-xs text-slate-500">
                        📱 {token.phoneNumber}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full border ${
                        token.role === 'OWNER'
                          ? 'bg-orange-50 text-orange-700 border-orange-200'
                          : 'bg-amber-50 text-amber-700 border-amber-200'
                      }`}
                    >
                      {token.role === 'OWNER' ? '🏠 Owner' : '🤝 Friend'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <code className="text-xs bg-slate-100 px-2 py-1 rounded break-all text-slate-700">
                      {token.loginUrl}
                    </code>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => copyToClipboard(token.loginUrl)}
                        className={`px-3 py-1.5 text-sm rounded-lg font-medium transition-colors ${
                          copiedUrl === token.loginUrl
                            ? 'bg-green-500 text-white'
                            : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                        }`}
                      >
                        {copiedUrl === token.loginUrl ? '✓ Copied!' : '📋 Copy'}
                      </button>
                      {token.phoneNumber && (
                        <button
                          onClick={() => sendWhatsApp(token.phoneNumber!, token.loginUrl)}
                          className="px-3 py-1.5 text-sm bg-green-500 text-white rounded-lg hover:bg-green-600 font-medium transition-colors"
                        >
                          💬 WhatsApp
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Summary */}
          <div className="mt-4 px-4 pb-4 text-sm text-slate-600">
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
