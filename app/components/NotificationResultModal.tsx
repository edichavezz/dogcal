'use client';

import Avatar from './Avatar';
import { formatPhoneForWaMe, type NotificationResult } from '@/lib/whatsapp';

type NotificationResultModalProps = {
  results: NotificationResult[];
  onClose: () => void;
  title: string;
  subtitle?: string;
};

function formatPhoneDisplay(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  // UK 447xxxxxxxxx → 07xxx xxxxxx
  if (digits.startsWith('44') && digits.length === 12) {
    const local = '0' + digits.substring(2);
    return `${local.substring(0, 5)} ${local.substring(5, 8)} ${local.substring(8)}`;
  }
  return phone;
}

export default function NotificationResultModal({
  results,
  onClose,
  title,
  subtitle,
}: NotificationResultModalProps) {
  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-xl max-w-lg w-full max-h-[85vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🐾</span>
            <h2 className="text-xl font-bold text-[#1a3a3a]">{title}</h2>
          </div>
          {subtitle && (
            <p className="text-sm text-gray-500 mt-1 ml-9">{subtitle}</p>
          )}
        </div>

        {/* Recipient list */}
        <div className="px-4 py-3 space-y-2">
          {results.length === 0 && (
            <p className="text-center text-gray-500 py-6 text-sm">
              No recipients to notify.
            </p>
          )}

          {results.map((result) => {
            const hasPhone = !!result.phoneNumber;
            const canOpenWA = hasPhone && !!result.whatsappMessage;
            const waUrl = canOpenWA
              ? `https://wa.me/${formatPhoneForWaMe(result.phoneNumber!)}?text=${encodeURIComponent(result.whatsappMessage!)}`
              : null;

            return (
              <div
                key={result.userId}
                className="flex items-start gap-3 p-3 rounded-xl bg-gray-50 border border-gray-100"
              >
                <Avatar
                  photoUrl={result.profilePhotoUrl}
                  name={result.userName}
                  size="sm"
                />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 text-sm">{result.userName}</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {result.relationship && `${result.relationship} · `}
                    {hasPhone ? formatPhoneDisplay(result.phoneNumber!) : 'No phone number'}
                  </p>

                  <div className="flex items-center justify-between mt-2 gap-2">
                    {/* Status indicator */}
                    <div className="flex items-center gap-1.5">
                      {result.status === 'sent' && (
                        <>
                          <span className="w-2 h-2 rounded-full bg-green-500 flex-shrink-0" />
                          <span className="text-xs text-green-700">Notified via WhatsApp</span>
                        </>
                      )}
                      {result.status === 'skipped' && !hasPhone && (
                        <>
                          <span className="w-2 h-2 rounded-full bg-gray-300 flex-shrink-0" />
                          <span className="text-xs text-gray-500">No phone number on file</span>
                        </>
                      )}
                      {result.status === 'skipped' && hasPhone && (
                        <>
                          <span className="w-2 h-2 rounded-full bg-gray-300 flex-shrink-0" />
                          <span className="text-xs text-gray-500">Notifications paused</span>
                        </>
                      )}
                      {result.status === 'failed' && (
                        <>
                          <span className="text-amber-500 text-xs flex-shrink-0">⚠</span>
                          <span className="text-xs text-amber-700">Delivery issue — send it yourself</span>
                        </>
                      )}
                    </div>

                    {/* Open in WhatsApp button */}
                    {waUrl && (
                      <a
                        href={waUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-green-700 font-medium flex items-center gap-1 hover:text-green-800 flex-shrink-0 whitespace-nowrap"
                      >
                        ↗ Open WhatsApp
                      </a>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="px-6 pb-6 pt-2">
          <button
            onClick={onClose}
            className="w-full bg-[#1a3a3a] text-white px-4 py-3 rounded-xl hover:bg-[#2a4a4a] transition-colors font-medium"
          >
            Done →
          </button>
        </div>
      </div>
    </div>
  );
}
