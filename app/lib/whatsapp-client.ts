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
 * Build a generic, non-personalised message suitable for copying into a group chat or DM.
 * No recipient names, no deeplinks — just the key event details with a title and sign-off.
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
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'DogCal';
  const what = params.eventName
    ? `${params.eventName} for ${params.pupName}`
    : `A hangout for ${params.pupName}`;

  return `DogCal: New Hangout Available!

${what} is coming up:

${dateStr}
${startTime} - ${endTime}

Let us know if you can make it, or log in to claim it:
${appUrl}

Thanks for being a pup friend!`;
}
