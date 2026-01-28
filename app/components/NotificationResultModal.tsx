'use client';

import type { NotificationResult } from '@/lib/whatsapp';

type NotificationResultModalProps = {
  results: NotificationResult[];
  onClose: () => void;
};

export default function NotificationResultModal({ results, onClose }: NotificationResultModalProps) {
  // Categorize results
  const sent = results.filter(r => r.status === 'sent');
  const skipped = results.filter(r => r.status === 'skipped');
  const failed = results.filter(r => r.status === 'failed');

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="border-b border-gray-200 px-6 py-4">
          <h2 className="text-xl font-semibold text-gray-900">
            WhatsApp Notification Results
          </h2>
        </div>

        {/* Content */}
        <div className="px-6 py-4 space-y-6">
          {/* Successfully Sent */}
          {sent.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-green-900 flex items-center gap-2 mb-3">
                <span className="text-lg">✅</span>
                Sent Successfully ({sent.length})
              </h3>
              <ul className="space-y-2">
                {sent.map((result) => (
                  <li
                    key={result.userId}
                    className="text-sm bg-green-50 border border-green-200 rounded px-3 py-2"
                  >
                    <div className="font-medium text-green-900">{result.userName}</div>
                    <div className="text-green-700">{result.phoneNumber}</div>
                    {result.twilioSid && (
                      <div className="text-xs text-green-600 mt-1">
                        Message ID: {result.twilioSid}
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Could Not Notify (Skipped) */}
          {skipped.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-yellow-900 flex items-center gap-2 mb-3">
                <span className="text-lg">⚠️</span>
                Could Not Notify ({skipped.length})
              </h3>
              <ul className="space-y-2">
                {skipped.map((result) => (
                  <li
                    key={result.userId}
                    className="text-sm bg-yellow-50 border border-yellow-200 rounded px-3 py-2"
                  >
                    <div className="font-medium text-yellow-900">{result.userName}</div>
                    <div className="text-yellow-700">
                      {result.phoneNumber || 'No phone number'}
                    </div>
                    {result.reason && (
                      <div className="text-xs text-yellow-600 mt-1">
                        Reason: {result.reason}
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Failed to Send */}
          {failed.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-red-900 flex items-center gap-2 mb-3">
                <span className="text-lg">❌</span>
                Failed to Send ({failed.length})
              </h3>
              <ul className="space-y-2">
                {failed.map((result) => (
                  <li
                    key={result.userId}
                    className="text-sm bg-red-50 border border-red-200 rounded px-3 py-2"
                  >
                    <div className="font-medium text-red-900">{result.userName}</div>
                    <div className="text-red-700">{result.phoneNumber}</div>
                    {result.reason && (
                      <div className="text-xs text-red-600 mt-1">
                        Error: {result.reason}
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* No results at all */}
          {results.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <p>No notifications were sent.</p>
              <p className="text-sm mt-2">
                WhatsApp notifications may be disabled or there are no recipients to notify.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 px-6 py-4 bg-gray-50">
          <button
            onClick={onClose}
            className="w-full bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors font-medium"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
