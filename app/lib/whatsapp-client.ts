/**
 * Browser-safe WhatsApp utilities.
 * This file must NOT import twilio or any Node.js-only package.
 * Import server-side helpers from @/lib/whatsapp instead.
 */

export type NotificationResult = {
  userId: string;
  userName: string;
  phoneNumber: string | null;
  profilePhotoUrl?: string | null;
  relationship?: string;
  status: 'sent' | 'skipped' | 'failed';
  reason?: string;
  twilioSid?: string;
  whatsappMessage?: string;
};

/**
 * Format phone number for wa.me deeplink.
 * Returns digits-only string with country code, e.g. "447476238512".
 */
export function formatPhoneForWaMe(phone: string): string {
  let cleaned = phone.trim().replace(/\D/g, '');
  // UK 07xxx → 447xxx
  if (cleaned.startsWith('0') && cleaned.length === 11) {
    cleaned = '44' + cleaned.substring(1);
  }
  return cleaned;
}

/**
 * Build a generic, non-personalised message suitable for copying into a group chat.
 * No names, no deeplinks — just the key event details.
 */
export function buildGenericMessage(params: {
  pupName: string;
  startAt: Date | string;
  endAt: Date | string;
  eventName?: string | null;
}): string {
  const start = new Date(params.startAt);
  const end = new Date(params.endAt);
  const dateStr = start.toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
  const startTime = start.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
  const endTime = end.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
  const what = params.eventName || 'hangout';
  return `Hi! Just so you know, ${params.pupName}'s ${what} is on ${dateStr} from ${startTime} to ${endTime}.`;
}
