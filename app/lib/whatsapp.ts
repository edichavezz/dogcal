import twilio from 'twilio';

export type NotificationResult = {
  userId: string;
  userName: string;
  phoneNumber: string | null;
  status: 'sent' | 'skipped' | 'failed';
  reason?: string;
  twilioSid?: string;
};

type SendResult = {
  success: boolean;
  error?: string;
  sid?: string;
};

/**
 * Check if WhatsApp notifications are enabled via environment variable
 */
export function isWhatsAppEnabled(): boolean {
  return process.env.WHATSAPP_ENABLED === 'true';
}

/**
 * Initialize Twilio client
 * Returns null if credentials are missing
 */
function getTwilioClient() {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;

  if (!accountSid || !authToken) {
    console.error('Twilio credentials missing in environment variables');
    return null;
  }

  return twilio(accountSid, authToken);
}

/**
 * Validate if a phone number is valid for WhatsApp
 * Returns true if phone number exists and is not empty
 */
export function isValidPhoneNumber(phone: string | null | undefined): boolean {
  if (!phone) return false;

  // Remove whitespace and check if there's content
  const cleaned = phone.trim();
  if (cleaned.length === 0) return false;

  // Basic validation: should contain digits
  const hasDigits = /\d/.test(cleaned);

  return hasDigits;
}

/**
 * Format phone number for Twilio WhatsApp API
 * Adds country code if missing (defaults to +1 for US numbers)
 * Returns in format: whatsapp:+1234567890
 */
export function formatPhoneNumber(phone: string): string {
  // Remove all non-digit characters
  let cleaned = phone.replace(/\D/g, '');

  // If it's a 10-digit US number, add +1
  if (cleaned.length === 10) {
    cleaned = '1' + cleaned;
  }

  // If it doesn't start with country code, add +1
  if (!cleaned.startsWith('1') && cleaned.length === 10) {
    cleaned = '1' + cleaned;
  }

  // Return in Twilio WhatsApp format
  return `whatsapp:+${cleaned}`;
}

/**
 * Send a WhatsApp message via Twilio
 * Returns result indicating success/failure
 */
export async function sendWhatsAppMessage(
  to: string,
  message: string
): Promise<SendResult> {
  // Check if WhatsApp is enabled
  if (!isWhatsAppEnabled()) {
    return {
      success: false,
      error: 'WhatsApp notifications are disabled',
    };
  }

  // Get Twilio client
  const client = getTwilioClient();
  if (!client) {
    return {
      success: false,
      error: 'Twilio client not configured',
    };
  }

  // Get WhatsApp from number
  const from = process.env.TWILIO_WHATSAPP_FROM;
  if (!from) {
    return {
      success: false,
      error: 'TWILIO_WHATSAPP_FROM not configured',
    };
  }

  try {
    // Format the recipient number
    const formattedTo = formatPhoneNumber(to);

    // Send message via Twilio
    const twilioMessage = await client.messages.create({
      body: message,
      from: from,
      to: formattedTo,
    });

    console.log(`WhatsApp message sent successfully. SID: ${twilioMessage.sid}`);

    return {
      success: true,
      sid: twilioMessage.sid,
    };
  } catch (error) {
    console.error('Error sending WhatsApp message:', error);

    // Extract error message
    let errorMessage = 'Unknown error';
    if (error instanceof Error) {
      errorMessage = error.message;
    }

    return {
      success: false,
      error: errorMessage,
    };
  }
}

/**
 * Send WhatsApp messages to multiple recipients
 * Returns array of results for each recipient
 */
export async function sendBulkWhatsAppMessages(
  recipients: Array<{ id: string; name: string; phoneNumber: string | null }>,
  messageGenerator: (recipient: { id: string; name: string }) => string
): Promise<NotificationResult[]> {
  const results: NotificationResult[] = [];

  for (const recipient of recipients) {
    // Skip if no valid phone number
    if (!isValidPhoneNumber(recipient.phoneNumber)) {
      results.push({
        userId: recipient.id,
        userName: recipient.name,
        phoneNumber: recipient.phoneNumber,
        status: 'skipped',
        reason: 'No valid phone number',
      });
      continue;
    }

    // Generate message for this recipient
    const message = messageGenerator(recipient);

    // Send message
    const result = await sendWhatsAppMessage(recipient.phoneNumber!, message);

    results.push({
      userId: recipient.id,
      userName: recipient.name,
      phoneNumber: recipient.phoneNumber,
      status: result.success ? 'sent' : 'failed',
      reason: result.error,
      twilioSid: result.sid,
    });

    // Add small delay between messages to avoid rate limiting
    if (recipients.length > 1) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  return results;
}
