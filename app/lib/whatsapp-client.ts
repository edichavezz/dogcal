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
